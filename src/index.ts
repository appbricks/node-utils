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
  ActionResult,
  createAction, 
  createFollowUpAction, 
  createErrorAction,
  serviceEpic,
  serviceEpicFanOut,
  combineEpicsWithGlobalErrorHandler
} from './redux/action';
export { 
  SUCCESS, 
  ERROR,
  NOOP,
  Action, 
  ErrorPayload, 
  ActionResult,
  createAction, 
  createFollowUpAction, 
  createErrorAction,
  serviceEpic,
  serviceEpicFanOut,
  combineEpicsWithGlobalErrorHandler
};

import {
  State
} from './redux/state';
export {
  State
};

import LocalStorage, {
  Storage,
  setLocalStorageImpl
} from './persistence/local-storage';
export { LocalStorage, Storage, setLocalStorageImpl };

import Error from './utility/error';
export { Error };

import { sleep, execAfter } from './utility/timer';
export { sleep, execAfter };

import { functionKey } from './utility/functions';
export { functionKey };

import { hexToRgba } from './utility/colors';
export { hexToRgba };
