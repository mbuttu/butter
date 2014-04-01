// PLUGIN: toc

(function ( Popcorn ) {

  // Polyfill for classList in browsers that don't support it.
  // see https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
  /*global self, document, DOMException */
  if (typeof document !== "undefined" && !("classList" in document.documentElement)) {
    (function (view) {

    "use strict";

    if (!('HTMLElement' in view) && !('Element' in view)) return;

    var
        classListProp = "classList"
      , protoProp = "prototype"
      , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
      , objCtr = Object
      , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
      }
      , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
            i = 0
          , len = this.length
        ;
        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }
        return -1;
      }
      // Vendors: please allow content code to instantiate DOMExceptions
      , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      }
      , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
          throw new DOMEx(
              "SYNTAX_ERR"
            , "An invalid or illegal string was specified"
          );
        }
        if (/\s/.test(token)) {
          throw new DOMEx(
              "INVALID_CHARACTER_ERR"
            , "String contains an invalid character"
          );
        }
        return arrIndexOf.call(classList, token);
      }
      , ClassList = function (elem) {
        var
            trimmedClasses = strTrim.call(elem.className)
          , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
          , i = 0
          , len = classes.length
        ;
        for (; i < len; i++) {
          this.push(classes[i]);
        }
        this._updateClassName = function () {
          elem.className = this.toString();
        };
      }
      , classListProto = ClassList[protoProp] = []
      , classListGetter = function () {
        return new ClassList(this);
      }
    ;
    // Most DOMException implementations don't allow calling DOMException's toString()
    // on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp];
    classListProto.item = function (i) {
      return this[i] || null;
    };
    classListProto.contains = function (token) {
      token += "";
      return checkTokenAndGetIndex(this, token) !== -1;
    };
    classListProto.add = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.remove = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        var index = checkTokenAndGetIndex(this, token);
        if (index !== -1) {
          this.splice(index, 1);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.toggle = function (token, forse) {
      token += "";

      var
          result = this.contains(token)
        , method = result ?
          forse !== true && "remove"
        :
          forse !== false && "add"
      ;

      if (method) {
        this[method](token);
      }

      return !result;
    };
    classListProto.toString = function () {
      return this.join(" ");
    };

    if (objCtr.defineProperty) {
      var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
      };
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
          classListPropDesc.enumerable = false;
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
      }
    } else if (objCtr[protoProp].__defineGetter__) {
      elemCtrProto.__defineGetter__(classListProp, classListGetter);
    }

    }(self));
  }

  document.getElementsByClassName = document.getElementsByClassName || function( selector ) {
    return document.querySelectorAll( "." +  selector );
  };

  Popcorn.plugin( "toc", function( options ) {

    return {
      _setup: function( options ) {
        var target = document.getElementById( options.target ),
            ul = document.createElement( "ul" ),
            anchorList = {},
            canBeCompleted = true,
            header;

        options.popcorn = Popcorn( this.media );
        options._container = document.createElement( "div" );
        options._target = target;

        if ( options.title ) {
          header = document.createElement( "div" ),
          header.classList.add( "tocheader" );
          header.innerHTML = options.title;
        }

        ul.classList.add( "toc" );

        if ( header ) {
          options._container.appendChild( header );
        }

        options._container.appendChild( ul );

        function activate( a ) {
          var span = document.createElement( "span" ),
              activeTitles = document.getElementsByClassName( "section-active-title" ),
              activeSections = document.getElementsByClassName( "section-active" );

          span.innerHTML = "\u00A0\u00A0";
          span.classList.add( "section-active" );

          for ( var i = 0; i < activeTitles.length; i++ ) {
            activeTitles[ i ].classList.remove( "section-active-title" );
          }

          for ( var k = 0; k < activeSections.length; k++ ) {
            activeSections[ k ].parentNode.removeChild( activeSections[ k ] );
          }

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
          function formatTime(time) {
            time = +time;
            if ( time === 0 ) {
              return "00";
            }

            if ( time < 10 ) {
              return "0" + time;
            }

            return time;
          }

          duration = Math.floor( duration );
          if ( duration === 1 ) {
            duration = "";
          } else if ( duration < 60 ) {
            duration = "00:" + formatTime(duration);
          } else {
            seconds = formatTime(duration % 60);
            minutes = formatTime( ( duration - seconds ) / 60 );

            duration = minutes + ":" + seconds;
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

        options.popcorn.on( "ended", onEnded );

        for ( var idx = 0; idx < options.sections.length; idx++ ) {
          var section = options.sections[ idx ],
              nextSection = options.sections[ idx + 1 ];
          setupCue( section, nextSection ? nextSection.time : Math.floor( options.popcorn.duration() ) );
        }

        options.popcorn.on( "seeking", onSeeking );

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
        label: "Title"
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
