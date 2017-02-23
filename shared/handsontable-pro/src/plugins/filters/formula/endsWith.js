import {registerFormula} from './../formulaRegisterer';
import {endsWith} from 'handsontable/helpers/string';
import {stringify} from 'handsontable/helpers/mixed';

export const FORMULA_NAME = 'ends_with';

function formula(dataRow, [value] = inputValues) {
  return endsWith(stringify(dataRow.value).toLowerCase(), stringify(value));
}

registerFormula(FORMULA_NAME, formula, {
  name: 'Ends with',
  inputsCount: 1
});
