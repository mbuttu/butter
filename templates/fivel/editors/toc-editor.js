(function( Butter ){
  Butter.Editor.register( "toc", "load!{{baseDir}}/templates/fivel/editors/toc-editor.html", function( rootElement, butter, compiledLayout ) {
    var _this = this,
        _rootElement = rootElement,
        _fields = [ "target", "sections" ],
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _sectionHTML = compiledLayout.querySelector( ".section" ),
        config = butter.config.value( "toc" ),
        sectionsFromConfig = config.sections,
        _elements = {},
        cueIds = [],
        options = {},
        _popcorn,
        _targets, savedSections, lastA, target;

    options.sections = [];

    _popcorn = butter.currentMedia.popcorn.popcorn;

    function setErrorState( message ){
      if ( message ){
        _messageContainer.innerHTML = message;
        _messageContainer.parentNode.style.visibility = "visible";
        _messageContainer.parentNode.classList.add( "open" );
      }
      else{
        _messageContainer.innerHTML = "";
        _messageContainer.parentNode.style.visibility = "";
        _messageContainer.parentNode.classList.remove( "open" );
      }
    }

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

    function updateSections(){
      var sections = _elements.sections.children;

      setErrorState( false );

      options.sections = [];

      for ( var idx = 0; idx < sections.length; idx++ ){
        var section = options.sections[ idx ];
        if ( !section ){
          section = options.sections[ idx ] = {};
        }

        section.title = sections[ idx ].querySelector( ".section-title" ).value;
        section.time = sections[ idx ].querySelector( ".section-time" ).value;
        section.description = sections[ idx ].querySelector( ".section-description" ).value;
      }

      options.target = _elements.target.value;

      onEditorOpen();
    }

    function onEditorOpen( e ){
      var sections = _elements.sections.children,
          cueId;

      if ( target && options._container ) {
        target.removeChild( options._container );
      }

      while ( (cueId = cueIds.pop()) ) {
        _popcorn.removeTrackEvent( cueId );
      }

      while ( sections[ 0 ] ) {
        _elements.sections.removeChild( sections[ 0 ] );
      }

      target = document.getElementById( options.target );

      // Create on section by default with a start time of 00:00
      if ( options.sections.length === 0 ) {
        options.sections = [];
        options.sections.push({
          title: "Intro",
          time: "00:00",
          description: "This is the introduction"
        });
      }

      setup();

      var select = _targets.querySelector( "select" ),
          defaultTarget = select.querySelector( ".default-target-option" ),
          targets;

      if ( defaultTarget ) {
        select.removeChild( defaultTarget );
      }
      targets = _targets.querySelector( "select" ).children;

      while ( targets[ 0 ] ){
        _elements.target.appendChild( targets[ 0 ] );
      }

      _elements.target.value = options.target;
    }

    function setup() {
      options._container = document.createElement( "ul" );

      options._container.classList.add( "toc" );

      options.sections.sort( function( a, b ) {
        return Popcorn.util.toSeconds( a.time ) - Popcorn.util.toSeconds( b.time );
      });

      for ( var idx = 0; idx < options.sections.length; idx++ ) {
        var section = options.sections[ idx ];
        addSection( section );
      }

      // FIXME: the - 0.005 should be removed once this bug is fixed
      // https://webmademovies.lighthouseapp.com/projects/65733-popcorn-maker/tickets/1976-setting-the-end-time-of-a-track-event-to-butterduration-sometimes-fails
      // will last section be exported?
      setupCue( butter.duration - 0.005 );

      target && target.appendChild( options._container );
    }

    function setupCue( section ) {
      var start, li, a, defn, startString, cueId, trackEvent;

      // setup a cue without adding any new UI
      if ( typeof section === "number" ) {
        cueId = Popcorn.guid( "toc-cue" );
        cueIds.push( cueId );
        _popcorn.cue( cueId, section, function() {
          if ( lastA ) {
            lastA.classList.add( "section-complete" );
          }
        });

        // Adding the target to the last trackEvent, since that is the one that will be queried later
        trackEvent = Popcorn.getTrackEvent( _popcorn, cueId );
        trackEvent.target = options.target;
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

      cueId = Popcorn.guid( "toc-cue" );
      cueIds.push( cueId );

      _popcorn.cue( cueId, start, function() {
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

      if ( section ) {
        trackEvent = Popcorn.getTrackEvent( _popcorn, cueId );
        trackEvent.section = section;
      }

      lastA = a;
    }

    function addSection( section ) {
      var sectionHTML, title, time, description, removeButton;

      // Adding a new section
      if ( !section ) {
        section = {
          title: "Section Title",
          time: "00:00",
          description: "Section description."
        };
      }

      sectionHTML = _sectionHTML.cloneNode( true );

      title = sectionHTML.querySelector( ".section-title" );
      title.value = section.title;
      removeButton = sectionHTML.querySelector( ".section-remove-button" );
      removeButton.addEventListener( "click", removeSection( _elements.sections, sectionHTML ), false );
      time = sectionHTML.querySelector( ".section-time" );
      time.value = section.time;
      description = sectionHTML.querySelector( ".section-description" );
      description.innerHTML = section.description;
      _elements.sections.appendChild( sectionHTML );

      setupCue( section );
    }

    function removeSection( container, div ){
      return function( e ){
        if ( container.firstChild !== container.lastChild ){
          container.removeChild( div );
          updateSections();
        }
      };
    }

    Butter.Editor.TrackEventEditor( _this, butter, rootElement,{
      open: function( parentElement, trackEvent ){
        _rootElement.querySelector( "#addSection" ).addEventListener( "click", function(){
          addSection();
        }, false );

        for ( var idx = 0; idx < _fields.length; idx++ ){
          var name = _fields[ idx ];
          _elements[ name ] = _rootElement.querySelector( "#" + name );
          _elements[ name ].addEventListener( "change", function( e ){
            updateSections();
          }, false);
        }

        options.target = config.target;
        target = document.getElementById( options.target );

        // TODO: Find out browser support for filter method
        savedSections = Popcorn.getTrackEvents( _popcorn ).filter( function( theTrackEvent ) {
          return theTrackEvent._id && theTrackEvent._id.indexOf( "toc-cue" ) > -1;
        });

        if ( savedSections.length > 0 ) {
          var theTrackEvent;
          options.sections = [];
          for ( var sectionIdx = 0; sectionIdx < savedSections.length; sectionIdx++ ) {
            theTrackEvent = savedSections[ sectionIdx ];
            theTrackEvent.section && options.sections.push( theTrackEvent.section );
            cueIds.push( theTrackEvent._id );
          }
          options.target = theTrackEvent.target;
          target = document.getElementById( options.target );
          options._container = target.querySelector( ".toc" );
        }
        else if ( sectionsFromConfig ) {
          options.sections = sectionsFromConfig;
        }

        _targets = _this.createTargetsList( [ butter.currentMedia ].concat( butter.targets ) );
        onEditorOpen();
        _this.applyExtraHeadTags( compiledLayout );
      },
      close: function(){
        _this.removeExtraHeadTags();
      }
    });
  });
}( window.Butter ));

