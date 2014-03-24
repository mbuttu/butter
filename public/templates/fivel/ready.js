/*global $*/

(function ( Butter, EditorHelper ){
  document.addEventListener( "DOMContentLoaded", function( e ){
    Butter.init({
      config: "config.json",
      ready: function( butter ){
        EditorHelper.init( butter );

        butter.listen( "editoropened", function onEditorOpened() {
          butter.unlisten("editoropened", onEditorOpened);
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

          var exportButton = document.getElementById( "export" );
          exportButton.addEventListener( "click", function( e ) {
            var mediaData = butter.currentMedia.json,
                sequencerSources = [],
                trackEvents = [],
                track, trackEvent;

            for ( var i = 0; i < mediaData.tracks.length; i++ ) {
              track = mediaData.tracks[ i ];

              if ( track.trackEvents.length ) {
                for ( var k = 0; k < track.trackEvents.length; k++ ) {
                  trackEvent = track.trackEvents[ k ];

                  if ( trackEvent.type === "sequencer" ) {
                    sequencerSources = sequencerSources.concat( trackEvent.popcornOptions.source.concat( trackEvent.popcornOptions.fallback ) );
                  } else {
                    trackEvents.push({
                      type: trackEvent.type,
                      popcornOptions: trackEvent.popcornOptions
                    });
                  }
                }
              }
            }

            popcornString = JSON.stringify({
              sources: sequencerSources,
              trackEvents: trackEvents
            }, null, 2 );

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

        function init( window, document ) {
          var require = requirejs.config({
            baseUrl: "/"
          });

          require(["/templates/fivel/controls.js"], function(Controls) {
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
