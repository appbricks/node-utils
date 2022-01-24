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

import LocalStorage, {
  Storage,
  setLocalStorageImpl
} from './persistence/local-storage';
export { LocalStorage, Storage, setLocalStorageImpl };

import Error from './utility/error';
export { Error };

export * from './redux/state';
export * from './redux/action';
export * from './redux/status';
export * from './redux/service';
export * from './utility/timer';
export * from './utility/function';
export * from './utility/object';
export * from './utility/color';
export * from './utility/format';
export * from './utility/collections';
