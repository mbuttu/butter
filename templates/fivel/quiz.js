document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    config: 'config.json',
    ready: function( butter ){
      var tocButton = document.getElementById( "opentoc" );
      tocButton.addEventListener( "click", function( e ) {
        butter.editor.openEditor( "toc", false, {} );
      });
    }
  });
}, false );
