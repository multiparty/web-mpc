import {addClass} from 'handsontable/helpers/dom/element';
import {stopImmediatePropagation} from 'handsontable/helpers/dom/event';
import {arrayEach, arrayUnique, arrayFilter, arrayMap} from 'handsontable/helpers/array';
import {stringify} from 'handsontable/helpers/string';
import {unifyColumnValues, intersectValues, toEmptyString} from './../utils';
import {BaseComponent} from './_base';
import {isKey} from 'handsontable/helpers/unicode';
import {MultipleSelectUI} from './../ui/multipleSelect';
import {FORMULA_BY_VALUE, FORMULA_NONE} from './../constants';
import {getFormulaDescriptor} from './../formulaRegisterer';

/**
 * @class ValueComponent
 * @plugin Filters
 */
class ValueComponent extends BaseComponent {
  constructor(hotInstance) {
    super(hotInstance);

    this.elements.push(new MultipleSelectUI(this.hot));

    this.registerHooks();
  }

  /**
   * Register all necessary hooks.
   *
   * @private
   */
  registerHooks() {
    this.getMultipleSelectElement().addLocalHook('keydown', (event) => this.onInputKeyDown(event));
  }

  /**
   * Set state of the component.
   *
   * @param {Object} value
   */
  setState(value) {
    this.reset();

    if (value && value.command.key === FORMULA_BY_VALUE) {
      const select = this.getMultipleSelectElement();

      select.setItems(value.itemsSnapshot);
      select.setValue(value.args[0]);
    }
  }

  /**
   * Export state of the component (get selected filter and filter arguments).
   *
   * @returns {Object} Returns object where `command` key keeps used formula filter and `args` key its arguments.
   */
  getState() {
    const select = this.getMultipleSelectElement();
    const availableItems = select.getItems();

    return {
      command: {key: select.isSelectedAllValues() || !availableItems.length ? FORMULA_NONE : FORMULA_BY_VALUE},
      args: [select.getValue()],
      itemsSnapshot: availableItems
    };
  }

  /**
   * Update state of component.
   *
   * @param {Object} editedFormulaStack Formula stack for edited column.
   * @param {Object} dependentFormulaStacks Formula stacks of dependent formulas.
   * @param {Function} filteredRowsFactory Data factory
   */
  updateState(editedFormulaStack, dependentFormulaStacks, filteredRowsFactory) {
    const {column, formulas} = editedFormulaStack;

    const updateColumnState = (column, formulas, formulasStack) => {
      const [formula] = arrayFilter(formulas, formula => formula.name === FORMULA_BY_VALUE);
      const state = {};

      if (formula) {
        let rowValues = arrayMap(filteredRowsFactory(column, formulasStack), (row) => row.value);

        rowValues = unifyColumnValues(rowValues);

        const selectedValues = [];
        const itemsSnapshot = intersectValues(rowValues, formula.args[0], (item) => {
          if (item.checked) {
            selectedValues.push(item.value);
          }
        });

        state.args = [selectedValues];
        state.command = getFormulaDescriptor(FORMULA_BY_VALUE);
        state.itemsSnapshot = itemsSnapshot;

      } else {
        state.args = [];
        state.command = getFormulaDescriptor(FORMULA_NONE);
      }

      this.setCachedState(column, state);
    };

    updateColumnState(column, formulas);

    // Shallow deep update of component state
    if (dependentFormulaStacks.length) {
      const {column, formulas} = dependentFormulaStacks[0];

      updateColumnState(column, formulas, editedFormulaStack);
    }
  }

  /**
   * Get multiple select element.
   *
   * @returns {MultipleSelectUI}
   */
  getMultipleSelectElement() {
    return this.elements.filter((element) => element instanceof MultipleSelectUI)[0];
  }

  /**
   * Get object descriptor for menu item entry.
   *
   * @returns {Object}
   */
  getMenuItemDescriptor() {
    return {
      key: 'filter_by_value',
      name: 'Filter by value',
      isCommand: false,
      disableSelection: true,
      hidden: () => this.isHidden(),
      renderer: (hot, wrapper, row, col, prop, value) => {
        addClass(wrapper.parentNode, 'htFiltersMenuValue');

        let label = document.createElement('div');

        addClass(label, 'htFiltersMenuLabel');
        label.textContent = 'Filter by value:';

        wrapper.appendChild(label);
        arrayEach(this.elements, (ui) => wrapper.appendChild(ui.element));

        return wrapper;
      }
    };
  }

  /**
   * Reset elements to their initial state.
   */
  reset() {
    let values = unifyColumnValues(this._getColumnVisibleValues());
    let items = intersectValues(values, values);

    this.getMultipleSelectElement().setItems(items);
    super.reset();
    this.getMultipleSelectElement().setValue(values);
  }

  /**
   * Key down listener.
   *
   * @private
   * @param {Event} event DOM event object.
   */
  onInputKeyDown(event) {
    if (isKey(event.keyCode, 'ESCAPE')) {
      this.runLocalHooks('cancel');
      stopImmediatePropagation(event);
    }
  }

  /**
   * Get data for currently selected column.
   *
   * @returns {Array}
   * @private
   */
  _getColumnVisibleValues() {
    let lastSelectedColumn = this.hot.getPlugin('filters').getSelectedColumn();

    return arrayMap(this.hot.getDataAtCol(lastSelectedColumn), (v) => toEmptyString(v));
  }
}

export {ValueComponent};
