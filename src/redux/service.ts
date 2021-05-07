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

import { Action, createErrorAction } from './action';

/**
 * Service Abstraction
 * 
 * S  - Reducer state type (the store state property to reduce)
 * P  - Action Payload type (to apply to the reduce function)
 * St - Store state type
 * Sp - Subscribed state props type
 * Dp - Dispatch function props type
 */
export default abstract class Service<S = any, P = any, St = any, Sp = any, Dp = any> {
  
  /**
   * Returns the {mapStateToProps?: (state, ownProps?) => Object}
   * provided to the react redux connect() function to allow the
   * wrapper component to subscribe to the store updates. It provides
   * the state properties subscribed to, which will be mapped to the 
   * wrapper components properties.
   * 
   * https://react-redux.js.org/api/connect#mapstatetoprops-state-ownprops--object
   * 
   * @param state     the store state 
   * @param ownProps  wrapper component's properties
   */
  abstract stateProps<C extends Sp>(state: St, ownProps?: C): Sp

  /**
   * Returns the {mapDispatchToProps?: Function | Object} provided
   * to the react redux connect() function to add dispatch functions
   * to the wrapper component.
   * 
   * https://react-redux.js.org/api/connect#mapdispatchtoprops-object--dispatch-ownprops--object
   * 
   * @param dispatch   the dispatch function for the store
   * @param ownProps   wrapper component's properties
   */
  abstract dispatchProps<C extends Sp>(dispatch: redux.Dispatch<redux.Action>, ownProps?: C): Dp

  /**
   * RxJS observable interceptors that subscribe to 
   * dispatched actions and implement side-effects such as
   * service backend calls.
   */
  abstract epics(): Epic[]

  /**
   * The store reducer function that processes the payload
   * of the dispatched actions and reduces the store state
   * property for the service.
   */
  abstract reducer(): redux.Reducer<S, Action<P>>
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
): (action$: ActionsObservable<redux.Action>, state$: StateObservable<any>, dependencies: any) => Observable<redux.Action> {

  return (action$: ActionsObservable<redux.Action>, state$: StateObservable<any>, dependencies: any): Observable<redux.Action> => 
    combineEpics(...epics)(action$, state$, dependencies).pipe(
      catchError((error, source) => {
        
        Logger.error(
          combineEpicsWithGlobalErrorHandler.name,
          'Re-subscribing to the stream as unhandled exception caught from action stream:', 
          error);

        if (errorHandler) {
          errorHandler(error, source);
        }
        return source;
      })
  );
}
