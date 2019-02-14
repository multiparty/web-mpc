/* global alertify */

define(['alertify'], function (alertify) {
  var defaults = alertify.defaults = {
    autoReset: true,
    basic: false,
    closable: true,
    closableByDimmer: true,
    frameless: false,
    maintainFocus: true, // Global default not per instance, applies to all dialogs
    maximizable: true,
    modal: true,
    movable: true,
    moveBounded: false,
    overflow: true,
    padding: true,
    pinnable: true,
    pinned: true,
    preventBodyShift: false, // Global default not per instance, applies to all dialogs
    resizable: true,
    startMaximized: false,
    transition: 'fade',
    notifier: {
      delay: 5,
      position: 'bottom-right',
      closeButton: false
    },
    glossary: {
      title: '<img src="/images/cancel.png" alt="Alert">Error!',
      ok: 'OK',
      cancel: 'Cancel'
    },
    theme: {
      input: 'ajs-input',
      ok: 'ajs-ok',
      cancel: 'ajs-cancel'
    }
  };

  return {
    defaults: defaults
  }


});


