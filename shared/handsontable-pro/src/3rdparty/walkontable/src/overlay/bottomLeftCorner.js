import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform
} from 'handsontable/helpers/dom/element';
import {WalkontableOverlay} from 'handsontable/3rdparty/walkontable/src/overlay/_base.js';

/**
 * @class WalkontableTopLeftCornerOverlay
 */
class WalkontableBottomLeftCornerOverlay extends WalkontableOverlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return this.wot.getSetting('fixedRowsBottom') &&
      (this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length) ? true : false;
  }

  /**
   * Reposition the overlay.
   */
  repositionOverlay() {
    let scrollbarWidth = getScrollbarWidth();
    let cloneRoot = this.clone.wtTable.holder.parentNode;

    if (this.wot.wtTable.holder.clientHeight === this.wot.wtTable.holder.offsetHeight) {
      scrollbarWidth = 0;
    }

    cloneRoot.style.top = '';
    cloneRoot.style.bottom = scrollbarWidth + 'px';
  }

  /**
   * Updates the corner overlay position
   */
  resetFixedPosition() {
    this.updateTrimmingContainer();

    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return;
    }
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    let tableWidth = outerWidth(this.clone.wtTable.TABLE);

    overlayRoot.style.top = '';

    if (this.trimmingContainer === window) {
      let box = this.wot.wtTable.hider.getBoundingClientRect();
      let bottom = Math.ceil(box.bottom);
      let left = Math.ceil(box.left);
      let finalLeft;
      let finalBottom;
      let bodyHeight = document.body.offsetHeight;

      if (left < 0) {
        finalLeft = -left;
      } else {
        finalLeft = 0;
      }

      if (bottom > bodyHeight) {
        finalBottom = (bottom - bodyHeight);
      } else {
        finalBottom = 0;
      }
      finalBottom = finalBottom + 'px';
      finalLeft = finalLeft + 'px';

      overlayRoot.style.top = '';
      overlayRoot.style.left = finalLeft;
      overlayRoot.style.bottom = finalBottom;

    } else {
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }
    overlayRoot.style.height = (tableHeight === 0 ? tableHeight : tableHeight) + 'px';
    overlayRoot.style.width = (tableWidth === 0 ? tableWidth : tableWidth) + 'px';
  }
}

export {WalkontableBottomLeftCornerOverlay};

window.WalkontableBottomLeftCornerOverlay = WalkontableBottomLeftCornerOverlay;

WalkontableOverlay.registerOverlay(WalkontableOverlay.CLONE_BOTTOM_LEFT_CORNER, WalkontableBottomLeftCornerOverlay);
