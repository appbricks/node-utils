/*
 * Copyright 2018-2018 AppBricks, Inc. or its affiliates. All Rights Reserved.
 */

/* eslint @typescript-eslint/no-explicit-any: 0 */
/* eslint @typescript-eslint/explicit-module-boundary-types: 0 */

const META = '__listener_id';
let fnID = 0;

/**
 * Adds a key to a function object.
 *
 * @param {any} fn  the function object to associate the key with
 */
export function functionKey(fn: any): string {
  if (!Object.prototype.hasOwnProperty.call(fn, META)) {
    if (!Object.isExtensible(fn)) {
      return 'F';
    }

    Object.defineProperty(fn, META, {
      value: 'L' + ++fnID,
    });
  }

  return fn[META];
}
