import * as redux from 'redux';
import { Observable, of, from, concat } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators'
import { 
  Epic, 
  ActionsObservable, 
  StateObservable, 
  ofType, 
  combineEpics 
} from 'redux-observable';

import Logger from '../log/logger';

import { State } from './state';

/**
 * Common action types
 */

export const SUCCESS = 'SUCCESS';
export const ERROR = 'ERROR';
export const NOOP = 'NOOP';

export const RESET_STATUS = 'RESET_STATUS';

/**
 * Common redux action base type with payload
 * and meta fields.
 */
export interface Action<P = any> extends redux.Action<string> {
  payload?: P,
  meta: {
    timestamp: number
    intentTag?: string
    relatedAction?: Action
    statusHook?: ActionStatusHook
  }
};

type ActionStatusHook<P = any> = (
  status: ActionStatus, 
  action: Action,
  state: State
) => void;

/**
 * Error payload
 */
export interface ErrorPayload {
  err: Error,
  message: string
};

/**
 * Reset payload
 */
export interface ResetStatusPayload {
  actionStatus: ActionStatus
};

/**
 * Status and/or result of an action execution
 */
export interface ActionStatus {
  actionType: string
  result: ActionResult

  // any data from the execution of the last action.
  // this data will only last within the state until 
  // the next action is dispatched.
  data: { [ key: string ]: any }  
}

export enum ActionResult {
  none = 0,
  pending,
  success,
  info,
  warn,
  error
}

/**
 * Creates a redux action with a unique string 
 * type name with the given payload and intent
 * tag which uniquely associates the intention
 * of the user that resulted in this action.
 * 
 * @param type       a unique action type identifier
 * @param payload    the payload the action is associated with
 * @param intentTag  a unique intent tag
 */
export function createAction<P>(
  type: string, 
  payload?: P, 
  intentTag?: string,
  statusHook?: ActionStatusHook<P | ErrorPayload>): Action<P> {

  let action: Action<P> = {
    type,
    payload,
    meta: {
      timestamp: Date.now(),
      intentTag,
      statusHook
    }
  };

  Logger.trace('createAction', 'Creating action', action)
  return action;
}

/**
 * Creates a redux action with a unique string 
 * type name with the given payload and intent
 * tag which uniquely associates the intention
 * of the user that resulted in this action.
 * This action will be the continuation of a
 * previous action and that is identified as
 * the 'relatedAction'.
 * 
 * @param relatedAction  the action that resulted in this action
 * @param type           a unique action type identifier
 * @param payload        the payload the action is associated with
 * @param intentTag      a unique intent tag
 */
export function createFollowUpAction<P1, P2 = any>(
  relatedAction: Action<P2>, 
  type: string, 
  payload?: P1, 
  intentTag?: string): Action<P1> {

  let action: Action<P1> = {
    type,
    payload,
    meta: {
      timestamp: Date.now(),
      intentTag,
      relatedAction
    }
  };

  Logger.trace('createFollowUpAction', 'Creating followup action', action)
  return action;
}

/**
 * Creates a ERROR action with error details
 * and related action that had the error.
 * 
 * @param err            the error instance
 * @param relatedAction  the action that resulted in this action
 * @param message        a detailed error message
 */
export function createErrorAction(
  err: Error | any,
  relatedAction?: Action<any>,
  message?: string
): Action<ErrorPayload> {

  let action: Action<ErrorPayload> = {
    type: ERROR,
    payload: {
      err: err instanceof Error ? err : new Error(err),
      message: message ? message : err.message || `${err}`
    },
    meta: {
      timestamp: Date.now(),
      relatedAction
    }
  };

  Logger.trace('createErrorAction', 'Creating error action', action);
  Logger.trace('createErrorAction', 'Related action with error', relatedAction);
  Logger.trace('createErrorAction', 'Error being handled', err);
  return action;
}

/**
 * Creates a RESET action to clear the action
 * status related to a particular action.
 * 
 * @param err            the error instance
 * @param relatedAction  the action that resulted in this action
 * @param message        a detailed error message
 */
export function createResetStatusAction(
  actionStatus: ActionStatus
): Action<ResetStatusPayload> {

  let action: Action<ResetStatusPayload> = {
    type: RESET_STATUS,
    payload: {
      actionStatus,
    },
    meta: {
      timestamp: Date.now(),      
    }
  };

  return action;
}

