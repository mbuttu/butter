(function ( Butter ){
  document.addEventListener( "DOMContentLoaded", function( e ){
    Butter.init({
      config: "config.json",
      ready: function( butter ){
        var trackEvent = butter.getTrackEventsByType( "toc" )[ 0 ],
            tocPlugin = document.querySelector( "[data-popcorn-plugin-type=toc]" );

        if ( trackEvent ) {
          // hide the toc track event so that the editor can only be opened
          // from the template
          trackEvent.view.element.style.display = "none";
          // hide the toc plugin from the plugin-list editor so that only one
          // toc can be added to a project
          tocPlugin.style.display = "none";
        }

        var tocButton = document.getElementById( "opentoc" );
        tocButton.addEventListener( "click", function( e ) {
          butter.editor.openEditor( "toc", false, trackEvent );
        });
      }
    });
  }, false );
}( window.Butter ));
