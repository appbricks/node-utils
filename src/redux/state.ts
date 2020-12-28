import Logger from '../log/logger';

import { 
  SUCCESS, 
  ERROR, 
  Action 
} from './action';
import { 
  RESET_STATUS,
  ResetStatusPayload,
  ActionStatus,
  ActionResult,
  setActionStatus,
  resetActionStatus
} from './status';

/**
 * Base State type
 */
export interface State {
  status: ActionStatus[]
};

/**
 * 
 * 
 * @param state 
 * @param action 
 * @param actionSet 
 * @param delegateReducer 
 */
export function reducerDelegate<S extends State, P = any>(
  state: S,
  action: Action,
  actionSet: Set<string>,
  delegateReducer: Reducer<S, P>,
): S {

  const relatedAction = action.meta.relatedAction!;

  switch (action.type) {

    case SUCCESS: { 
      // process actions with a related action type
      // that is within the provided set of actions      
      if (relatedAction && actionSet.has(relatedAction.type)) {

        Logger.error(reducerDelegate.name,
          'Handling SUCCESS action for related action:',
          relatedAction.type);

        return setActionStatus<S>(
          // delegate to reducer that should handle any SUCCESS 
          // actions related to the given set of actions
          delegateReducer(state, action),

          relatedAction,
          ActionResult.success
        );
      }
      break;
    }
    case ERROR: {
      // process actions with a related action type
      // that is within the provided set of actions      
      if (relatedAction && actionSet.has(relatedAction.type)) {

        Logger.error(reducerDelegate.name,
          'Handling ERROR action for related action:',
          relatedAction.type);

        return setActionStatus<S>(
          state,
          relatedAction,
          ActionResult.error,
          {
            error: action.payload
          }
        );
      }
      break;
    }
    case RESET_STATUS: {

      const actionStatusMetaType = 
        (<ResetStatusPayload>action.payload)
          .actionStatus.actionType;

      if (actionSet.has(actionStatusMetaType)) {

        Logger.error(reducerDelegate.name,
          'Reseting action status for action:',
          actionStatusMetaType);
        
        return resetActionStatus<S>(
          actionStatusMetaType, 
          state
        );        
      }
      break;
    }
    default: {
      // if action type is within the provided set
      // of actions then set the status as pending
      // which will be updated once a SUCCESS or
      // ERROR action is received with this action
      // as its related action.
      if (actionSet.has(action.type)) {
        return setActionStatus<S>(
          state,
          action,
          ActionResult.pending
        );
      }    
    }
  }
  return state;
}

export type Reducer<S extends State, P> = (
  state: S,
  action: Action<P>,
) => S;
