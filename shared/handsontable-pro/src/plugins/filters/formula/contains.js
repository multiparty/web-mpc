import {registerFormula} from './../formulaRegisterer';
import {stringify} from 'handsontable/helpers/mixed';

export const FORMULA_NAME = 'contains';

function formula(dataRow, [value] = inputValues) {
  return stringify(dataRow.value).toLowerCase().indexOf(stringify(value)) >= 0;
}

registerFormula(FORMULA_NAME, formula, {
  name: 'Contains',
  inputsCount: 1
});
