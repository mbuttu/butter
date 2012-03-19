/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define( [ "core/logger", "core/eventmanager" ], function( Logger, EventManager ){
  
  var __guid = 0;

  function TrackEvent( inputOptions, ui ){

    var _id = "trackEvent" + __guid++,
        _eventManager = new EventManager( this ),
        _element,
        _zoom = 1,
        _duration = 1,
        _start = inputOptions.start || 0,
        _end = inputOptions.end || _start + 1,
        _type = inputOptions.type,
        _selected = false,
        _this = this;

    function resetContainer(){
      _element.style.left = ( _start / _duration * _zoom ) + "px";
      _element.style.width = ( ( _end - _start ) / _duration * _zoom ) + "px";
    } //resetContainer

    this.update = function( options ){
      options = options || {};
      _element.style.top = "0px";
      _start = options.start || _start;
      _end = options.end || _end;
      resetContainer();
    }; //update

    Object.defineProperties( this, {
      element: {
        get: function(){ return _element; }
      },
      duration: {
        get: function(){ return _duration; },
        set: function( val ){
          _duration = val;
          resetContainer();
        }
      },
      start: {
        get: function(){ return _start; },
        set: function( val ){
          _start = val;
          resetContainer();
        }
      },
      end: {
        get: function(){ return _end; },
        set: function( val ){
          _end = val;
          resetContainer();
        }
      },
      text: {
        get: function(){ return _element.innerHTML; },
        set: function( val ){
          _element.innerHTML = text;
        }
      },
      selected: {
        get: function(){ return _selected; },
        set: function( val ){
          if( val ){
            select();
          }
          else {
            deselect();
          } //if
        }
      },
      zoom: {
        enumerable: true,
        get: function(){
          return _zoom;
        },
        set: function( val ){
          _zoom = val;
          resetContainer();
        }
      },
      duration: {
        enumerable: true,
        get: function(){
          return _element.getBoundingClientRect().width / _zoom;
        },
        set: function( val ){
          _element.style.width = ( val * _zoom ) + "px";
        }
      },
      id: {
        enumerable: true,
        configurable: false,
        get: function(){
          return _id;
        }
      }
    });

    function movedCallback( event, ui ) {
      _element.style.top = "0px";
      var rect = _element.getClientRects()[ 0 ];
      _start = _element.offsetLeft / _zoom;
      _end = _start + rect.width / _zoom;
      _eventManager.dispatch( "trackeventupdated", ui );
    } //movedCallback

    function createEventElement( options ){
      var element = document.createElement( "div" );
      // set options if they exist
      options.height && (element.style.height = options.height);
      options.top && (element.style.top = options.top);
      options.text && (element.innerHTML = options.text);
      element.style.position = options.position ? options.position : "absolute";

      // add css options if they exist
      if ( options.css ) {
        $( element ).css( options.css );
      } //if

      element.className = "trackliner-event";

      return element;
    } //createEventElement

    _element = inputOptions.element || createEventElement( inputOptions );
    _element.id = _id;
    _this.update( inputOptions );

    _element.addEventListener( "mousedown", function ( e ) {
      _eventManager.dispatch( "trackeventmousedown", e );
    }, false);
    _element.addEventListener( "mouseover", function ( e ) {
      _eventManager.dispatch( "trackeventmouseover", e );
    }, false );
    _element.addEventListener( "mouseout", function ( e ) {
      _eventManager.dispatch( "trackeventmouseout", e );
    }, false );

    _element.addEventListener( "dblclick", function ( e ) {
      _eventManager.dispatch( "trackeventdoubleclicked", e );
    }, false);

    function select( e ){
      _selected = true;
      _element.setAttribute( "selected", true );
    } //select

    function deselect( e ) {
      _selected = false;
      _element.removeAttribute( "selected" );
    } //deselect

    function dragInit( e, dd ) {
      var selectedEvents = $( "div[selected=true]" ),
          leftPositions = [],
          lowestLeft,
          p = $.event.special.drag.callback.prototype;

      for ( var idx = 0; idx < selectedEvents.length; idx++ )  {
        leftPositions.push( $( selectedEvents[ idx ] ).position().left );
      }

      p.lowestLeft = Math.min.apply( Math, leftPositions );

      return selectedEvents;
    }

    function dragStart( e, dd ) {
      var container = $( _element.parentNode.parentNode );
      dd.limit = container.position();
      dd.limit.left = dd.limit.left + $( this ).position().left - dd.lowestLeft;
      dd.limit.bottom = dd.limit.top + container.outerHeight() - $( this ).outerHeight();
      dd.limit.right = dd.limit.left + container.outerWidth() - $( this ).outerWidth();
    }

    function drag( e, dd ) {
      $( this ).css({
        top: Math.min( dd.limit.bottom, Math.max( dd.limit.top, dd.deltaY ) ),
        left: Math.min( dd.limit.right, Math.max( dd.limit.left, dd.offsetX ) )
      });
    }

    var handles;
    this.activate = function(){
      if( !handles ) {
        $( _element ).css({
          zIndex: 9001
        })
        .drag( "init", dragInit )
        .drag( "start", dragStart )
        .drag( "end", movedCallback )
        .drag( drag, { relative: true } )
        .resizable({
          autoHide: false, 
          containment: "parent", 
          handles: "e, w", 
          scroll: false,
          stop: movedCallback
        });

        handles = _element.querySelectorAll( ".ui-resizable-handle" );
        function toggleHandles( state ){
          handles[ 0 ].style.visibility = state ? "visible" : "hidden";
          handles[ 1 ].style.visibility = state ? "visible" : "hidden";
        } //toggleHandles
        _element.addEventListener( "mouseover", function( e ){
          toggleHandles( true );
        }, false );
        _element.addEventListener( "mouseout", function( e ){
          toggleHandles( false );
        }, false );
        toggleHandles( false );

      } //if

    }; //activate

    resetContainer();

  } //TrackEvent

  return TrackEvent;

});
