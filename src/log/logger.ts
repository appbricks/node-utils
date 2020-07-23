/*
 * Copyright 2018-2018 AppBricks, Inc. or its affiliates. All Rights Reserved.
 */

/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

// LOG_LEVEL_TRACE_C will output the component object
// on each render. This can cause performance issues
// the simulator and should be enabled only if necessary.
// This level causes issues if "DEBUG_JS_REMOTELY"
// options is not enabled.
export const LOG_LEVEL_TRACE_C = 0;

export const LOG_LEVEL_TRACE = 1;
export const LOG_LEVEL_DEBUG = 2;
export const LOG_LEVEL_INFO = 3;
export const LOG_LEVEL_WARN = 4;
export const LOG_LEVEL_ERROR = 5;

let __LOG_LEVEL__ = LOG_LEVEL_ERROR;

function timeStamp() {
  const now = new Date();
  const date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()];
  const suffix = time[0] < 12 ? 'AM' : 'PM';

  // Convert hour from military time
  time[0] = time[0] < 12 ? time[0] : time[0] - 12;
  // If hour is 0, set it to 12
  time[0] = time[0] || 12;

  const dateS = new Array<string>(3);
  const timeS = new Array<string>(3);

  // Prefix with '0' to ensure
  // fields have consistent length

  for (let i = 0; i < 2; i++) {
    if (date[i] < 10) {
      dateS[i] = '0' + date[i].toString();
    } else {
      dateS[i] = date[i].toString();
    }
  }
  dateS[2] = date[2].toString();

  for (let i = 0; i < 3; i++) {
    if (time[i] < 10) {
      timeS[i] = '0' + time[i].toString();
    } else {
      timeS[i] = time[i].toString();
    }
  }

  // Return the formatted string
  return dateS.join('/') + ' ' + timeS.join(':') + ' ' + suffix;
}

export default class Logger {
  private name: string;

  /**
   * Construct a logger instance.
   *
   * @param {any} src  the logging source instance
   */
  constructor(src: any) {
    if (src instanceof Object) {
      this.name = src.constructor.name;
    } else {
      this.name = src;
    }
  }

  static logRender(C: any) {
    if (__LOG_LEVEL__ == LOG_LEVEL_TRACE_C) {
      console.log('%c[' + timeStamp() + '] Rendering component: ', 'color: #000099; font-weight: bold', C);
    }
  }

  trace(message: string, ...args: any[]) {
    if (__LOG_LEVEL__ == LOG_LEVEL_TRACE) {
      Logger.trace(this.name, message, ...args);
    }
  }

  static trace(name: string, message: string, ...args: any[]) {
    if (__LOG_LEVEL__ == LOG_LEVEL_TRACE) {
      console.log('[' + timeStamp() + '] TRACE (' + name + '): ' + message, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_DEBUG) {
      Logger.debug(this.name, message, ...args);
    }
  }

  static debug(name: string, message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_DEBUG) {
      console.log('[' + timeStamp() + '] DEBUG (' + name + '): ' + message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_INFO) {
      Logger.info(this.name, message, ...args);
    }
  }

  static info(name: string, message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_INFO) {
      console.log(
        '%c[' + timeStamp() + '] INFO (' + name + '): ' + message,
        'color: #009933; font-style: italic',
        ...args,
      );
    }
  }

  warn(message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_WARN) {
      Logger.warn(this.name, message, ...args);
    }
  }

  static warn(name: string, message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_WARN) {
      console.log(
        '%c[' + timeStamp() + '] WARN (' + name + '): ' + message,
        'color: #FF9933; font-weight: bold',
        ...args,
      );
    }
  }

  error(message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_ERROR) {
      Logger.error(this.name, message, ...args);
    }
  }

  static error(name: string, message: string, ...args: any[]) {
    if (__LOG_LEVEL__ <= LOG_LEVEL_ERROR) {
      console.log(
        '%c[' + timeStamp() + '] ERROR (' + name + '): ' + message,
        'color: #CC0000; font-weight: bold',
        ...args,
      );
    }
  }
}

/**
 * Set the logging level
 *
 * @param {number} logLevel  the log level
 */
export function setLogLevel(logLevel: number) {
  __LOG_LEVEL__ = logLevel;
}

/**
 * Logging middleware for redux.
 *
 * @param {{getState: any}} {{getState}}  the redux state object container
 */
export function reduxLogger({ getState }: { getState: any }) {
  return (next: any) => (action: any) => {
    Logger.trace('redux', 'will dispatch', action);

    // Call the next dispatch method in the middleware chain.
    const returnValue = next(action);

    Logger.trace('redux', 'state after dispatch', getState());

    // This will likely be the action itself, unless
    // a middleware further in chain changed it.
    return returnValue;
  };
}
