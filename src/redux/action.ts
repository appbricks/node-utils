import * as redux from 'redux';

import Logger from '../log/logger';

import { ActionStatusHook } from './status';

/**
 * Common action types
 */

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
    timestamp: number
    intentTag?: string
    relatedAction?: Action
    statusHook?: ActionStatusHook
  }
};

/**
 * Error payload
 */
export interface ErrorPayload {
  err: Error,
  message: string
};

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

  Logger.trace(createErrorAction.name, 
    'Creating error action', action);
  Logger.trace(createErrorAction.name, 
    'Related action with error', relatedAction);
  Logger.trace(createErrorAction.name, 
    'Error being handled', err);
    
  return action;
}
