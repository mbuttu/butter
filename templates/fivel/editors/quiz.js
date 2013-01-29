/*global EditorHelper*/

EditorHelper.addPlugin( "quiz", function( trackEvent ) {
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
