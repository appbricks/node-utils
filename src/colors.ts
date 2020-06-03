/*
 * Copyright 2018-2018 AppBricks, Inc. or its affiliates. All Rights Reserved.
 */

/**
 * Returns a hex color as 'rgb()' string with
 * a transparency value if provided.
 *
 * @param {string} hex           Hex color value
 * @param {number} transparency  Decimal transparency value from 0 to 1.
 */
export function hexToRgba(hex: string, transparency = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return (
      'rgba(' +
      parseInt(result[1], 16) +
      ',' +
      parseInt(result[2], 16) +
      ',' +
      parseInt(result[3], 16) +
      ',' +
      transparency +
      ')'
    );
  } else {
    throw 'Error! Invalid HEX color value.';
  }
}
