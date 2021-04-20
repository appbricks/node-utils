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
