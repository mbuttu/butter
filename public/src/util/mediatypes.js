/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/uri" ],
  function( URI ) {

  var REGEX_MAP = {
        YouTube: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)youtu/,
        Vimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
        SoundCloud: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)(soundcloud)/,
        // supports #t=<start>,<duration>
        // where start or duration can be: X, X.X or XX:XX
        "null": /^\s*#t=(?:\d*(?:(?:\.|\:)?\d+)?),?(\d+(?:(?:\.|\:)\d+)?)\s*$/,
        Flickr: /https?:\/\/(www\.)flickr.com/
      },
      YOUTUBE_EMBED_DISABLED = "Embedding of this YouTube video is disabled",
      YOUTUBE_EMBED_UNPLAYABLE = "This YouTube video is unplayable",
      YOUTUBE_EMBED_PRIVATE = "Private videos cannot be loaded. Please use a public or unlisted video.",
      EMBED_UNPLAYABLE = "This media source is unplayable",
      SOUNDCLOUD_EMBED_DISABLED = "Embedding of this SoundCloud audio source is disabled";

  function jwPlayerFallback( options, successCallback, errorCallback ) {
    // We hit an error trying to load HTML5, try the jwplayer instead
    var media,
        div = document.createElement( "div" ),
        container = document.createElement( "div" );

    div.style.height = "400px";
    div.style.width = "400px";
    div.style.left = "-400px";
    div.style.position = "absolute";
    container.style.height = "100%";
    container.style.width = "100%";

    document.body.appendChild( div );
    div.appendChild( container );

    function errorEvent() {
      media.removeEventListener( "loadedmetadata", readyEvent, false );
      media.removeEventListener( "error", errorEvent, false );
      errorCallback( EMBED_UNPLAYABLE );
      document.body.removeChild( div );
    }

    function readyEvent() {
      media.removeEventListener( "loadedmetadata", readyEvent, false );
      media.removeEventListener( "error", errorEvent, false );
      document.body.removeChild( div );
      successCallback({
        source: options.source,
        title: options.title || options.source,
        type: options.type,
        thumbnail: options.thumbnail || "",
        linkback: options.linkback,
        duration: media.duration
      });
    }
    container.id = Popcorn.guid( "popcorn-jwplayer-" );
    media = Popcorn.HTMLJWPlayerVideoElement( container );
    media.addEventListener( "error", errorEvent, false );
    media.addEventListener( "loadedmetadata", readyEvent, false );
    media.src = options.source;
  }

  return {
    checkUrl: function( url ) {
      for ( var type in REGEX_MAP ) {
        if ( REGEX_MAP.hasOwnProperty( type ) ) {
          if ( REGEX_MAP[ type ].test( url ) ) {
            return type;
          }
        }
      }
      return "HTML5";
    },
    getMetaData: function( baseUrl, successCallback, errorCallback ) {
      var id,
          userId,
          parsedUri,
          splitUriDirectory,
          xhrURL,
          type = this.checkUrl( baseUrl ),
          videoElem;

      successCallback = successCallback || function(){};
      errorCallback = errorCallback || function(){};

      if ( type === "YouTube" ) {
        parsedUri = URI.parse( baseUrl );
        // youtube id can either be a query under v, example:
        // http://www.youtube.com/watch?v=p_7Qi3mprKQ
        // Or at the end of the url like this:
        // http://youtu.be/p_7Qi3mprKQ
        id = parsedUri.queryKey.v || parsedUri.directory.replace( "/", "" );
        if ( !id ) {
          return;
        }

        xhrURL = "https://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=jsonc&callback=?";
        Popcorn.getJSONP( xhrURL, function( resp ) {
          var respData = resp.data,
              from = parsedUri.queryKey.t,
              popcorn,
              div = document.createElement( "div" ),
              source;

          div.style.height = "400px";
          div.style.width = "400px";
          div.style.left = "-400px";
          div.style.position = "absolute";

          document.body.appendChild( div );

          if ( resp.error ) {
            if ( resp.error.code === 403 ){
              return errorCallback( YOUTUBE_EMBED_PRIVATE );
            }
            errorCallback( YOUTUBE_EMBED_UNPLAYABLE );
          }

          if ( !respData ) {
            return;
          }

          if ( respData.accessControl.embed === "denied" ) {
            errorCallback( YOUTUBE_EMBED_DISABLED );
            return;
          }

          function errorEvent() {
            popcorn.off( "loadedmetadata", readyEvent );
            popcorn.off( "error", errorEvent );
            errorCallback( YOUTUBE_EMBED_UNPLAYABLE );
            popcorn.destroy();
          }

          function readyEvent() {
            popcorn.off( "loadedmetadata", readyEvent );
            popcorn.off( "error", errorEvent );
            document.body.removeChild( div );
            popcorn.destroy();

            successCallback({
              source: source,
              title: respData.title,
              type: type,
              thumbnail: respData.thumbnail.hqDefault,
              author: respData.uploader,
              duration: popcorn.duration(),
              from: from
            });
          }

          if ( from ) {
            from = from.replace( /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/, function( all, hours, minutes, seconds ) {
              // Make sure we have real zeros
              hours = hours | 0; // bit-wise OR
              minutes = minutes | 0; // bit-wise OR
              seconds = seconds | 0; // bit-wise OR
              return ( +seconds + ( ( ( hours * 60 ) + minutes ) * 60 ) );
            });
          }

          source = "http://www.youtube.com/watch?v=" + id;
          popcorn = Popcorn.smart( div, source );
          popcorn.on( "error", errorEvent );
          if ( popcorn.media.readyState >= 1 ) {
            readyEvent();
          } else {
            popcorn.on( "loadedmetadata", readyEvent );
          }
        });
      } else if ( type === "SoundCloud" ) {
        parsedUri = URI.parse( baseUrl );
        splitUriDirectory = parsedUri.directory.split( "/" );
        id = splitUriDirectory[ splitUriDirectory.length - 1 ];
        userId = splitUriDirectory[ splitUriDirectory.length - 2 ];
        xhrURL = "https://api.soundcloud.com/tracks/" + id + ".json?callback=?&client_id=PRaNFlda6Bhf5utPjUsptg&user_id=" + userId;
        Popcorn.getJSONP( xhrURL, function( respData ) {
          if ( !respData ) {
            return;
          }

          if ( respData.sharing === "private" || respData.embeddable_by === "none" ) {
            errorCallback( SOUNDCLOUD_EMBED_DISABLED );
            return;
          }
          successCallback({
            source: baseUrl,
            type: type,
            thumbnail: respData.artwork_url || "../../resources/icons/soundcloud-small.png",
            duration: respData.duration / 1000,
            title: respData.title,
            hidden: true
          });
        });
      } else if ( type === "Vimeo" ) {
        parsedUri = URI.parse( baseUrl );
        splitUriDirectory = parsedUri.directory.split( "/" );
        id = splitUriDirectory[ splitUriDirectory.length - 1 ];
        xhrURL = "https://vimeo.com/api/v2/video/" + id + ".json?callback=?";
        Popcorn.getJSONP( xhrURL, function( respData ) {
          respData = respData && respData[ 0 ];
          if ( !respData ) {
            return;
          }
          successCallback({
            source: baseUrl,
            type: type,
            thumbnail: respData.thumbnail_small,
            duration: respData.duration,
            title: respData.title
          });
        });
      } else if ( type === "null" ) {
        successCallback({
          source: baseUrl,
          type: type,
          title: baseUrl,
          duration: +REGEX_MAP[ "null" ].exec( baseUrl )[ 1 ]
        });
      } else if ( type === "HTML5" ) {
        parsedUri = URI.parse( baseUrl );

        var title = parsedUri.file.substring( 0, parsedUri.file.lastIndexOf( "." ) );

        videoElem = document.createElement( "video" );
        videoElem.addEventListener( "loadedmetadata", function() {
          successCallback ({
            source: baseUrl,
            type: type,
            title: title,
            thumbnail: URI.makeUnique( baseUrl ).toString(),
            duration: videoElem.duration
          });
        }, false );
        videoElem.addEventListener( "error", function() {
          var options = {
            source: baseUrl,
            type: type,
            title: title
          };
          jwPlayerFallback( options, successCallback, errorCallback );
        }, false );
        baseUrl = baseUrl.replace( /\s/g, encodeURIComponent( " " ) );
        videoElem.src = URI.makeUnique( baseUrl ).toString();
      }
    }
  };
});