import Handsontable from '../../browser';
import {arrayMapper} from 'handsontable/mixins/arrayMapper';
import {mixin} from 'handsontable/helpers/object';
import {rangeEach} from 'handsontable/helpers/number';

const strategies = {};

/**
 * @class BindStrategy
 * @plugin BindRowsWithHeaders
 * @pro
 */
class BindStrategy {
  /**
   * Loose bind mode.
   *
   * @returns {String}
   */
  static get DEFAULT_STRATEGY() {
    return 'loose';
  }

  /**
   * Register strategy class.
   *
   * @param {String} name Strategy name.
   * @param {Function} klass Strategy class.
   */
  static registerStrategy(name, klass) {
    strategies[name] = klass;
  }

  constructor() {
    this.strategy = null;
  }

  /**
   * Set strategy behaviors for binding rows with headers.
   *
   * @param name
   */
  setStrategy(name) {
    let Strategy = strategies[name];

    if (!Strategy) {
      throw new Error(`Bind strategy "${name}" does not exist.`);
    }
    this.strategy = new Strategy();
  }

  /**
   * Reset current map array and create a new one.
   *
   * @param {Number} [length] Custom generated map length.
   */
  createMap(length) {
    let strategy = this.strategy;
    let originLength = length === void 0 ? strategy._arrayMap.length : length;

    strategy._arrayMap.length = 0;

    rangeEach(originLength - 1, (itemIndex) => {
      strategy._arrayMap.push(itemIndex);
    });
  }

  /**
   * Alias for createRow of strategy class.
   *
   * @param {*} params
   */
  createRow(...params) {
    this.strategy.createRow.apply(this.strategy, params);
  }

  /**
   * Alias for removeRow of strategy class.
   *
   * @param {*} params
   */
  removeRow(...params) {
    this.strategy.removeRow.apply(this.strategy, params);
  }

  /**
   * Alias for getValueByIndex of strategy class.
   *
   * @param {*} params
   */
  translate(...params) {
    return this.strategy.getValueByIndex.apply(this.strategy, params);
  }

  /**
   * Clear array map.
   */
  clearMap() {
    this.strategy.clearMap();
  }

  /**
   * Destroy class.
   */
  destroy() {
    if (this.strategy) {
      this.strategy.destroy();
    }
    this.strategy = null;
  }
}

export {BindStrategy};

// For tests only!
Handsontable.utils.BindStrategy = BindStrategy;
