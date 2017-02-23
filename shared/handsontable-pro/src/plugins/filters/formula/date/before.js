import {registerFormula} from './../../formulaRegisterer';
import moment from 'moment';

export const FORMULA_NAME = 'date_before';

function formula(dataRow, [value] = inputValues) {
  let date = moment(dataRow.value, dataRow.meta.dateFormat);
  let inputDate = moment(value, dataRow.meta.dateFormat);

  if (!date.isValid() || !inputDate.isValid()) {
    return false;
  }

  return date.diff(inputDate) <= 0;
}

registerFormula(FORMULA_NAME, formula, {
  name: 'Before',
  inputsCount: 1
});
