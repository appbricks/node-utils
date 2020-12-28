import Logger from '../log/logger';

import { Action } from './action';
import { State } from './state';

/**
 * Reset action and payload
 */
export const RESET_STATUS = 'RESET_STATUS';

export interface ResetStatusPayload {
  actionStatus: ActionStatus
};

/**
 * Action status hook provided with
 * actions and called back when status
 * is being set.
 */
export type ActionStatusHook<P = any> = (
  status: ActionStatus, 
  action: Action,
  state: State
) => void;

/**
 * Status and/or result of an action execution
 */
export interface ActionStatus {
  actionType: string
  result: ActionResult

  timestamp: number;

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
    timestamp: Date.now(),
    data
  }
  if (action.meta.relatedAction && action.meta.relatedAction.meta.statusHook) {
    Logger.trace(setActionStatus.name, 'Calling status hook for action ', action.meta.relatedAction.type);
    action.meta.relatedAction.meta.statusHook(actionStatus, action, state);
  }
  if (action.meta.statusHook) {
    Logger.trace(setActionStatus.name, 'Calling status hook for action ', action.type);
    action.meta.statusHook(actionStatus, action, state);
  }
  
  // update status list with any 
  // status with given type removed
  const updatedStatus = state.status.filter(
    status => status.actionType !== action.type
  )
  if (updatedStatus.length == state.status.length) {
    // add new status
    updatedStatus.push(actionStatus);
    return {
      ...state,
      status: updatedStatus
    }  
  } else {
    // replace existing status
    return {
      ...state,
      status: [
        ...updatedStatus,
        actionStatus
      ]
    }
  }
}

/**
 * Checks if any one of the action statuses 
 * in the state is in pending state
 * 
 * @param state  the state in which to do the status check 
 */
export function isStatusPending<S extends State>(
  state: S
): boolean {
  return state.status.some(
    status => status.result == ActionResult.pending
  );
}

/**
 * Reset the action status in the given state.
 * 
 * @param state   the state in which the status needs to be reset
 */
export function resetActionStatus<S extends State>(
  actionType: string,
  state: S, 
): S {

  // remove any action status 
  // with give action type
  const status = state
    .status
      .filter(
        status => status.actionType !== actionType
      );

  return {
    ...state,
    status
  }
}
