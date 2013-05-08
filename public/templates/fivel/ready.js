(function ( Butter, EditorHelper ){
  document.addEventListener( "DOMContentLoaded", function( e ){
    Butter.init({
      config: "config.json",
      ready: function( butter ){
        EditorHelper.init( butter );

        butter.listen( "editoropened", function onEditorOpened() {
          butter.unlisten("editoropened", onEditorOpened);
          var trackEvent = butter.getTrackEventsByType( "toc" )[ 0 ],
              tocPlugin = document.querySelector( "[data-popcorn-plugin-type=toc]" ),
              popcornString = "",
              script;

          script = document.createElement( "script" );
          script.src = "//www.mozilla.org/tabzilla/media/js/tabzilla.js";
          document.body.appendChild( script );

          function sendToServer( e ){
            $.ajax({
              type: "POST",
              url: "http://localhost:3000/template",
              data: {
                script: encodeURIComponent( popcornString )
              }
            }).
            done(function( data ) {
              butter.dialog.spawn( "share", {
                data: data.url
              }).open();
            });
          }

          // if ( trackEvent ) {
          //   // hide the toc track event so that the editor can only be opened
          //   // from the template
          //   trackEvent.view.element.style.display = "none";
          //   // hide the toc plugin from the plugin-list editor so that only one
          //   // toc can be added to a project
          //   tocPlugin.style.display = "none";
          // }

          var tocButton = document.getElementById( "opentoc" );
          tocButton.addEventListener( "click", function( e ) {
            butter.editor.openEditor( "toc", {
              openData: trackEvent
            });
          });

          var exportButton = document.getElementById( "export" );
          exportButton.addEventListener( "click", function( e ) {
            popcornString = "(function() {\n" +
                                  butter.currentMedia.generatePopcornString() + "\n" +
                               "})();\n";
            butter.dialog.spawn( "export", {
              data: {
                popcornString: popcornString,
                sendToServerCallback: sendToServer
              },
              events: {
                cancel: function( e ){
                  dialg.close();
                }
              }
            }).open();
          });
      });
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ));
