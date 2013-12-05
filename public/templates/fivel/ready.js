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

        require(["/templates/fivel/quiz.js", "/templates/fivel/controls.js"], function(Quiz, Controls) {
          var popcorn = butter.currentMedia.popcorn.popcorn;
          //var popcorn = !{popcorn}
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

          if ("#{course._id}".length > 0) {
            var quiz = new Quiz();

            popcorn.on("loadedmetadata", function() {
              popcorn.code({
                start: popcorn.duration(),
                end: popcorn.duration() + 1,
                onStart: function() {
                  quiz.show();
                },
                onEnd: function() {
                  quiz.hide();
                }
              });
            });

            quiz.prepare();
            quiz.start();

            quiz.on("submission", function(submission) {
              $.post("/course/quizcomplete", {
                courseId: "#{course._id}",
                submission: submission
              })
              .done(function(results) {
                quiz.showResults(results);
              });
            });
          }
        });
      }
    });
  }, false );
}( window.Butter, window.EditorHelper ));
