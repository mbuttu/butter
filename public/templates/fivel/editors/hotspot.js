/*global EditorHelper*/

EditorHelper.addPlugin( "hotspot", function( trackEvent ) {
  var _container,
      target,
      hotspots;

    _container = trackEvent.popcornTrackEvent._container;
    hotspots = _container.querySelectorAll( ".hotspot-container" );
    target = trackEvent.popcornTrackEvent._target;

    function callback( ui, elem ) {
      var hotspotId = elem.getAttribute( "data-hotspot-container-id" ),
          frames = trackEvent.popcornOptions.frames,
          frame,
          foundHotspot;

      for ( var i = 0; i < frames.length; i++ ) {
        frame = frames[ i ];

        for ( var k = 0; k < frame.hotspots.length; k++ ) {
          if ( frame.hotspots[ k ].id === hotspotId ) {
            foundHotspot = frame.hotspots[ k ];
            break;
          }
        }
      }

      if ( foundHotspot ) {
        foundHotspot.top = ui.top;
        foundHotspot.left = ui.left;
        foundHotspot.height = ui.height;
        foundHotspot.width = ui.width;

        trackEvent.update({
          frames: frames.slice( 0 )
        });
      }
    }

    if ( window.jQuery ) {
      for ( var i = 0; i < hotspots.length; i++ ) {
        // This is used because the version of butter that Fivel includes doesn't have our
        // selectable code. That selectable code also causes some problems with this.
        hotspots[ i ].style.boxShadow = "0 0 1px #3fb58e";
        hotspots[ i ].style.border = "1px solid #3fb58e";
        hotspots[ i ].style.margin = "-1px";

        EditorHelper.draggable( trackEvent, hotspots[ i ], target, {
          disableTooltip: true,
          end: callback
        });
        EditorHelper.resizable( trackEvent, hotspots[ i ], target, {
          handlePositions: "n,ne,e,se,s,sw,w,nw",
          end: callback
        });
      }
    }
});
