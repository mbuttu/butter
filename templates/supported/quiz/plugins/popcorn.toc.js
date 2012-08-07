// PLUGIN: toc

(function ( Popcorn ) {

  Popcorn.plugin( "toc", {

    manifest: {
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
    },

    _setup: function( options ) {

      var target = document.getElementById( options.target ),
          container = document.createElement( "ul" ),
          _popcorn = this;

      options._container = container;

      function activate( a ) {
        Popcorn.forEach( document.getElementsByClassName( "section-active" ), function( element ) {
          element.classList.remove( "section-active" );
        });
        a.classList.add( "section-active" );
      }

      function setupCue( a, start, end ) {
        _popcorn.cue( start, function() {
          activate( a );
        });
        _popcorn.cue( end, function() {
          a.classList.remove( "section-active" );
          a.classList.add( "section-complete" );
        });
      }

      function linkElement( a, start, end ) {
        return function( e ) {
          activate( a );
          _popcorn.currentTime( start );
          _popcorn.play();
        };
      }

      for ( var idx = 0; idx < options.sections.length; idx++ ) {

        var section = options.sections[ idx ],
            next = options.sections[ idx + 1 ],
            start = Popcorn.util.toSeconds( section.time ),
            end = next && next.time || _popcorn.duration(),
            li = document.createElement( "li" ),
            a = document.createElement( "a" ),
            defn = document.createElement( "div" ),
            startString = section.time;

          a.innerHTML = section.title + " <span class=\"time-string\">" + startString + "</span> ";

          setupCue( a, start, end );
          a.addEventListener( "click", linkElement( a, start, end ), false );

          defn.innerHTML = section.description;
          defn.classList.add( "definition" );

          li.appendChild( a );
          li.appendChild( defn );
          container.appendChild( li );
      }

      if ( !target && Popcorn.plugin.debug ) {
        throw new Error( "target container doesn't exist" );
      }

      target && target.appendChild( container );
    },

    /**
     * @member text
     * The start function will be executed when the currentTime
     * of the video  reaches the start time provided by the
     * options variable
     */
    start: function( event, options ) {
    },

    /**
     * @member text
     * The end function will be executed when the currentTime
     * of the video  reaches the end time provided by the
     * options variable
     */
    end: function( event, options ) {
    },

    _teardown: function( options ) {
      document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
    }
  });
})( Popcorn );
