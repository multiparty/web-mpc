import Handsontable from '../../browser';
import {arrayEach} from 'handsontable/helpers/array';

/**
 * @class DataFilter
 * @plugin Filters
 * @pro
 */
class DataFilter {
  constructor(formulaCollection, columnDataFactory = (column) => []) {
    /**
     * Reference to the instance of {FormulaCollection}.
     *
     * @type {FormulaCollection}
     */
    this.formulaCollection = formulaCollection;
    /**
     * Function which provide source data factory for specified column.
     *
     * @type {Function}
     */
    this.columnDataFactory = columnDataFactory;
  }

  /**
   * Filter data based on the formulas collection.
   *
   * @returns {Array}
   */
  filter() {
    let filteredData = [];

    if (!this.formulaCollection.isEmpty()) {
      arrayEach(this.formulaCollection.orderStack, (column, index) => {
        let columnData = this.columnDataFactory(column);

        if (index) {
          columnData = this._getIntersectData(columnData, filteredData);
        }

        filteredData = this.filterByColumn(column, columnData);
      });
    }

    return filteredData;
  }

  /**
   * Filter data based on specified column index.
   *
   * @param {Number} column Column index.
   * @param {Array} [dataSource] Data source as array of objects with `value` and `meta` keys (e.g. `{value: 'foo', meta: {}}`).
   * @returns {Array} Returns filtered data.
   */
  filterByColumn(column, dataSource = []) {
    const filteredData = [];

    arrayEach(dataSource, (dataRow) => {
      if (dataRow !== void 0 && this.formulaCollection.isMatch(dataRow, column)) {
        filteredData.push(dataRow);
      }
    });

    return filteredData;
  }

  /**
   * Intersect data.
   *
   * @private
   * @param {Array} data
   * @param {Array} needles
   * @returns {Array}
   */
  _getIntersectData(data, needles) {
    const result = [];

    arrayEach(needles, (needleRow) => {
      const row = needleRow.meta.visualRow;

      if (data[row] !== void 0) {
        result[row] = data[row];
      }
    });

    return result;
  }
}

export {DataFilter};

// For tests only! TEMP solution!
Handsontable.utils.FiltersDataFilter = DataFilter;
