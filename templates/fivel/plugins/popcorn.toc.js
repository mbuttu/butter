// PLUGIN: toc

(function ( Popcorn ) {

  Popcorn.plugin( "toc", function( options ) {

    return {
      _setup: function( options ) {
        var target = document.getElementById( options.target ),
            ul = document.createElement( "ul" ),
            header = document.createElement( "div" );

        options.popcorn = Popcorn( this.media );
        options._container = document.createElement( "div" );

        header.classList.add( "tocheader" );
        header.innerHTML = options.title;

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
            activate( a );
            options.popcorn.currentTime( start );
            options.popcorn.play();
          };
        }

        function setupCue( section ) {
          var start, li, titleContainer, a, defn, startString, span;

          span = document.createElement( "span" );
          span.innerHTML = "\u00A0\u00A0";
          span.classList.add( "section-complete" );

          start = Popcorn.util.toSeconds( section.time );
          li = document.createElement( "li" );
          titleContainer = document.createElement( "div" );
          a = document.createElement( "a" );
          defn = document.createElement( "div" );
          startString = section.time;

          a.innerHTML = section.title + "<span class=\"section-incomplete\">\u00A0\u00A0</span><span class=\"time-string\">" + startString + "</span> ";

          a.addEventListener( "click", linkElement( a, start ), false );

          defn.innerHTML = section.description;
          defn.classList.add( "section-description" );

          titleContainer.classList.add( "section-title" );
          titleContainer.appendChild( a );

          li.appendChild( titleContainer );
          li.appendChild( defn );
          options._container.querySelector( "ul" ).appendChild( li );

          options.popcorn.cue( start, function() {
            var previousA = li.previousSibling && li.previousSibling.querySelector && li.previousSibling.querySelector( "a" ),
                incompleteSection;

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
          });
        }

        options.sections = options.sections || [];

        options.sections.sort( function( a, b ) {
          return Popcorn.util.toSeconds( a.time ) - Popcorn.util.toSeconds( b.time );
        });

        for ( var idx = 0; idx < options.sections.length; idx++ ) {
          var section = options.sections[ idx ];
          setupCue( section );
        }

        options.popcorn.on( "ended", function() {
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
