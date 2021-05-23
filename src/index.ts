import Logger, {
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  setLogLevel,
  reduxLogger,
} from './log/logger';
export { Logger,
  LOG_LEVEL_TRACE,
  LOG_LEVEL_DEBUG,
  LOG_LEVEL_INFO,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
  setLogLevel,
  reduxLogger
};

import {
  SUCCESS,
  ERROR,
  NOOP,
  Action,
  ErrorPayload,
  createAction,
  createFollowUpAction,
  createErrorAction
} from './redux/action';
export {
  SUCCESS,
  ERROR,
  NOOP,
  Action,
  ErrorPayload,
  createAction,
  createFollowUpAction,
  createErrorAction
};

import {
  RESET_STATUS,
  ResetStatusPayload,
  ActionStatus,
  ActionResult,
  createResetStatusAction,
  setActionStatus,
  resetActionStatus,
  isStatusPending,
  getLastStatus
} from './redux/status';
export {
  RESET_STATUS,
  ResetStatusPayload,
  ActionStatus,
  ActionResult,
  createResetStatusAction,
  setActionStatus,
  resetActionStatus,
  isStatusPending,
  getLastStatus
};

import Service, {
  serviceEpic,
  serviceEpicFanOut,
  combineEpicsWithGlobalErrorHandler
} from './redux/service';
export {
  Service,
  serviceEpic,
  serviceEpicFanOut,
  combineEpicsWithGlobalErrorHandler
};

import {
  State,
  reducerDelegate
} from './redux/state';
export {
  State,
  reducerDelegate
};

import LocalStorage, {
  Storage,
  setLocalStorageImpl
} from './persistence/local-storage';
export { LocalStorage, Storage, setLocalStorageImpl };

import Error from './utility/error';
export { Error };

export { sleep, execAfter } from './utility/timer';
export { functionKey } from './utility/function';
export { combineProps } from './utility/object';
export { hexToRgba } from './utility/color';
export { bytesToSize } from './utility/format';
