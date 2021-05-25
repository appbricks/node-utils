import * as redux from 'redux';
import { v4 as uuidv4 } from 'uuid';

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

  uuid: string;
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
      uuid: uuidv4(),
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
    uuid: action.meta.uuid,
    timestamp: Date.now(),
    data
  }
  Logger.trace(setActionStatus.name, 'Created action status:', actionStatus);
  
  if (action.meta.relatedAction && action.meta.relatedAction.meta.statusHook) {
    Logger.trace(setActionStatus.name, 'Calling status hook for action:', action.meta.relatedAction.type);
    action.meta.relatedAction.meta.statusHook(actionStatus, action, state);
  }
  if (action.meta.statusHook) {
    Logger.trace(setActionStatus.name, 'Calling status hook for action:', action.type);
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

/**
 * Checks if any one of the action statuses
 * in the state is in pending state
 *
 * @param state        the state in which to do the status check
 * @param actionTypes  the action types for which pending state
 *                     should be checked. if not provided then
 *                     check will be done for any pending state.
 */
export function isStatusPending<S extends State>(
  state: S,
  ...actionTypes: string[]
): boolean {
  return state.status.some(
    status =>
      status.result == ActionResult.pending &&
      (actionTypes.length == 0 || actionTypes.some(type => status.actionType == type))
  );
}

/**
 * Retreives the last status added to the status stack.
 * 
 * @param    state 
 * @returns  the last status
 */
export function getLastStatus<S extends State>(
  state: S
): ActionStatus {
  return state.status.reduce(
    (lastStatus, status) => {
      if (!lastStatus ||
        status.timestamp >= lastStatus.timestamp) {
        return status;
      } else {
        return lastStatus;
      }
    }
  );
}

/**
 * Tracks action status using an Action UUID
 */
export class ActionStatusTracker {

  private actionsInFlight: { [ actionType: string ]: string[] }

  constructor() {
    this.actionsInFlight = {};
  }

  /**
   * Start tracking an action's UUID
   * 
   * @param action action to track
   */
  track(action: redux.Action) {
    const extendedAction = <Action>action;
    if (extendedAction.meta) {
      let idsTracked = this.actionsInFlight[action.type];
      if (!idsTracked) {
        idsTracked = [];
        this.actionsInFlight[action.type] = idsTracked;
      }
      idsTracked.push(extendedAction.meta.uuid);  
    }
  }

  /**
   * Untrack an action's UUID
   * 
   * @param actionStatus action status of action 
   *                     with UUID to track
   * 
   * @returns true if action status uuid was being 
   *          tracked and was removed
   */
  untrack(actionStatus: ActionStatus): boolean {
    let idsTracked = this.actionsInFlight[actionStatus.actionType];
    if (idsTracked) {
      const numIds = idsTracked.length;
      
      // remove uuid of given action status
      idsTracked = idsTracked.filter(uuid => uuid != actionStatus.uuid);
      if (idsTracked.length > 0) {
        this.actionsInFlight[actionStatus.actionType] = idsTracked;
      } else {
        delete this.actionsInFlight[actionStatus.actionType];
      }
      return (idsTracked.length < numIds);
    }
    return false;
  }

  /**
   * Check if the ids of action's with the given type
   * are being tracked which are in pending state
   * 
   * @param actionType action type to check
   * @param state      the relevant state affected 
   *                   by the actions being tracked
   * 
   * @returns true if an id was found for the given
   *          action type and it is still pending
   */
  isStatusPending<S extends State>(actionType: string, state: S) {
    let idsTracked = this.actionsInFlight[actionType];
    if (idsTracked && idsTracked.length > 0) {
      return state.status.some(
        status =>
          status.result == ActionResult.pending  &&
          idsTracked.some(uuid => status.uuid == uuid)
      );
    } else {
      return false;
    }
  }
}
