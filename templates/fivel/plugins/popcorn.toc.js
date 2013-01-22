// PLUGIN: toc

(function ( Popcorn ) {
  var loaded = false;

  Popcorn.plugin( "toc", function( options ) {

    return {
      _setup: function( options ) {
        var target = document.getElementById( options.target ),
            ul = document.createElement( "ul" ),
            header = document.createElement( "div" ),
            anchorList = {},
            canBeCompleted = true;

        options.popcorn = Popcorn( this.media );
        options._container = document.createElement( "div" );

        header.classList.add( "tocheader" );
        header.innerHTML = options.title || "Table of Contents";

        ul.classList.add( "toc" );

        options._container.appendChild( header );
        options._container.appendChild( ul );

        function activate( a ) {
          var span = document.createElement( "span" );
          span.innerHTML = "\u00A0\u00A0";
          span.classList.add( "section-active" );

          Popcorn.forEach( document.getElementsByClassName( "section-active-title" ), function( element ) {
            element.classList.remove( "section-active-title" );
          });
          Popcorn.forEach( document.getElementsByClassName( "section-active" ), function( element ) {
            element.parentNode.removeChild( element );
          });

          a.insertBefore( span, a.firstChild );
          a.parentNode.classList.add( "section-active-title" );
        }

        function linkElement( a, start ) {
          return function( e ) {
            // Temporarily remove the listener to the seek event
            options.popcorn.off( "seeking", onSeeking );
            activate( a );
            options.popcorn.currentTime( start );
            options.popcorn.play();
            // Listen for the "seeking" event again once the video starts to play
            // FIXME: doesn't work if video is not paused
            options.popcorn.on( "play", function onPlay( e ) {
              options.popcorn.on( "seeking", onSeeking );
              options.popcorn.off( "play", onPlay );
            });
          };
        }

        function setupCue( section, nextSectionEndTime ) {
          var start, end, duration, li, titleContainer, a, defn, startString, span,
              seconds, minutes;

          span = document.createElement( "span" );
          span.innerHTML = "\u00A0\u00A0";
          span.classList.add( "section-complete" );

          start = Popcorn.util.toSeconds( section.time );
          end = Popcorn.util.toSeconds( nextSectionEndTime );
          li = document.createElement( "li" );
          titleContainer = document.createElement( "div" );
          a = document.createElement( "a" );
          defn = document.createElement( "div" );
          startString = section.time;

          duration = end - start;

          // Format the duration
          //
          // FIXME: Checking if duration === 1 is an assumption.
          // If the duration is 1, then it's a quiz, so don't display the duration.
          if ( duration === 1 ) {
            duration = "";
          } else if ( duration < 60 ) {
            duration = Math.floor( duration ) + "s";
          } else {
            seconds = duration % 60;
            minutes = ( duration - seconds ) / 60;
            duration = Math.floor( minutes ) + "m" + Math.floor( seconds ) + "s";
          }

          a.innerHTML = section.title + "<span class=\"section-incomplete\">\u00A0\u00A0</span><span class=\"time-string\">" + duration + "</span> ";

          a.addEventListener( "click", linkElement( a, start ), false );

          defn.innerHTML = section.description;
          defn.classList.add( "section-description" );

          titleContainer.classList.add( "section-title" );
          titleContainer.appendChild( a );

          li.appendChild( titleContainer );
          li.appendChild( defn );
          options._container.querySelector( "ul" ).appendChild( li );

          options.popcorn.cue( start, onCue );

          function onCue() {
            if ( !canBeCompleted ) {
              activate( a );
              return;
            }

            var previousA = li.previousSibling && li.previousSibling.querySelector && li.previousSibling.querySelector( "a" ),
                incompleteSection, anchor;

            // If the current anchor element does not have a span tag with the class "section-active",
            // then that means the user did not skip to this section by clicking on the table of contents,
            // and so the previous section can be marked as completed
            if ( !a.querySelector( ".section-active" ) ) {
              if ( previousA ) {
                incompleteSection = previousA.querySelector( ".section-incomplete" );

                // Remove incomplete status
                if ( incompleteSection ) {
                  previousA.removeChild( incompleteSection );
                }
                previousA.insertBefore( span, previousA.firstChild );
              }
            }
            activate( a );
          }

          anchorList[ section.time ] = anchorList[ section.time ] || {};
          anchor = anchorList[ section.time ];
          // anchor = anchor || {};
          anchor.anchorElement = a;
          anchor.section = section;
          // anchor.timeSeeked = 0;
          anchor.skippedSegements = anchor.skippedSegements || [];
        }

        options.sections = options.sections || [];

        options.sections.sort( function( a, b ) {
          return Popcorn.util.toSeconds( a.time ) - Popcorn.util.toSeconds( b.time );
        });

        // Need to wait until the media is ready, so that we can get the media's duration
        options.popcorn.on( "loadeddata", function() {
          loaded = true;
          onLoaded();
        });

        // This plugin can be torn down and rebuilt many times, so make sure that onLoaded is called.
        // The loadeddata event is only called once when the media is ready.
        if (loaded) {
          onLoaded();
        }

        options.popcorn.on( "ended", onEnded );

        function onLoaded() {
          for ( var idx = 0; idx < options.sections.length; idx++ ) {
            var section = options.sections[ idx ],
                nextSection = options.sections[ idx + 1];
            setupCue( section, nextSection ? nextSection.time : Math.floor( options.popcorn.duration() ) );
          }

          options.popcorn.on( "seeking", onSeeking );
        }

        function onEnded() {
          if ( !canBeCompleted ) {
            return;
          }

          var target = document.getElementById( options.target ),
              anchorElements = target.querySelectorAll( "a" ),
              lastA = anchorElements[ anchorElements.length - 1 ],
              incompleteSection = lastA.querySelector( ".section-incomplete" ),
              span = document.createElement( "span" );

          span.innerHTML = "\u00A0\u00A0";
          span.classList.add( "section-complete" );

          // Remove incomplete status
          if ( incompleteSection ) {
            lastA.removeChild( incompleteSection );
            lastA.insertBefore( span, lastA.firstChild );
          }
        }

        function onSeeking( e ) {
          var timeStarted = Math.floor( options.popcorn.currentTime() ),
              toSeconds = Popcorn.util.toSeconds,
              anchorStarted = getAnchor(),
              sectionStarted = anchorStarted.section;

          // The current section cannot be completed any time the user seeks, see onClick
          // canBeCompleted = false;

          options.popcorn.off( "seeking", onSeeking );
          options.popcorn.on( "click", onClick );
          options.popcorn.on( "seeked", onSeeked );

          function getAnchor() {
            var currentTime = options.popcorn.currentTime(),
                idx = options.sections.length - 1,
                start = options.sections[ idx ].time,
                startTime = toSeconds( start );

            while ( currentTime < startTime ) {
              idx = idx - 1;
              start = options.sections[ idx ].time;
              startTime = toSeconds( start );
            }

            return anchorList[ start ];
          }

          // When clicking on the timeline to jump to another point in the video,
          // the "click" event is always fired after the "seeking" event, so this is
          // where it is turned back on
          function onClick( e ) {
            var timeEnded = Math.floor( options.popcorn.currentTime() ),
                timeSeeked = timeEnded - timeStarted,
                startedTimeSeeked = timeSeeked,
                currentTimeSeeked = 0,
                currentAnchor = getAnchor(),
                currentSection = currentAnchor.section,
                startedSectionTime = toSeconds( sectionStarted.time ),
                currentSectionTime = toSeconds( currentSection.time ),
                seekedCurrentSection, idx, delta, segment;

            function addSkippedSegment( segments, start, end ) {
              var segment = segments[ 0 ];

              if ( !segment ) {
                segments.push({
                  start: start,
                  end: end
                });
                return segments;
              }

              // start and end may cover multiple existing skipped segments, so remove the ones it covers and add new segment in the end
              if ( start < segment.start && end > segment.end ) {
                return addSkippedSegment( segments.slice( 1 ), start, end );
              }

              if ( start >= segment.start && end <= segment.end ) {
                return segments;
              }

              if ( start < segment.start && end >= segment.start ) {
                segment.start = start;
                return segments;
              }

              if ( end > segment.end && start <= segment.end ) {
                segment.end = end;
                return segments;
              }

              return [ segment ].concat( addSkippedSegment( segments.slice( 1 ), start, end ) );
            }

            // Only if the user seeks forward
            if ( timeSeeked > 0 ) {
              // Seeked into the next section
              if ( currentSectionTime > startedSectionTime ) {
                startedTimeSeeked = currentSectionTime - timeStarted;
                currentTimeSeeked = timeSeeked - startedTimeSeeked;
                currentAnchor.skippedSegements = addSkippedSegment( currentAnchor.skippedSegements, currentSectionTime, ( currentSectionTime + currentTimeSeeked ) );
              }

              anchorStarted.skippedSegements = addSkippedSegment( anchorStarted.skippedSegements, timeStarted, ( timeStarted + startedTimeSeeked ) );

              options.popcorn.on( "seeking", onSeeking );
              options.popcorn.on( "seeking", onSeeking );
              // Temporarily remove the click handler, so that a section isn't
              // pushed to skippedSegements when the user pauses the video
              options.popcorn.off( "click", onClick );
              // Add the click handler back on once the video starts to play
              options.popcorn.on( "play", function onPlay( e) {
                options.popcorn.on( "click", onClick );
              });
            }
          }

          function onSeeked( e ) {
            if ( !options.popcorn.ended() ) {
              activate( getAnchor().anchorElement );
            }
          }
        }

        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }

        target && target.appendChild( options._container );
      },

      start: function( event, options ) {},

      end: function( event, options ) {},

      _teardown: function( options ) {
        document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
        Popcorn.destroy( options.popcorn );
      }
    };
  },
  {
    about: {
      name: "Popcorn Toc Plugin",
      version: "0.1",
      author: "@k88hudson"
    },
    options: {
      start: {
        elem: "input",
        type: "text",
        label: "In"
      },
      end: {
        elem: "input",
        type: "text",
        label: "Out"
      },
      title: {
        elem: "input",
        type: "text",
        label: "Title",
        "default": "Table of Contents"
      },
      target: {
        elem: "input",
        type: "text",
        label: "sidebarID",
        "default": "sidebar"
      },
      sections: {
        elem: "input",
        type: "textarea",
        label: "Commentary"
      }
    }
  });
})( Popcorn );
