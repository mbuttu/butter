(function( Butter ){
  Butter.Editor.register( "toc", "load!{{baseDir}}/templates/fivel/editors/toc-editor.html", function( rootElement, butter, compiledLayout ) {
    var _this = this,
        _rootElement = rootElement,
        _fields = [ "target", "sections" ],
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _sectionHTML = compiledLayout.querySelector( ".section" ),
        _elements = {},
        _targets, _popcornOptions, _trackEvent;

    function setErrorState( message ){
      if ( message ){
        _messageContainer.innerHTML = message;
        _messageContainer.parentNode.style.height = _messageContainer.offsetHeight + "px";
        _messageContainer.parentNode.style.visibility = "visible";
        _messageContainer.parentNode.classList.add( "open" );
      }
      else{
        _messageContainer.innerHTML = "";
        _messageContainer.parentNode.style.visibility = "";
        _messageContainer.parentNode.classList.remove( "open" );
      }
    }

    function updateTrackEvent(){
      var sections = _elements.sections.children,
          updateOptions = {
            sections: []
          };

      setErrorState( false );

      for ( var idx = 0; idx < sections.length; idx++ ){
        var section = {};
        section.title = sections[ idx ].querySelector( ".toc-section-title" ).value;
        section.time = sections[ idx ].querySelector( ".toc-section-time" ).value;
        section.description = sections[ idx ].querySelector( ".toc-section-description" ).value;
        section.useDuration = sections[ idx ].querySelector( ".toc-section-use-duration" ).value === "true";
        updateOptions.sections.push( section );
      }

      updateOptions.target = _elements.target.value;

      try {
        _trackEvent.update( updateOptions );
      } catch( e ){
        setErrorState( e.toString() );
      }
    }

    function onEditorOpen( e ){
      var sections = _elements.sections.children;

      while ( sections[ 0 ] ) {
        _elements.sections.removeChild( sections[ 0 ] );
      }

      // Create on section by default with a start time of 00:00
      if ( _popcornOptions.sections.length === 0 ) {
        _popcornOptions.sections = [];
        _popcornOptions.sections.push({
          title: "Intro",
          time: "00:00",
          description: "This is the introduction"
        });
      }

      for ( var idx = _popcornOptions.sections.length - 1; idx >= 0; idx-- ) {
        var section = _popcornOptions.sections[ idx ];
        addSection( section );
      }

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

      _elements.target.value = _popcornOptions.target;
    }

    function addSection( section ) {
      var sectionHTML, title, time, description, removeButton, useDuration;

      // Adding a new section
      if ( !section ) {
        section = {
          title: "Section Title",
          time: "00:00",
          description: ""
        };
      }

      sectionHTML = _sectionHTML.cloneNode( true );

      title = sectionHTML.querySelector( ".toc-section-title" );
      title.value = section.title;
      removeButton = sectionHTML.querySelector( ".toc-section-remove-button" );
      removeButton.addEventListener( "click", removeSection( _elements.sections, sectionHTML ), false );
      time = sectionHTML.querySelector( ".toc-section-time" );
      time.value = section.time;
      description = sectionHTML.querySelector( ".toc-section-description" );
      description.innerHTML = section.description;
      useDuration = sectionHTML.querySelector( ".toc-section-use-duration" );
      useDuration.value = section.useDuration;
      _elements.sections.insertBefore( sectionHTML, _elements.sections.firstChild );
    }

    function removeSection( container, div ){
      return function( e ){
        if ( container.firstChild !== container.lastChild ){
          container.removeChild( div );
          updateTrackEvent();
          container.firstChild.querySelector("input").focus();
        }
      };
    }

    Butter.Editor.TrackEventEditor.extend( _this, butter, rootElement,{
      open: function( parentElement, trackEvent ){
        _rootElement.querySelector( "#addSection" ).addEventListener( "click", function(){
          addSection();
        }, false );

        for ( var idx = 0; idx < _fields.length; idx++ ){
          var name = _fields[ idx ];
          _elements[ name ] = _rootElement.querySelector( "#" + name );
          _elements[ name ].addEventListener( "change", function( e ){
            updateTrackEvent();
          }, false);
        }

        _targets = _this.createTargetsList( [ butter.currentMedia ].concat( butter.targets ) );
        _trackEvent = trackEvent;
        _popcornOptions = _trackEvent.popcornOptions;
        _this.applyExtraHeadTags( compiledLayout );
        onEditorOpen();
      },
      close: function(){
        butter.unlisten( "trackeventupdated", onEditorOpen );
        _this.removeExtraHeadTags();
      }
    });
  });
}( window.Butter ));

