/*global $*/

(function ( Butter, EditorHelper ){
  document.addEventListener( "DOMContentLoaded", function( e ){
    Butter.init({
      config: "config.json",
      ready: function( butter ){
        EditorHelper.init( butter );

        butter.listen( "editoropened", function onEditorOpened() {
          butter.unlisten( "editoropened", onEditorOpened );
          var trackEvent = butter.getTrackEventsByType( "toc" )[ 0 ],
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

          if ( trackEvent ) {
            // hide the toc track event so that the editor can only be opened
            // from the template
            trackEvent.view.element.style.display = "none";
          }

          var tocButton = document.getElementById( "opentoc" );
          tocButton.addEventListener( "click", function( e ) {
            butter.editor.openEditor( "toc", {
              openData: trackEvent
            });
          });
        });

        function init( window, document ) {
          var require = requirejs.config({
                baseUrl: "/src"
              }),
              // This flag is used to catch jwplayer errors related to Rackspace Temp-URLs
              // There is some sort of bug present that causes two errors to be fired.
              preventSecond = false,
              fixingTrackEvent = {};

          require(["../templates/fivel/controls", "util/xhr"], function(Controls, XHR) {
            function setupControls() {
              var popcorn = butter.currentMedia.popcorn.popcorn;
              var controls = new Controls(popcorn, "[[Course Name]]", "video-container");

              $("#video").bind("contextmenu", function(){
                return false;
              });

              popcorn.on("loadedmetadata", function() {
                $("#resumeDiv").show();
              });

              $("#playerCloseCaption").click(function() {
                popcorn.toggle("text");
              });

              $("#resumeDiv").click(function() {
                popcorn.play();
                $("#resumeDiv").hide();
              });

              popcorn.on('seeked', function() {
                $("#resumeDiv").hide();
              });

              popcorn.on('seeking', function() {
                $("#resumeDiv").hide();
              });

              popcorn.on("playing", function() {
                $("#resumeDiv").hide();
              });

              popcorn.on("play", function() {
                $("#resumeDiv").hide();
              });

              popcorn.on("pause", function() {
                $("#resumeDiv").show();
              });

              function onJWError( popcornEvent ) {

                var id = popcornEvent.id,
                    trackInfo = butter.currentMedia.findTrackWithTrackEventId( id ),
                    trackEvent = trackInfo.trackEvent;

                if ( trackEvent && !fixingTrackEvent[ id ] ) {
                  butter.currentMedia.popcorn.popcorn.off( "jwplayer-error", onJWError );
                  fixingTrackEvent[ id ] = true;

                  XHR.post( "/api/rackspace/tempurl", {
                    sources: [
                      {
                        base: trackEvent.popcornOptions.base,
                        path: trackEvent.popcornOptions.path
                      }
                    ]
                  }, function( data ) {
                    trackInfo.track.listen( "trackeventupdated", function onTrackEventUpdated() {
                      trackInfo.track.unlisten( "trackeventupdated", onTrackEventUpdated );

                      fixingTrackEvent[ id ] = false;
                      butter.currentMedia.popcorn.popcorn.on( "jwplayer-error", onJWError );
                    });

                    var file = data[ 0 ].substring( data[ 0 ].lastIndexOf( "/" ) + 1, data[ 0 ].lastIndexOf( "?" ) );
                    data[ 0 ] = data[ 0 ].replace( file, encodeURIComponent( file ) );

                    trackEvent.update({
                      source: [ data[ 0 ] ]
                    });
                  });
                }
              }

              butter.currentMedia.popcorn.popcorn.on( "jwplayer-error", onJWError );
            }

            // In this version of Butter when the duration of the timline is increased
            // the popcorn instance is destroyed and rebuilt. This causes all old
            // event listeners to not function.
            butter.listen( "mediaready", function() {
              setupControls();
            });

            setupControls();
          });
        }

        // Source tree case vs. require-built case.
        if ( typeof require === "undefined" ) {
          var requireScript = document.createElement( "script" );
          requireScript.src = "../../external/require/require.js";
          requireScript.onload = function() {
            init( window, window.document );
          };
          document.head.appendChild( requireScript );
        } else {
          init( window, window.document );
        }
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ));
