import * as redux from 'redux';
import { v4 as uuidv4 } from 'uuid';

import Logger from '../log/logger';

import { ActionStatusHook } from './status';

/**
 * Common action types
 */

export const BROADCAST = 'BROADCAST';
export const SUCCESS = 'SUCCESS';
export const ERROR = 'ERROR';
export const NOOP = 'NOOP';

/**
 * Common redux action base type with payload
 * and meta fields.
 */
export interface Action<P = any> extends redux.Action<string> {
  payload?: P,
  meta: {
    uuid: string
    timestamp: number
    intentTag?: string
    relatedAction?: Action
    statusHook?: ActionStatusHook
  }
};

/**
 * Broadcast payload - the payload has the 
 * same structure as a graphql type
 */
export interface BroadCastPayload {
  [key: string]: any
  __typename: string
};

/**
 * Error payload
 */
export interface ErrorPayload {
  err: Error,
  message: string,
  errData?: {[key: string]: any}
};

/**
 * Creates a redux action with a unique string
 * type name with the given payload and intent
 * tag which uniquely associates the intention
 * of the user that resulted in this action.
 *
 * @param type        a unique action type identifier
 * @param payload     the payload the action is associated with
 * @param intentTag   a unique intent tag
 * @param statusHook  a callback hook called when action result status is created
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
      uuid: uuidv4(),
      timestamp: Date.now(),
      intentTag,
      statusHook
    }
  };

  Logger.trace(createAction.name,
    'Creating action', action)

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
  intentTag?: string,
  statusHook?: ActionStatusHook<P1 | ErrorPayload>): Action<P1> {

  let action: Action<P1> = {
    type,
    payload,
    meta: {
      uuid: relatedAction.meta.uuid,
      timestamp: Date.now(),
      intentTag,
      relatedAction,
      statusHook
    }
  };

  Logger.trace(createFollowUpAction.name,
    'Creating followup action', action)

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
  message?: string,
  errData?: {[key: string]: any}
): Action<ErrorPayload> {

  let action: Action<ErrorPayload> = {
    type: ERROR,
    payload: {
      err: err instanceof Error ? err : new Error(err),
      message: message ? message : err.message || JSON.stringify(err),
      errData
    },
    meta: {
      uuid: relatedAction ? relatedAction.meta.uuid : uuidv4(),
      timestamp: Date.now(),
      relatedAction
    }
  };

  Logger.trace(createErrorAction.name,
    'Creating error action', action);
  Logger.trace(createErrorAction.name,
    'Related action with error', relatedAction);
  Logger.trace(createErrorAction.name,
    'Error being handled', err);

  return action;
}

/**
 * Helper function for service API calls to handle a 
 * success action that has another action side-effect
 * 
 * @param actionServiceCall  service call returning the action to check for success
 * @param successAction      the action side effect
 * 
 * @returns the action side effect or NOOP if the 
 *          result of the service call was not a 
 *          SUCCESS or an error occurred
 */
export async function onSuccessAction(actionServiceCall: Promise<Action>, successAction: Action): Promise<Action> {
  try {
    let dependsAction = await actionServiceCall;
    if (dependsAction.type == SUCCESS) {
      return successAction;
    }
  } catch (error) {
    // ignore callSync error as this 
    // would have already been handled
  }
  return createAction(NOOP);
}
