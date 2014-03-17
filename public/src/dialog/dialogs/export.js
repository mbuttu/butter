define([ "text!dialog/dialogs/export.html", "dialog/dialog" ],
  function( LAYOUT_SRC, Dialog ){

  Dialog.register( "export", LAYOUT_SRC, function( dialog, data ) {
    var textarea = dialog.rootElement.querySelector( "#popcornData" ),
        sendServer = dialog.rootElement.querySelector( "#sendserver" ),
        sendToServerCallback = data.sendToServerCallback;

    textarea.innerHTML = data.popcornString;
    if ( data.sendToServerCallback ){
      sendServer.addEventListener( "click", data.sendToServerCallback, false );
    }
    dialog.enableCloseButton();
    dialog.assignEscapeKey( "default-close" );
    dialog.assignEnterKey( "default-ok" );
    dialog.assignButton( ".cancel", "default-close" );
  });
});