/**
 * Sets the action status in the given state
 * instance. This function will also execute
 * the action hook if available.
 * 
 * @param state   the state to save the status in
 * @param result  the action result
 * @param action  the action that caused the state change
 * @param alert   alerts resulting from the execution of the action
 * @param data    transient action data
 */
export function setActionStatus<S extends State>(
  state: S, 
  action: Action,
  result: ActionResult,
  data: { [ key: string ]: any } = {}
): S {

  const actionStatus = <ActionStatus>{
    actionType: action.type,
    result,
    data
  }
  if (action.meta.relatedAction && action.meta.relatedAction.meta.statusHook) {
    Logger.trace('setActionStatus', 'Calling status hook for action ', action.meta.relatedAction.type);
    action.meta.relatedAction.meta.statusHook(actionStatus, action, state);
  }
  if (action.meta.statusHook) {
    Logger.trace('setActionStatus', 'Calling status hook for action ', action.type);
    action.meta.statusHook(actionStatus, action, state);
  }
  return {
    ...state,
    actionStatus
  }
}

/**
 * Reset the action status in the given state.
 * 
 * @param state   the state to save the status in
 */
export function resetActionStatus<S extends State>(
  state: S, 
): S {

  return {
    ...state,
    actionStatus: {
      result: ActionResult.none
    },
  }
}

/**
 * Returns a Epic to map an action of 
 * a given type to a service callback.
 * 
 * @param type            the request action type
 * @param serviceApiCall  the service API invocation callback
 */
export function serviceEpic<P, S>(
  type: string, 
  serviceApiCall: (action: Action<P>, state: StateObservable<S>) => Promise<Action<any>>
): Epic {

  return (action$: ActionsObservable<Action<P>>, state$: StateObservable<S>) => action$.pipe(
    ofType(type),
    mergeMap(async action => {
      try {
        return await serviceApiCall(action, state$);
      } catch (err) {
        return createErrorAction(err, action);
      }
    })
  );
}

/**
 * Returns a Epic to map an action of 
 * a given type to multiple service actions.
 * 
 * @param type             the request action type
 * @param serviceApiCalls  list of service API invocation callbacks
 */
export function serviceEpicFanOut<P, S>(
  type: string, 
  serviceApiCallMap: {
    [name: string]: (
      action: Action<P>, 
      state: StateObservable<S>, 
      // executed service API call promises that can be waited on
      callSync: { [name: string]: Promise<Action> }
    ) => Promise<Action>
  }
): Epic {

  // save action in flight for inclusion
  // with error handling
  var actionInFlight: Action<P>;

  return (action$, state$) => action$.pipe(
    ofType(type),
    mergeMap(action => {
      actionInFlight = action; 

      let callQueue: Promise<Action>[] = [];
      let callSync: { [name: string]: Promise<Action> } = {};
      
      for (let name in serviceApiCallMap) {
        let serviceApiCall = serviceApiCallMap[name];
        let callPromise = serviceApiCall(action, state$, callSync);
        callSync[name] = callPromise;
        callQueue.push(callPromise);
      }

      return concat(...callQueue.map(p => from(p)));
    }),
    catchError(err => 
      of(createErrorAction(err, actionInFlight))
    )
  );
}

/**
 * Uncaught errors can bubble up to the root epic and cause 
 * the entire stream to terminate. To alleviate this issue, 
 * a global error handler is added to the root epic that 
 * catches uncaught errors and resubscribes to the source 
 * stream.
 * 
 * @param epics         epics to combine
 * @param errorHandler  an error handler callback
 */
export function combineEpicsWithGlobalErrorHandler(
  epics: Epic[],
  errorHandler?: (error: any, source: any) => void
): (action$: ActionsObservable<any>, state$: StateObservable<any>, dependencies: any) => Observable<any> {

  return (action$: ActionsObservable<any>, state$: StateObservable<any>, dependencies: any): Observable<any> => 
    combineEpics(...epics)(action$, state$, dependencies).pipe(
      catchError((error, source) => {
        Logger.error('Re-subscribing to the stream as unhandled exception caught from action stream:', error);
        if (errorHandler) {
          errorHandler(error, source);
        }
        return source;
      })
  );
}

/**
 * Merges all properties in the given array of objects
 * and returns an object with the properties combined.
 * 
 * @param propLists  List of objects whose properties should be combined
 */
export function combineProps(propLists: Object[]): Object {
  let combinedList = {};
  propLists.forEach(propList => Object.assign(combinedList, propList));
  return combinedList;
}
