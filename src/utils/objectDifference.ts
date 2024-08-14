/* eslint-disable @typescript-eslint/no-explicit-any */
import { isArray, isEqual, isObject, transform } from 'lodash';

/**
 * Find difference between two objects (https://davidwells.io/snippets/get-difference-between-two-objects-javascript)
 * @param  {object} origObj - Source object to compare newObj against
 * @param  {object} newObj  - New object with potential changes
 * @return {object} differences
 */
export function objectDifference(origObj: any, newObj: any) {
  function changes(origObj: any, newObj: any) {
    let arrayIndexCounter = 0;
    return transform(newObj, function (result: any, value, key: string) {
      if (!isEqual(value, origObj[key])) {
        const resultKey = isArray(origObj) ? arrayIndexCounter++ : key;
        result[resultKey] =
          isObject(value) && isObject(origObj[key])
            ? changes(value, origObj[key] as any)
            : value;
      }
    });
  }
  return changes(origObj, newObj);
}
