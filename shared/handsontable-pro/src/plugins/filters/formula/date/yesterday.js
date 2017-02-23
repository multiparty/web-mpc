import {registerFormula} from './../../formulaRegisterer';
import moment from 'moment';

export const FORMULA_NAME = 'date_yesterday';

function formula(dataRow) {
  let date = moment(dataRow.value, dataRow.meta.dateFormat);

  if (!date.isValid()) {
    return false;
  }

  return date.isSame(moment().subtract(1, 'days').startOf('day'), 'd');
}

registerFormula(FORMULA_NAME, formula, {
  name: 'Yesterday',
  inputsCount: 0
});
