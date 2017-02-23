import {clone} from 'handsontable/helpers/object';
import {arrayEach} from 'handsontable/helpers/array';
import {SEPARATOR} from 'handsontable/plugins/contextMenu/predefinedItems';
import {getFormulaDescriptor} from './formulaRegisterer';

import {FORMULA_NAME as FORMULA_NONE} from './formula/none';
import {FORMULA_NAME as FORMULA_EMPTY} from './formula/empty';
import {FORMULA_NAME as FORMULA_NOT_EMPTY} from './formula/notEmpty';
import {FORMULA_NAME as FORMULA_EQUAL} from './formula/equal';
import {FORMULA_NAME as FORMULA_NOT_EQUAL} from './formula/notEqual';
import {FORMULA_NAME as FORMULA_GREATER_THAN} from './formula/greaterThan';
import {FORMULA_NAME as FORMULA_GREATER_THAN_OR_EQUAL} from './formula/greaterThanOrEqual';
import {FORMULA_NAME as FORMULA_LESS_THAN} from './formula/lessThan';
import {FORMULA_NAME as FORMULA_LESS_THAN_OR_EQUAL} from './formula/lessThanOrEqual';
import {FORMULA_NAME as FORMULA_BETWEEN} from './formula/between';
import {FORMULA_NAME as FORMULA_NOT_BETWEEN} from './formula/notBetween';
import {FORMULA_NAME as FORMULA_BEGINS_WITH} from './formula/beginsWith';
import {FORMULA_NAME as FORMULA_ENDS_WITH} from './formula/endsWith';
import {FORMULA_NAME as FORMULA_CONTAINS} from './formula/contains';
import {FORMULA_NAME as FORMULA_NOT_CONTAINS} from './formula/notContains';
import {FORMULA_NAME as FORMULA_DATE_BEFORE} from './formula/date/before';
import {FORMULA_NAME as FORMULA_DATE_AFTER} from './formula/date/after';
import {FORMULA_NAME as FORMULA_TOMORROW} from './formula/date/tomorrow';
import {FORMULA_NAME as FORMULA_TODAY} from './formula/date/today';
import {FORMULA_NAME as FORMULA_YESTERDAY} from './formula/date/yesterday';
import {FORMULA_NAME as FORMULA_BY_VALUE} from './formula/byValue';

export {
  FORMULA_NONE,
  FORMULA_EMPTY,
  FORMULA_NOT_EMPTY,
  FORMULA_EQUAL,
  FORMULA_NOT_EQUAL,
  FORMULA_GREATER_THAN,
  FORMULA_GREATER_THAN_OR_EQUAL,
  FORMULA_LESS_THAN,
  FORMULA_LESS_THAN_OR_EQUAL,
  FORMULA_BETWEEN,
  FORMULA_NOT_BETWEEN,
  FORMULA_BEGINS_WITH,
  FORMULA_ENDS_WITH,
  FORMULA_CONTAINS,
  FORMULA_NOT_CONTAINS,
  FORMULA_DATE_BEFORE,
  FORMULA_DATE_AFTER,
  FORMULA_TOMORROW,
  FORMULA_TODAY,
  FORMULA_YESTERDAY,
  FORMULA_BY_VALUE
};

export const TYPE_NUMERIC = 'numeric';
export const TYPE_TEXT = 'text';
export const TYPE_DATE = 'date';
/**
 * Default types and order for filter conditions.
 *
 * @type {Object}
 */
export const TYPES = {
  [TYPE_NUMERIC]: [
    FORMULA_NONE,
    SEPARATOR,
    FORMULA_EMPTY,
    FORMULA_NOT_EMPTY,
    SEPARATOR,
    FORMULA_EQUAL,
    FORMULA_NOT_EQUAL,
    SEPARATOR,
    FORMULA_GREATER_THAN,
    FORMULA_GREATER_THAN_OR_EQUAL,
    FORMULA_LESS_THAN,
    FORMULA_LESS_THAN_OR_EQUAL,
    FORMULA_BETWEEN,
    FORMULA_NOT_BETWEEN,
  ],
  [TYPE_TEXT]: [
    FORMULA_NONE,
    SEPARATOR,
    FORMULA_EMPTY,
    FORMULA_NOT_EMPTY,
    SEPARATOR,
    FORMULA_EQUAL,
    FORMULA_NOT_EQUAL,
    SEPARATOR,
    FORMULA_BEGINS_WITH,
    FORMULA_ENDS_WITH,
    SEPARATOR,
    FORMULA_CONTAINS,
    FORMULA_NOT_CONTAINS,
  ],
  [TYPE_DATE]: [
    FORMULA_NONE,
    SEPARATOR,
    FORMULA_EMPTY,
    FORMULA_NOT_EMPTY,
    SEPARATOR,
    FORMULA_EQUAL,
    FORMULA_NOT_EQUAL,
    SEPARATOR,
    FORMULA_DATE_BEFORE,
    FORMULA_DATE_AFTER,
    FORMULA_BETWEEN,
    SEPARATOR,
    FORMULA_TOMORROW,
    FORMULA_TODAY,
    FORMULA_YESTERDAY,
  ],
};

/**
 * Get options list for conditional filter by data type (e.q: `'text'`, `'numeric'`, `'date'`).
 *
 * @returns {Object}
 */
export function getOptionsList(type) {
  const items = [];

  if (!TYPES[type]) {
    type = TYPE_TEXT;
  }
  arrayEach(TYPES[type], (type) => {
    let option;

    if (type === SEPARATOR) {
      option = {name: SEPARATOR};

    } else {
      option = clone(getFormulaDescriptor(type));
    }
    items.push(option);
  });

  return items;
}
