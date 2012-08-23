document.addEventListener( "DOMContentLoaded", function( e ){
  Butter({
    config: 'config.json',
    ready: function( butter ){
      // Force open and close the toc editor so that the table of contents will show when the page is laoded
      butter.editor.openEditor( "toc", false, {} );
      butter.editor.openEditor( "plugin-list", true );
      var tocButton = document.getElementById( "opentoc" );
      tocButton.addEventListener( "click", function( e ) {
        butter.editor.openEditor( "toc", false, {} );
      });
    }
  });
}, false );
