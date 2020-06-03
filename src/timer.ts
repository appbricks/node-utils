/*
 * Copyright 2018-2018 AppBricks, Inc. or its affiliates. All Rights Reserved.
 */

/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */
/* eslint @typescript-eslint/no-empty-function: 0 */

const emptyPromise = new Promise(() => {});

/**
 * Returns a promise that can be paused on for the given
 * number of seconds.
 *
 * i.e.
 *
 * await sleep(1000)
 *
 * will pause for 1000 milliseconds
 *
 * @param delay  time to sleep
 */
export function sleep(delay: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Triggers a callback function after a
 * certain delay has elapsed. The callback
 * can be explicitly canceled or validated
 * via Promise semantics.
 *
 * @param {() => any} cb      the callback function which returns true or false
 * @param {number}    delay   the delay in milliseconds to wait before triggering
 * @param {boolean}   repeat  if true then timer will reset and callback will be
 *                                called again after the given delay. if the callback
 *                                returns false then the cycle will be interrupted.
 */
export function execAfter(
  cb: () => any,
  delay: number,
  repeat = false,
): {
  promise: Promise<any>;
  cancel: () => void;
  count: number;
  resp: any;
} {
  const t: {
    promise: Promise<any>;
    cancel: () => void;

    count: number;
    resp: any;
  } = {
    promise: emptyPromise,
    cancel: () => {},

    count: 0,
    resp: null,
  };

  const e = (resolve: any, reject: any) => {
    try {
      t.count++;
      const resp = cb();
      if (!repeat || !resp) {
        resolve(resp);
      } else {
        t.resp = resp;
        const timer = setTimeout(() => e(resolve, reject), delay);
        t.cancel = () => {
          clearTimeout(timer);
          resolve('canceled');
        };
      }
    } catch (exception) {
      reject(exception);
    }
  };

  t.promise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => e(resolve, reject), delay);
    t.cancel = () => {
      clearTimeout(timer);
      reject('canceled');
    };
  });
  return t;
}
