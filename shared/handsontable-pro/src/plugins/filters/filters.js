import BasePlugin from 'handsontable/plugins/_base';
import {arrayEach, arrayMap} from 'handsontable/helpers/array';
import {rangeEach} from 'handsontable/helpers/number';
import {EventManager} from 'handsontable/eventManager';
import {addClass, removeClass, closest} from 'handsontable/helpers/dom/element';
import {registerPlugin} from 'handsontable/plugins';
import {ConditionComponent} from './component/condition';
import {ValueComponent} from './component/value';
import {ActionBarComponent} from './component/actionBar';
import {FormulaCollection} from './formulaCollection';
import {DataFilter} from './dataFilter';
import {FormulaUpdateObserver} from './formulaUpdateObserver';
import {createArrayAssertion, toEmptyString} from './utils';
import {FORMULA_NONE} from './constants';
import {SEPARATOR} from 'handsontable/plugins/contextMenu/predefinedItems';

/**
 * This plugin allows filtering the table data either by the built-in component or with the API.
 *
 * @plugin Filters
 * @pro
 * @dependencies DropdownMenu TrimRows BindRowsWithHeaders moment
 */
class Filters extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);
    /**
     * Instance of {@link EventManager}.
     *
     * @type {EventManager}
     */
    this.eventManager = new EventManager(this);
    /**
     * Instance of {@link TrimRows}.
     *
     * @type {TrimRows}
     */
    this.trimRowsPlugin = null;
    /**
     * Instance of {@link DropdownMenu}.
     *
     * @type {DropdownMenu}
     */
    this.dropdownMenuPlugin = null;
    /**
     * Instance of {@link FormulaCollection}.
     *
     * @type {FormulaCollection}
     */
    this.formulaCollection = null;
    /**
     * Instance of {@link FormulaUpdateObserver}.
     *
     * @type {FormulaUpdateObserver}
     */
    this.formulaUpdateObserver = null;
    /**
     * Instance of {@link ConditionComponent}.
     *
     * @type {ConditionComponent}
     */
    this.conditionComponent = null;
    /**
     * Instance of {@link ValueComponent}.
     *
     * @type {ValueComponent}
     */
    this.valueComponent = null;
    /**
     * Instance of {@link ActionBarComponent}.
     *
     * @type {ActionBarComponent}
     */
    this.actionBarComponent = null;
    /**
     * Last selected column index for added filter formulas.
     *
     * @type {Number}
     * @default null
     */
    this.lastSelectedColumn = null;

    // One listener for the enable/disable functionality
    this.hot.addHook('afterGetColHeader', (col, TH) => this.onAfterGetColHeader(col, TH));
  }

  /**
   * Check if the plugin is enabled in the Handsontable settings.
   *
   * @returns {Boolean}
   */
  isEnabled() {
    return this.hot.getSettings().filters ? true : false;
  }

  /**
   * Enable plugin for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }
    this.trimRowsPlugin = this.hot.getPlugin('trimRows');
    this.dropdownMenuPlugin = this.hot.getPlugin('dropdownMenu');

    let addConfirmationHooks = (component) => {
      component.addLocalHook('accept', () => this.onActionBarSubmit('accept'));
      component.addLocalHook('cancel', () => this.onActionBarSubmit('cancel'));

      return component;
    };

    if (!this.conditionComponent) {
      this.conditionComponent = addConfirmationHooks(new ConditionComponent(this.hot));
    }
    if (!this.valueComponent) {
      this.valueComponent = addConfirmationHooks(new ValueComponent(this.hot));
    }
    if (!this.actionBarComponent) {
      this.actionBarComponent = addConfirmationHooks(new ActionBarComponent(this.hot));
    }
    if (!this.formulaCollection) {
      this.formulaCollection = new FormulaCollection();
    }
    if (!this.formulaUpdateObserver) {
      this.formulaUpdateObserver = new FormulaUpdateObserver(this.formulaCollection, column => this.getDataMapAtColumn(column));
      this.formulaUpdateObserver.addLocalHook('update', (...params) => this.conditionComponent.updateState(...params));
      this.formulaUpdateObserver.addLocalHook('update', (...params) => this.valueComponent.updateState(...params));
    }
    this.conditionComponent.show();
    this.valueComponent.show();
    this.actionBarComponent.show();

    this.registerEvents();
    this.addHook('beforeDropdownMenuSetItems', (items) => this.onBeforeDropdownMenuSetItems(items));
    this.addHook('afterDropdownMenuDefaultOptions', (defaultOptions) => this.onAfterDropdownMenuDefaultOptions(defaultOptions));
    this.addHook('afterDropdownMenuShow', () => this.onAfterDropdownMenuShow());
    this.addHook('afterDropdownMenuHide', () => this.onAfterDropdownMenuHide());

    // force to enable dependent plugins
    this.hot.getSettings().trimRows = true;
    this.trimRowsPlugin.enablePlugin();

    // Temp. solution (extending menu items bug in contextMenu/dropdownMenu)
    if (this.hot.getSettings().dropdownMenu) {
      this.dropdownMenuPlugin.disablePlugin();
      this.dropdownMenuPlugin.enablePlugin();
    }

    super.enablePlugin();
  }

  /**
   * Register the DOM listeners.
   *
   * @private
   */
  registerEvents() {
    this.eventManager.addEventListener(this.hot.rootElement, 'click', (event) => this.onTableClick(event));
  }

  /**
   * Disable plugin for this Handsontable instance.
   */
  disablePlugin() {
    if (this.enabled) {
      this.conditionComponent.hide();
      this.valueComponent.hide();
      this.actionBarComponent.hide();
      this.formulaCollection.clean();
      this.trimRowsPlugin.untrimAll();
    }
    super.disablePlugin();
  }

  /**
   * @description
   * Add formula to the formulas collection at specified column index.
   *
   * Possible predefined formulas:
   *  * `begins_with` - Begins with
   *  * `between` - Between
   *  * `by_value` - By value
   *  * `contains` - Contains
   *  * `empty` - Empty
   *  * `ends_with` - Ends with
   *  * `eq` - Equal
   *  * `gt` - Greater than
   *  * `gte` - Greater than or equal
   *  * `lt` - Less than
   *  * `lte` - Less than or equal
   *  * `none` - None (no filter)
   *  * `not_between` - Not between
   *  * `not_contains` - Not contains
   *  * `not_empty` - Not empty
   *  * `neq` - Not equal
   *
   * @example
   * ```js
   * // Add filter "Greater than" 95 to column at index 1
   * hot.getPlugin('filters').addFormula(1, 'gt', [95]);
   * hot.getPlugin('filters').filter();
   *
   * // Add filter "Begins with" with value "de" and "Not contains" with value "ing"
   * hot.getPlugin('filters').addFormula(1, 'begins_with', ['de']);
   * hot.getPlugin('filters').addFormula(1, 'not_contains', ['ing']);
   * hot.getPlugin('filters').filter();
   *
   * // If you want to add filter formulas with OR operator you can use formula "by_value"
   * hot.getPlugin('filters').addFormula(1, 'by_value', [['ing', 'ed', 'as', 'on']]);
   * hot.getPlugin('filters').filter();
   * // In this case all value's that don't match will be filtered.
   * ```
   * @param {Number} column Column index.
   * @param {String} name Formula short name.
   * @param {Array} args Formula arguments.
   */
  addFormula(column, name, args) {
    this.formulaCollection.addFormula(column, {command: {key: name}, args});
  }

  /**
   * Remove formulas at specified column index.
   *
   * @param {Number} column Column index.
   */
  removeFormulas(column) {
    this.formulaCollection.removeFormulas(column);
  }

  /**
   * Clear all formulas previously added to the collection for the specified column index or, if the column index
   * was not passed, clear the formulas for all columns.
   *
   * @param {Number} [column] Column index.
   */
  clearFormulas(column) {
    if (column === void 0) {
      this.formulaCollection.clean();
    } else {
      this.formulaCollection.clearFormulas(column);
    }
  }

  /**
   * Filter data based on added filter formulas.
   */
  filter() {
    let dataFilter = this._createDataFilter();
    let needToFilter = !this.formulaCollection.isEmpty();
    let visibleVisualRows = [];

    const formulas = this.formulaCollection.exportAllFormulas();
    const allowFiltering = this.hot.runHooks('beforeFilter', formulas);

    if (allowFiltering !== false) {
      if (needToFilter) {
        let trimmedRows = [];

        this.trimRowsPlugin.trimmedRows.length = 0;

        visibleVisualRows = arrayMap(dataFilter.filter(), (rowData) => rowData.meta.visualRow);

        const visibleVisualRowsAssertion = createArrayAssertion(visibleVisualRows);

        rangeEach(this.hot.countSourceRows() - 1, (row) => {
          if (!visibleVisualRowsAssertion(row)) {
            trimmedRows.push(row);
          }
        });

        this.trimRowsPlugin.trimRows(trimmedRows);

        if (!visibleVisualRows.length) {
          this.hot.deselectCell();
        }
      } else {
        this.trimRowsPlugin.untrimAll();
      }
    }

    this.hot.view.wt.wtOverlays.adjustElementsSize(true);
    this.hot.render();
    this.clearColumnSelection();

    this.hot.runHooks('afterFilter', formulas);
  }

  /**
   * Get last selected column index.
   *
   * @returns {Number|null}
   */
  getSelectedColumn() {
    return this.lastSelectedColumn;
  }

  /**
   * Clear column selection.
   */
  clearColumnSelection() {
    let [row, col] = this.hot.getSelected() || [];

    if (row !== void 0 && col !== void 0) {
      this.hot.selectCell(row, col);
    }
  }

  /**
   * Get handsontable source data with cell meta based on current selection.
   *
   * @param {Number} [column] Column index. By default column index accept the value of the selected column.
   * @returns {Array} Returns array of objects where keys as row index.
   */
  getDataMapAtColumn(column) {
    let data = [];

    arrayEach(this.hot.getSourceDataAtCol(column), (value, rowIndex) => {
      let {row, col, visualCol, visualRow, type, instance, dateFormat} = this.hot.getCellMeta(rowIndex, column);

      data.push({
        meta: {row, col, visualCol, visualRow, type, instance, dateFormat},
        value: toEmptyString(value),
      });
    });

    return data;
  }

  /**
   * After dropdown menu show listener.
   *
   * @private
   */
  onAfterDropdownMenuShow() {
    const column = this.getSelectedColumn();
    const conditionComponent = this.conditionComponent;
    const valueComponent = this.valueComponent;

    if (!conditionComponent.isHidden()) {
      conditionComponent.restoreState(column);
    }
    if (!valueComponent.isHidden()) {
      valueComponent.restoreState(column);
    }
  }

  /**
   * After dropdown menu hide listener.
   *
   * @private
   */
  onAfterDropdownMenuHide() {
    this.conditionComponent.getSelectElement().closeOptions();
  }

  /**
   * Before dropdown menu set menu items listener.
   *
   * @private
   * @param {Array} items DropdownMenu items created based on predefined items and settings provided by user.
   */
  onBeforeDropdownMenuSetItems(items) {
    const menuKeys = arrayMap(items, (item) => item.key);
    const conditionComponent = this.conditionComponent;
    const valueComponent = this.valueComponent;

    conditionComponent[menuKeys.indexOf(conditionComponent.getMenuItemDescriptor().key) === -1 ? 'hide' : 'show']();
    valueComponent[menuKeys.indexOf(valueComponent.getMenuItemDescriptor().key) === -1 ? 'hide' : 'show']();
  }

  /**
   * After dropdown menu default options listener.
   *
   * @private
   * @param {Object} defaultOptions ContextMenu default item options.
   */
  onAfterDropdownMenuDefaultOptions(defaultOptions) {
    defaultOptions.items.push({name: SEPARATOR});
    defaultOptions.items.push(this.conditionComponent.getMenuItemDescriptor());
    defaultOptions.items.push(this.valueComponent.getMenuItemDescriptor());
    defaultOptions.items.push(this.actionBarComponent.getMenuItemDescriptor());
  }

  /**
   * On action bar submit listener.
   *
   * @private
   * @param {String} submitType
   */
  onActionBarSubmit(submitType) {
    if (submitType === 'accept') {
      let column = this.getSelectedColumn();
      let byConditionState = this.conditionComponent.getState();
      let byValueState = this.valueComponent.getState();

      this.formulaUpdateObserver.groupChanges();
      this.formulaCollection.clearFormulas(column);

      if (byConditionState.command.key === FORMULA_NONE && byValueState.command.key === FORMULA_NONE) {
        this.formulaCollection.removeFormulas(column);
      }
      if (byConditionState.command.key !== FORMULA_NONE) {
        this.formulaCollection.addFormula(column, byConditionState);
      }
      if (byValueState.command.key !== FORMULA_NONE) {
        this.formulaCollection.addFormula(column, byValueState);
      }
      this.formulaUpdateObserver.flush();

      this.conditionComponent.saveState(column);
      this.valueComponent.saveState(column);

      this.filter();
    }
    this.dropdownMenuPlugin.close();
  }

  /**
   * On after get column header listener.
   *
   * @private
   * @param {Number} col
   * @param {HTMLTableCellElement} TH
   */
  onAfterGetColHeader(col, TH) {
    if (this.enabled && this.formulaCollection.hasFormulas(col)) {
      addClass(TH, 'htFiltersActive');
    } else {
      removeClass(TH, 'htFiltersActive');
    }
  }

  /**
   * On table click listener.
   *
   * @private
   * @param {Event} event DOM Event.
   */
  onTableClick(event) {
    let th = closest(event.target, 'TH');

    if (th) {
      this.lastSelectedColumn = this.hot.getCoords(th).col;
    }
  }

  /**
   * Destroy plugin.
   */
  destroy() {
    if (this.enabled) {
      this.conditionComponent.destroy();
      this.valueComponent.destroy();
      this.actionBarComponent.destroy();
      this.formulaCollection.destroy();
      this.formulaUpdateObserver.destroy();
    }
    super.destroy();
  }

  /**
   * Create DataFilter instance based on formula collection.
   *
   * @private
   * @param {FormulaCollection} formulaCollection Formula collection object.
   * @returns {DataFilter}
   */
  _createDataFilter(formulaCollection = this.formulaCollection) {
    return new DataFilter(formulaCollection, (column) => this.getDataMapAtColumn(column));
  }
}

export {Filters};

registerPlugin('filters', Filters);
