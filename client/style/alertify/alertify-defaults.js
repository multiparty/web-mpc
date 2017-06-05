alertify.defaults = {
    autoReset:true,
    basic:false,
    closable:true,
    closableByDimmer:true,
    frameless:false,
    maintainFocus:true, //global default not per instance, applies to all dialogs
    maximizable:true,
    modal:true,
    movable:true,
    moveBounded:false,
    overflow:true,
    padding: true,
    pinnable:true,
    pinned:true,
    preventBodyShift:false, //global default not per instance, applies to all dialogs
    resizable:true,
    startMaximized:false,
    transition:'fade',
    notifier:{
        delay:5,
        position:'bottom-right',
        closeButton:false
    },
    glossary:{
        title:'',
        ok: 'OK',
        cancel: 'Cancel',
        acccpt: 'Accept',
        deny: 'Deny',
        confirm: 'Confirm',
        decline: 'Decline',
        close: 'Close',
        maximize: 'Maximize',
        restore: 'Restore',
    },
    theme:{
        input:'ajs-input',
        ok:'ajs-ok',
        cancel:'ajs-cancel',
    }
};