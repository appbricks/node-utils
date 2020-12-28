/**
 * Merges all properties in the given array of objects
 * and returns an object with the properties combined.
 * 
 * @param propLists  List of objects whose properties should be combined
 */
export function combineProps(propLists: Object[]): Object {
  let combinedList = {};
  propLists.forEach(propList => Object.assign(combinedList, propList));
  return combinedList;
}
