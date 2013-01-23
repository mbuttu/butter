/*global EditorHelper*/

EditorHelper.addPlugin( "toc", function( trackEvent ) {
  debugger;
  var _container,
      _popcornOptions,
      target;

  _popcornOptions = trackEvent.popcornTrackEvent;
  _container = _popcornOptions._container;
  target = _popcornOptions._target;

  if ( window.jQuery ) {

    window.EditorHelper.draggable( trackEvent, _container, target );
  }

});
