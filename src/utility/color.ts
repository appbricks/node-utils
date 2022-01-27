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

/**
 * Given a color string converts it into its
 * individual color components
 * 
 * @param color  the color string
 * 
 * @returns an RGBA type
 */
export function getRgbaComponents(
  color: string
): RGBA {

  const rgb: RGBA = {
    red: 0,
    green: 0,
    blue: 0,
    transparency: 0
  };

  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/;
  const rgbMatch = /^rgba?\(\s*([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})(,\s*([01]?\.?[0-9]{0,2}))?\s*\)$/;

  let result = color.match(hexMatch);
  if (result) {
    rgb.red = parseInt(result[1], 16);
    rgb.green = parseInt(result[2], 16);
    rgb.blue = parseInt(result[3], 16);
  } else {
    result = color.match(rgbMatch);
    if (result) {
      rgb.red = parseInt(result[1], 10);
      rgb.green = parseInt(result[2], 10);
      rgb.blue = parseInt(result[3], 10);
      if (result[5]) {
        rgb.transparency = parseFloat(result[5]);
      }
    } else {
      throw new Error(`"${color}" is not a valid color definition`)
    }  
  }

  return rgb;
}

/**
 * Given a RGBA type converts it to a rgba()
 * string format.
 * 
 * @param rgba  the color components
 * 
 * @returns and rbga() format that can be used to style web colors
 */
export function toRgba(rgba: RGBA): string {
  return 'rgba(' + 
    Math.round(rgba.red) + ',' + 
    Math.round(rgba.green) + ',' + 
    Math.round(rgba.blue) + ',' + 
    rgba.transparency.toFixed(2) + 
  ')';
}

export type RGBA = { 
  red: number, 
  green: number, 
  blue: number, 
  transparency: number 
}