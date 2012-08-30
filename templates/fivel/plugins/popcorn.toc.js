// PLUGIN: toc

(function ( Popcorn ) {

  Popcorn.plugin( "toc", function( options ) {
    var lastA;

    return {
      _setup: function( options ) {
        var target = document.getElementById( options.target ),
            _popcorn = this;

        options.popcorn = Popcorn( this.media );
        options._container = document.createElement( "ul" );
        options._container.classList.add( "toc" );

        function activate( a ) {
          Popcorn.forEach( document.getElementsByClassName( "section-active" ), function( element ) {
            element.classList.remove( "section-active" );
          });
          a.classList.add( "section-active" );
        }

        function linkElement( a, start ) {
          return function( e ) {
            activate( a );
            _popcorn.currentTime( start );
            _popcorn.play();
          };
        }

        function setupCue( section ) {
          var start, li, a, defn, startString;

          // setup a cue without adding any new UI
          if ( typeof section === "number" ) {
            options.popcorn.cue( section, function() {
              if ( lastA ) {
                lastA.classList.add( "section-complete" );
              }
            });

            return;
          }

          start = Popcorn.util.toSeconds( section.time );
          li = document.createElement( "li" );
          a = document.createElement( "a" );
          defn = document.createElement( "div" );
          startString = section.time;

          a.innerHTML = section.title + " <span class=\"time-string\">" + startString + "</span> ";

          a.addEventListener( "click", linkElement( a, start ), false );

          defn.innerHTML = section.description;
          defn.classList.add( "definition" );

          li.appendChild( a );
          li.appendChild( defn );
          options._container.appendChild( li );

          _popcorn.cue( start, function() {
            var previousA = li.previousSibling && li.previousSibling.querySelector( "a" );

            // If the current anchor element does not have the class "section-active",
            // then that means the user did not skip to this section by clicking on the table of contents,
            // and so the previous section can be marked as completed
            if ( !a.classList.contains( "section-active" ) ) {
              if ( previousA ) {
                previousA.classList.add( "section-complete" );
              }
            }
            activate( a );
          });

          lastA = a;
        }

        options.sections = options.sections || [];

        options.sections.sort( function( a, b ) {
          return Popcorn.util.toSeconds( a.time ) - Popcorn.util.toSeconds( b.time );
        });

        for ( var idx = 0; idx < options.sections.length; idx++ ) {
          var section = options.sections[ idx ];
          setupCue( section );
        }

        _popcorn.on( "loadedmetadata", function() {
          setupCue( _popcorn.duration() );
        });

        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }

        target && target.appendChild( options._container );
      },

      start: function( event, options ) {
      },

      end: function( event, options ) {
      },

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
        "default": "Table of Comments"
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
