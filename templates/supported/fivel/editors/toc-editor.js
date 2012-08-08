(function( Butter ){

  Butter.Editor.register( "toc", "load!{{baseDir}}/templates/supported/fivel/editors/toc-editor.html", function( rootElement, butter ) {

    var _this = this,
        _rootElement = rootElement,
        _fields = [ "start", "end", "target", "sections" ],
        _messageContainer = _rootElement.querySelector( "div.error-message" ),
        _targets,
        _trackEvent,
        _elements = {},
        _popcornOptions = {};

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

    function updateTrackEvent(){
      var sections = _rootElement.querySelector( "#sections" ).children;

      setErrorState( false );

      for ( idx = 0; idx < _fields.length; idx ++ ){
        var field = _fields[ idx ],
            element = _elements[ field ];
        if ( field !== "sections" ){
          _popcornOptions[ field ] = element.type === "checkbox" ? element.checked : element.value;
        }
      }

      _popcornOptions.sections = [];

      for ( var idx = 0; idx < sections.length; idx++ ){
        var section = _popcornOptions.sections[ idx ];
        if ( !section ){
          section = _popcornOptions.sections[ idx ] = {};
        }

        section.title = sections[ idx ].querySelector( ".section-title" ).value;
        section.time = sections[ idx ].querySelector( ".section-time" ).value;
        section.description = sections[ idx ].querySelector( ".section-description" ).value;
      }

      try{
        _trackEvent.update( _popcornOptions );
      }
      catch( e ){
        setErrorState( e.toString() );
      }
    }

    function addSection( e ){
      var divDescription = document.createElement( "div" ),
          ul = document.createElement( "ul" ),
          li = document.createElement( "li" ),
          inputDescription = document.createElement( "textarea" ),
          removeButton = document.createElement( "button" ),
          inputTime = document.createElement( "input" ),
          inputTitle = document.createElement( "input" ),
          labelTime = document.createElement( "label" ),
          labelTitle = document.createElement( "label" ),
          labelDescription = document.createElement( "label" ),
          labelStyle = "trackevent-property default input";

      labelTitle.innerHTML = "Title";
      labelTime.innerHTML = "Time";
      labelDescription.innerHTML = "Description";

      labelTime.setAttribute( "class", labelStyle );
      labelTitle.setAttribute( "class", labelStyle );
      labelDescription.setAttribute( "class", labelStyle );
      divDescription.setAttribute( "class", labelStyle );

      inputTitle.classList.add( "section-title" );
      inputTime.classList.add( "section-time" );
      inputDescription.classList.add( "section-description" );

      ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
      inputDescription.setAttribute( "style", "float: right; width: 130px" );
      divDescription.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );

      removeButton.innerHTML = "-";
      removeButton.addEventListener( "click", removeSection( removeButton, _elements.sections, divDescription ), false );

      // add default here
      inputTitle.value = "Title";
      // add a better time?
      inputTime.value = "00:00";
      inputDescription.innerHTML = "Description";

      li.appendChild( labelTitle );
      li.appendChild( inputTitle );
      li.appendChild( removeButton );

      ul.appendChild( li );
      li = document.createElement( "li" );

      li.appendChild( labelTime );
      li.appendChild( inputTime );

      ul.appendChild( li );
      li = document.createElement( "li" );

      li.appendChild( labelDescription );
      li.appendChild( inputDescription );

      ul.appendChild( li );

      divDescription.appendChild( ul );

      _rootElement.querySelector( "#sections" ).appendChild( divDescription );
      updateTrackEvent();
    }

    function removeSection( aAddButton, container, div ){
      return function( e ){
        if ( container.firstChild !== container.lastChild ){
          container.removeChild( div );
          updateTrackEvent();
        }
      };
    }

    function onEditorOpen( e ){
      var sections = _popcornOptions.sections,
          labelStyle = "trackevent-property default input",
          container, ul, li, label, input, section, removeButton;

      for ( var idx = 0; idx < sections.length; idx++ ){
        section = sections[ idx ];
        container = document.createElement( "div" );
        container.setAttribute( "class", labelStyle );
        ul = document.createElement( "ul" );
        label = document.createElement( "label" );
        input = document.createElement( "input" );
        li = document.createElement( "li" );
        removeButton = document.createElement( "button" );

        removeButton.innerHTML = "-";
        removeButton.addEventListener( "click", removeSection( removeButton, _elements.sections, container ), false );

        ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
        container.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );

        label.innerHTML = "Title";
        label.setAttribute( "class", labelStyle );
        input.value = section.title;
        input.setAttribute( "class", "section-title" );

        li.appendChild( label );
        li.appendChild( input );
        li.appendChild( removeButton );
        ul.appendChild( li );

        label = document.createElement( "label" );
        input = document.createElement( "input" );
        li = document.createElement( "li" );

        label.innerHTML = "Time";
        label.setAttribute( "class", labelStyle );
        input.value = section.time;
        input.setAttribute( "class", "section-time" );

        li.appendChild( label );
        li.appendChild( input );
        ul.appendChild( li );

        label = document.createElement( "label" );
        input = document.createElement( "textarea" );
        li = document.createElement( "li" );

        label.innerHTML = "Description";
        label.setAttribute( "class", labelStyle );
        input.innerHTML = section.description;
        input.setAttribute( "class", "section-description" );
        input.setAttribute( "style", "float: right; width: 130px" );

        li.appendChild( label );
        li.appendChild( input );
        ul.appendChild( li );
        container.appendChild( ul );
        _elements.sections.appendChild( container );
      }

      var select = _targets.querySelector( "select" ),
          targets;
      select.removeChild( select.querySelector( ".default-target-option" ) );
      targets = _targets.querySelector( "select" ).children;

      while ( targets[ 0 ] ){
        _elements.target.appendChild( targets[ 0 ] );
      }

      _elements.target.value = _trackEvent.popcornOptions.target;

      refreshUI();
    }


    function refreshUI() {
      _elements.start.value = _popcornOptions.start;
      _elements.end.value = _popcornOptions.end;
    }

    function onTrackEventUpdated( e ){
      refreshUI();
    }

    Butter.Editor.TrackEventEditor( _this, butter, rootElement,{
      open: function( parentElement, trackEvent ){

        _rootElement.querySelector( "#addSection" ).addEventListener( "click", addSection, false );

        for ( var idx = 0; idx < _fields.length; idx++ ){
          var name = _fields[ idx ];
          _elements[ name ] = _rootElement.querySelector( "#" + name );
          _elements[ name ].addEventListener( "change", function( e ){
            updateTrackEvent();
          }, false);
        }

        _targets = _this.createTargetsList( [ butter.currentMedia ].concat( butter.targets ) );
        _popcornOptions = trackEvent.popcornOptions;
        _trackEvent = trackEvent;
        onEditorOpen();
        _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
      },
      close: function(){
        _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
      }
    });
  });
}( window.Butter ));
