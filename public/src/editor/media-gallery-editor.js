/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "util/lang", "util/uri", "util/xhr", "util/keys", "util/mediatypes", "editor/editor",
 "util/time", "util/dragndrop", "text!layouts/media-editor.html" ],
  function( LangUtils, URI, XHR, KeysUtils, MediaUtils, Editor, Time, DragNDrop, EDITOR_LAYOUT ) {

  var _parentElement =  LangUtils.domFragment( EDITOR_LAYOUT, ".media-editor" ),
      _addMediaPanel = _parentElement.querySelector( ".add-media-panel" ),

      _clipBtnText = "Create clip",
      _searchBtnText = "Search",
      _resultsText = "Results",
      _myMediaText = "My Media Gallery",

      _urlInput = _addMediaPanel.querySelector( ".add-media-input" ),
      _addBtn = _addMediaPanel.querySelector( ".add-media-btn" ),
      _errorMessage = _parentElement.querySelector( ".media-error-message" ),
      _loadingSpinner = _parentElement.querySelector( ".media-loading-spinner" ),

      _searchInput = _addMediaPanel.querySelector( ".search-media-input" ),

      _oldValue,
      _galleryPanel = _parentElement.querySelector( ".media-gallery" ),
      _galleryHeader = _parentElement.querySelector( ".media-gallery-heading" ),
      _galleryList = _galleryPanel.querySelector( "#project-items" ),
      _GALLERYITEM = LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item.gallery-video" ),
      _searchSelector = _parentElement.querySelector( ".search-items > select" ),
      _pagingContainer = _parentElement.querySelector( ".paging-container" ),
      _projectTab = _parentElement.querySelector( ".project-tab" ),
      _searchTab = _parentElement.querySelector( ".search-tab" ),

      // Rackspace variables
      _rackspaceTab = _parentElement.querySelector( ".rackspace-tab" ),
      _rackspaceContainer = _parentElement.querySelector( ".rackspace-container" ),
      _rackspaceSelect = _rackspaceContainer.querySelector( "select" ),
      _rackspaceInput = _rackspaceContainer.querySelector( "input" ),
      _rackspaceButton = _rackspaceContainer.querySelector( ".rackspace-search" ),
      _rackspaceButtonNPrefix = _rackspaceContainer.querySelector( ".rackspace-search-nprefix" ),

      _itemContainers = {
        project: _galleryList,
        YouTube: _galleryPanel.querySelector( "#youtube-items" ),
        SoundCloud: _galleryPanel.querySelector( "#soundcloud-items" ),
        Rackspace: _galleryPanel.querySelector( "#rackspace-items" ),
      },
      _sectionContainers = {
        project: _addMediaPanel.querySelector( ".project-clips" ),
        search: _addMediaPanel.querySelector( ".search-items" )
      },

      _currentSearch = "YouTube",
      _butter,
      _media,
      _mediaLoadTimeout,
      _cancelSpinner,

      _photoTypes = [
        "Flickr",
        "Giphy"
      ],

      // Must match the value specified on the server end
      // This version of popcorn maker is missing other code that would
      // allow for config options to specify it
      _LIMIT = 20,
      MEDIA_LOAD_TIMEOUT = 10000,
      _this,
      TRANSITION_TIME = 2000;

  function resetInput() {
    _urlInput.value = "";
    _searchInput.value = "";

    clearTimeout( _mediaLoadTimeout );
    clearTimeout( _cancelSpinner );
    _urlInput.classList.remove( "error" );
    _addMediaPanel.classList.remove( "invalid-field" );
    _errorMessage.classList.add( "hidden" );
    _loadingSpinner.classList.add( "hidden" );

    _addBtn.classList.add( "hidden" );
  }

  function onDenied( error, preventFieldHightlight ) {
    clearTimeout( _cancelSpinner );
    clearTimeout( _mediaLoadTimeout );
    _errorMessage.innerHTML = error;
    _loadingSpinner.classList.add( "hidden" );
    if ( !preventFieldHightlight ) {
      _addMediaPanel.classList.add( "invalid-field" );
    }
    setTimeout( function() {
      _errorMessage.classList.remove( "hidden" );
    }, 300 );
  }

  function dragNDrop( element, popcornOptions ) {
    DragNDrop.helper( element, {
      pluginOptions: popcornOptions,
      start: function() {
        for ( var i = 0, l = _butter.targets.length; i < l; ++i ) {
          _butter.targets[ i ].iframeDiv.style.display = "block";
        }
      },
      stop: function() {
        _butter.currentMedia.pause();
        for ( var i = 0, l = _butter.targets.length; i < l; ++i ) {
          _butter.targets[ i ].iframeDiv.style.display = "none";
        }

        popcornOptions.source = URI.makeUnique( URI.stripUnique( popcornOptions.source ).toString() ).toString();

        if ( popcornOptions.fallback ) {
          popcornOptions.fallback = URI.makeUnique( URI.stripUnique( popcornOptions.fallback ).toString() ).toString();
        }
      }
    });
  }

  function addPhotoEvent( popcornOptions ) {
    _butter.deselectAllTrackEvents();
    _butter.generateSafeTrackEvent({
      type: "image",
      popcornOptions: popcornOptions
    });
  }

  function addPhotos( data, options ) {
    var el = options.element || LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item.gallery-photo" ),
        deleteBtn = el.querySelector( ".mg-delete-btn" ),
        thumbnailBtn = el.querySelector( ".mg-thumbnail" ),
        thumbnailImg = document.createElement( "img" ),
        thumbnailSrc = data.thumbnail,
        iconSource = "/resources/icons/",
        source = data.source;

    thumbnailBtn.addEventListener( "mouseover", function() {
      thumbnailImg.src = source;
    });

    thumbnailBtn.addEventListener( "mouseout", function() {
      thumbnailImg.src = thumbnailSrc;
    });

    dragNDrop( thumbnailBtn, { src: source } );

    thumbnailBtn.setAttribute( "data-popcorn-plugin-type", "image" );
    thumbnailBtn.setAttribute( "data-butter-draggable-type", "plugin" );

    el.querySelector( ".mg-title" ).innerHTML = data.title;

    if ( data.type === "Flickr" ) {
      iconSource += "flickr-black.png";
    } else {
      iconSource += "giphy.png";
    }

    el.querySelector( ".mg-type > img" ).src = iconSource;
    el.querySelector( ".mg-type-text" ).innerHTML = data.type;
    thumbnailBtn.appendChild( thumbnailImg );
    thumbnailImg.src = thumbnailSrc;

    if ( options.remove ) {
      deleteBtn.addEventListener( "click", function() {

        thumbnailBtn.removeEventListener( "click", addEvent, false );
        options.container.removeChild( el );
        _this.scrollbar.update();
        delete _media.clipData[ source ];
        _butter.dispatch( "mediaclipremoved" );
      }, false );
    } else {
      el.removeChild( deleteBtn );
    }

    options.callback = options.callback || addPhotoEvent;

    function addEvent() {
      var popcornOptions = {
            src: source,
            start: _butter.currentTime,
            title: data.title
          };

      options.callback( popcornOptions, data );
    }

    thumbnailBtn.addEventListener( "click", addEvent, false );

    options.container.insertBefore( el, options.container.firstChild );

    if ( _this.scrollbar ) {
      _this.scrollbar.update();
    }
    resetInput();
  }

  function addMediaEvent( popcornOptions ) {
    _butter.deselectAllTrackEvents();
    _butter.generateSafeTrackEvent({
      type: "sequencer",
      popcornOptions: popcornOptions
    });
  }

  function addMedia( data, options ) {
    var el = options.element || _GALLERYITEM.cloneNode( true ),
        container = options.container,
        deleteBtn = el.querySelector( ".mg-delete-btn" ),
        thumbnailBtn = el.querySelector( ".mg-thumbnail" ),
        thumbnailImg,
        thumbnailSrc = data.thumbnail,
        source = data.source,
        popcornOptions = {
          source: data.source,
          denied: data.denied,
          end: data.duration,
          thumbnailSrc: thumbnailSrc,
          from: data.from || 0,
          title: data.title,
          duration: data.duration,
          linkback: data.linkback,
          base: data.base,
          path: data.path,
          hidden: data.hidden || false
        };

    data.duration = ( +data.duration );

    if ( data.fallback ) {
      popcornOptions.fallback = [ data.fallback ];
    }

    dragNDrop( thumbnailBtn, popcornOptions );

    thumbnailBtn.setAttribute( "data-popcorn-plugin-type", "sequencer" );
    thumbnailBtn.setAttribute( "data-butter-draggable-type", "plugin" );

    if ( options.remove ) {
      deleteBtn.addEventListener( "click", function() {

        thumbnailBtn.removeEventListener( "click", addEvent, false );
        container.removeChild( el );
        _this.scrollbar.update();
        delete _media.clipData[ source ];
        _butter.dispatch( "mediaclipremoved" );
      }, false );
    } else {
      el.removeChild( deleteBtn );
    }

    _loadingSpinner.classList.add( "hidden" );

    el.querySelector( ".mg-title" ).title = el.querySelector( ".mg-title" ).innerHTML = data.title;
    el.querySelector( ".mg-type" ).classList.add( data.type.toLowerCase() + "-icon" );
    el.querySelector( ".mg-type-text" ).innerHTML = data.type;
    el.querySelector( ".mg-duration" ).innerHTML = Time.toTimecode( data.duration, 0 );
    if ( data.type === "HTML5" ) {
      if ( typeof data.thumbnail === "object" ) {
        thumbnailSrc = URI.makeUnique( data.source ).toString();
      }
      thumbnailImg = document.createElement( "video" );
    } else {
      thumbnailImg = document.createElement( "img" );
    }
    thumbnailBtn.appendChild( thumbnailImg );
    thumbnailImg.src = thumbnailSrc;

    el.classList.add( "mg-" + data.type.toLowerCase() );

    function addEvent() {
      var start = _butter.currentTime,
          end = start + data.duration;

      popcornOptions.source = URI.makeUnique( URI.stripUnique( data.source ).toString() ).toString();

      if ( popcornOptions.fallback ) {
        popcornOptions.fallback = URI.makeUnique( URI.stripUnique( data.fallback ).toString() ).toString();
      }

      popcornOptions.start = start;
      popcornOptions.end = end;

      options.callback = options.callback || addMediaEvent;
      options.callback( popcornOptions, data );
    }

    thumbnailBtn.addEventListener( "click", addEvent, false );

    options.container.insertBefore( el, options.container.firstChild );

    if ( _this.scrollbar ) {
      _this.scrollbar.update();
    }
    resetInput();
  }

  function onSuccess( data ) {
    var el = _GALLERYITEM.cloneNode( true ),
        source = data.source;

    if ( !_media.clipData[ source ] ) {
      _media.clipData[ source ] = data;
      _butter.dispatch( "mediaclipadded" );

      el.classList.add( "new" );

      setTimeout(function() {
        el.classList.remove( "new" );
      }, TRANSITION_TIME );

      addMedia( data, {
        element: el,
        container: _galleryList,
        remove: true
      });
    } else {
      onDenied( "Your gallery already has that media added to it" );
    }
  }

  function addMediaToGallery( url, onDenied ) {
    var data = {};

    // Don't trigger with empty inputs
    if ( !url ) {
      return;
    }

    var checkUrl = URI.parse( url );

    if ( !checkUrl.protocol ) {
      url = window.location.protocol + "//" + url;
    }
    data.source = url;
    data.type = "sequencer";
    _mediaLoadTimeout = setTimeout( function() {
      _errorMessage.innerHTML = "Your media source is taking too long to load";
      _errorMessage.classList.remove( "hidden" );
      _addMediaPanel.classList.add( "invalid-field" );
    }, MEDIA_LOAD_TIMEOUT );
    MediaUtils.getMetaData( data.source, onSuccess, onDenied );
  }

  function onFocus() {
    _oldValue = _urlInput.value;
  }

  function onInput() {
    if ( _urlInput.value || _searchInput.value ) {
      _addBtn.classList.remove( "hidden" );
    } else {
      _addBtn.classList.add( "hidden" );
    }
    clearTimeout( _cancelSpinner );
    clearTimeout( _mediaLoadTimeout );
    _addMediaPanel.classList.remove( "invalid-field" );
    _loadingSpinner.classList.add( "hidden" );
    _errorMessage.classList.add( "hidden" );
  }

  function onEnter( e ) {
    if ( e.keyCode === KeysUtils.ENTER ) {
      e.preventDefault();

      if ( !_sectionContainers.project.classList.contains( "butter-hidden" ) ) {
        onAddMediaClick();
      } else {
        searchAPIs( true );
      }
    }
  }

  function formatSource( value ) {
    return !value ? "" : value.trim().split( " " ).join( "" );
  }

  function onAddMediaClick() {
    // transitionend event is not reliable and not cross browser supported.
    _cancelSpinner = setTimeout( function() {
      _loadingSpinner.classList.remove( "hidden" );
    }, 300 );
    _addBtn.classList.add( "hidden" );
    _urlInput.value = formatSource( _urlInput.value );
    addMediaToGallery( _urlInput.value, onDenied );
  }

  function addPhotoCallback( popcornOptions, data ) {
    var source = data.source,
        element;

    // We want to add images from searching/accounts to that project's gallery
    if ( !_media.clipData[ source ] ) {
      _media.clipData[ source ] = data;
      _butter.dispatch( "mediaclipadded" );
      element = LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item.gallery-photo" );
      element.classList.remove( "gallery-item-grid" );
      addPhotos( data, {
        container: _galleryList,
        element: element,
        remove: true
      });
    }

    addPhotoEvent( popcornOptions );
  }

  function addMediaCallback( popcornOptions, data ) {
    if ( !_media.clipData[ data.source ] ) {
      _media.clipData[ data.source ] = data;
      _butter.dispatch( "mediaclipadded" );
      addMedia( data, {
        container: _galleryList,
        remove: true
      });
    }

    addMediaEvent( popcornOptions );
  }

  function pagingSearchCallback( page ) {
    var search = _currentSearch,
        container = _itemContainers[ _currentSearch ],
        value = _searchInput.value || container.dataset.query,
        query,
        loadingLi = document.createElement( "li" );

    value = value ? value.trim() : "";
    _searchInput.value = value;

    if ( !value ) {
      return onDenied( "Your search contained no results!" );
    }

    query = value;
    container.setAttribute( "data-query", value );

    // Hashtags will break URLs
    if ( value.charAt( 0 ) === "#" ) {
      query = value.substring( 1 );
    }

    query = encodeURIComponent( query );
    container.innerHTML = "";
    container.setAttribute( "data-page", page );
    loadingLi.innerHTML = "<span class=\"media-loading-spinner butter-spinner media-gallery-loading\" ></span>";
    container.appendChild( loadingLi );

    XHR.get( "/api/webmaker/search/" + _currentSearch + "?page=" + page + "&q=" + query, function( data ) {
      container.innerHTML = "";

      if ( data.status === "okay" ) {
        container.setAttribute( "data-total", data.total );

        // If the user selects the project tab before finishing, we still populate that container
        // with results, but prevent the pagination controls from displaying.
        if ( !_projectTab.classList.contains( "butter-active" ) ) {
          pagination( page, data.total, pagingSearchCallback );
        } else {
          pagination( 1, 0, pagingSearchCallback );
        }

        if ( data.results && data.results.length ) {
          for ( var k = 0; k < data.results.length; k++ ) {
            if ( search !== "Flickr" && search !== "Giphy" ) {
              addMedia( data.results[ k ], {
                container: container,
                callback: addMediaCallback
              });
            } else {
              addPhotos( data.results[ k ], {
                container: container,
                callback: addPhotoCallback
              });
            }
          }

          resetInput();
        } else {
          onDenied( "Your search contained no results!" );
        }

        _this.scrollbar.update();
      } else {
        onDenied( "An error occured when making your request!", true );
      }
    });
  }

  var pagination = function( page, total, callback ) {

    // Ensure page and toal are always an integer. IE: 2 and not "2"
    page = parseInt( page, 10 );
    total = parseInt( total, 10 );

    _parentElement.classList.add( "no-paging" );

    if ( !total ) {
      return;
    }

    var ul = _pagingContainer.querySelector( "ul" ),
        li,
        MAX_NUMS = 5,
        totalPages = total ? Math.ceil( total / _LIMIT ) : 0,
        set = Math.floor( ( page - 1 ) / MAX_NUMS ),
        startPage = set * MAX_NUMS + 1,
        endPage = Math.min( ( set * MAX_NUMS ) + MAX_NUMS, totalPages ),
        nextBtn = document.createElement( "li" ),
        prevBtn = document.createElement( "li" );

    prevBtn.innerHTML = "<span class=\"icon-chevron-left\"></span>";
    nextBtn.innerHTML = "<span class=\"icon-chevron-right\"></span>";

    ul.innerHTML = "";

    // Show previous?
    if ( page > 1 ) {
      prevBtn.addEventListener( "click", function() {
        callback( page - 1 );
      }, false );
      ul.appendChild( prevBtn );
    }

    function pageClick( e ) {
      var nextPage = e.target.getAttribute( "data-page" );

      // Ensure page is always an integer. IE: 2 and not "2"
      nextPage = parseInt( nextPage, 10 );

      callback( nextPage );
    }

    // Iterate over all pages;
    for ( var i = startPage; i <= endPage; i++ ) {
      li = document.createElement( "li" );
      li.innerHTML = i;
      li.setAttribute( "data-page", i );

      if ( i === page ) {
        li.classList.add( "active" );
      }
      // If we only have one page, don't add a listener to trigger another page.
      if ( total > _LIMIT ) {
        li.addEventListener( "click", pageClick, false );
      }

      ul.appendChild( li );
    }

    if ( totalPages > endPage ) {
      var ellipsis = document.createElement( "li" );
      li = document.createElement( "li" );
      li.innerHTML = totalPages;

      li.addEventListener( "click", function() {
        callback( totalPages );
      }, false );

      ellipsis.classList.add( "ellipsis" );
      ul.appendChild( ellipsis );
      ul.appendChild( li );
    }

    if ( page < totalPages ) {
      nextBtn.addEventListener( "click", function() {
        callback( page + 1 );
      }, false );
      ul.appendChild( nextBtn );
    }

    _parentElement.classList.remove( "no-paging" );
  };

  function searchAPIs( resetPage ) {
    var page = _itemContainers[ _currentSearch ].dataset.page;
    _addBtn.classList.add( "hidden" );

    // Reset page as it's a new search.
    if ( resetPage ) {
      page = 1;
    }

    pagingSearchCallback( page );
  }

  function setup() {
    _urlInput.addEventListener( "focus", onFocus, false );
    _urlInput.addEventListener( "input", onInput, false );
    _urlInput.addEventListener( "keydown", onEnter, false );

    _searchInput.addEventListener( "focus", onFocus, false );
    _searchInput.addEventListener( "input", onInput, false );
    _searchInput.addEventListener( "keydown", onEnter, false );

    _addBtn.addEventListener( "click", function( e ) {
      if ( !_sectionContainers.project.classList.contains( "butter-hidden" ) ) {
        onAddMediaClick( e );
      } else {
        searchAPIs( true );
      }
    }, false );
  }

  Editor.register( "media-editor", null, function( rootElement, butter ) {
    rootElement = _parentElement;
    _this = this;
    _butter = butter;
    _media = _butter.currentMedia;

    // We keep track of clips that are in the media gallery for a project once it is saved
    // and every time after it is saved.
    var clips = _media.clipData,
        clip,
        element;

    for ( var key in clips ) {
      if ( clips.hasOwnProperty( key ) ) {
        clip = clips[ key ];
        if ( typeof clip === "object" ) {
          clip.source = formatSource( clip.source );

          if ( _photoTypes.indexOf( clip.type ) === -1 ) {
            addMedia( clip, {
              container: _galleryList,
              remove: true
            });
          } else {
            element = LangUtils.domFragment( EDITOR_LAYOUT, ".media-gallery-item.gallery-photo" );
            element.classList.remove( "gallery-item-grid" );
            addPhotos( clip, {
              container: _galleryList,
              element: element,
              remove: true
            });
          }
        } else if ( typeof clip === "string" ) {
          // Load projects saved with just the url the old way.
          // Remove it too, so future saves don't come through here.
          delete clips[ key ];
          clip = formatSource( clip );
          // Fire an onSuccess so a new, updated clip is added to clipData.
          MediaUtils.getMetaData( clip, onSuccess );
        }
      }
    }

    _searchSelector.addEventListener( "change", function toggleItemType( e ) {
      var value = e.target.value,
          container;

      for ( var key in _itemContainers ) {
        if ( _itemContainers.hasOwnProperty( key ) ) {
          container = _itemContainers[ key ];

          if ( key === value ) {
            _currentSearch = key;
            container.style.display = "";
            _galleryHeader.innerHTML = _currentSearch + " " + _resultsText;
            pagination( container.dataset.page, container.dataset.total, pagingSearchCallback );
          } else {
            container.style.display = "none";
          }

          _this.scrollbar.update();
        }
      }
    }, false );

    _projectTab.addEventListener( "mouseup", function() {
      if ( !_projectTab.classList.contains( "butter-active" ) ) {
        _searchTab.classList.remove( "butter-active" );
        _projectTab.classList.add( "butter-active" );
        _galleryPanel.classList.remove( "search-items" );
        _rackspaceTab.classList.remove( "butter-active" );
        _addMediaPanel.classList.remove( "search-items" );

        _addBtn.innerHTML = _clipBtnText;
        _galleryHeader.innerHTML = _myMediaText;
        _sectionContainers.project.classList.remove( "butter-hidden" );
        _sectionContainers.search.classList.add( "butter-hidden" );
        _rackspaceContainer.classList.add( "butter-hidden" );
        _itemContainers.Rackspace.style.display = "none";
        _itemContainers[ _currentSearch ].style.display = "none";
        _itemContainers.project.style.display = "";

        // We don't page the gallery items that are tied down to a project.
        pagination( 1, 0, pagingSearchCallback );
        resetInput();
        _this.scrollbar.update();
      }
    });

    _searchTab.addEventListener( "mouseup", function() {
      if ( !_searchTab.classList.contains( "butter-active" ) ) {
        var container = _itemContainers[ _currentSearch ];

        _searchTab.classList.add( "butter-active" );
        _projectTab.classList.remove( "butter-active" );
        _rackspaceTab.classList.remove( "butter-active" );
        _galleryPanel.classList.add( "search-items" );
        _addMediaPanel.classList.add( "search-items" );

        _sectionContainers.project.classList.add( "butter-hidden" );
        _sectionContainers.search.classList.remove( "butter-hidden" );
        _rackspaceContainer.classList.add( "butter-hidden" );
        _itemContainers[ _currentSearch ].style.display = "";
        _itemContainers.Rackspace.style.display = "none";
        _itemContainers.project.style.display = "none";
        _addBtn.innerHTML = _searchBtnText;
        _galleryHeader.innerHTML = _currentSearch + " " + _resultsText;

        pagination( container.dataset.page, container.dataset.total, pagingSearchCallback );
        resetInput();
        _this.scrollbar.update();
      }
    }, false );

    _rackspaceTab.addEventListener( "mouseup", function() {
      if ( !_rackspaceTab.classList.contains( "butter-active" ) ) {
        var container = _itemContainers[ _currentSearch ];

        _rackspaceTab.classList.add( "butter-active" );
        _searchTab.classList.remove( "butter-active" );
        _projectTab.classList.remove( "butter-active" );
        _sectionContainers.project.classList.add( "butter-hidden" );
        _sectionContainers.search.classList.add( "butter-hidden" );
        _rackspaceContainer.classList.remove( "butter-hidden" );
        _itemContainers.project.style.display = "none";
        _itemContainers[ _currentSearch ].style.display = "none";
        _itemContainers.Rackspace.style.display = "";

        _galleryHeader.innerHTML = "Rackspace " + _resultsText;
        _this.scrollbar.update();
      }
    }, false );

    function buildClip( result, container ) {
      if ( !result.duration ) {
        MediaUtils.getMetaData( result.source, function( clip ) {
          clip.base = result.base;
          clip.path = result.path;
          // TODO: Determine issues with creating clips that include fallbacks that are given
          // clip.fallback = result.fallback;

          addMedia( clip, {
            container: container,
            callback: addMediaCallback
          }, function( msg ) {
            console.warn( "Failed to find matching video type: " + msg );
          });
        });
      } else {
        addMedia( result, {
          container: container,
          callback: addMediaCallback
        });
      }
    }

    function addClipElements( results ) {
      var result = results.shift();

      if ( !result ) {
        return;
      }

      // First is WEBM, second is MP4
      var sources = [
            {
              base: result.base,
              path: result.path
            },
            {
              base: result.base,
              path: result.path.replace( ".webm", ".mp4" )
            }
          ];

      if ( result.contentType.indexOf( "image" ) === -1 ) {
        XHR.post( "/api/rackspace/tempurl", { sources: sources }, function( data ) {
          if ( data.error ) {
            console.warn( data.error );
            return;
          }

          result.source = URI.makeUnique( data[ 0 ] ).toString();
          result.fallback = URI.makeUnique( data[ 1 ] ).toString();
          buildClip( result, _itemContainers.Rackspace );
          addClipElements( results );
        });
      } else {
        addPhotos( result, {
          container: container,
          callback: addPhotoCallback
        });
        addClipElements( results );
      }
    }

    function rackspaceSearchCallback( noPrefix ) {
      var container = _itemContainers.Rackspace,
          value = _rackspaceInput.value,
          page = 1,
          loadingLi = document.createElement( "li" );

      value = value ? value.trim() : "";
      value = noPrefix ? "" : value;
      _searchInput.value = value;

      // If using prefix search and no input given, bail early.
      if ( !noPrefix && !value ) {
        return;
      }

      container.innerHTML = "";
      loadingLi.innerHTML = "<span class=\"media-loading-spinner butter-spinner media-gallery-loading\" ></span>";
      container.appendChild( loadingLi );

      XHR.get( "/api/webmaker/search/Rackspace?q=placeholder&prefix=" + value + "&container=" + _rackspaceSelect.value, function( data ) {
        container.innerHTML = "";

        if ( data.status === "okay" ) {
          container.setAttribute( "data-total", data.total );

          if ( data.results && data.results.length ) {
            addClipElements( data.results );
          }

          _this.scrollbar.update();
        }
      });
    }

    // Retrieve list of rackspace containers
    XHR.get( "/api/webmaker/search/rackspace/containers", function( data ) {
      if ( data.containerNames ) {
        var option,
            ignoreBlur;

        for ( var i = 0; i < data.containerNames.length; i++ ) {
          option = document.createElement( "option" );

          option.value = data.containerNames[ i ];
          option.innerHTML = data.containerNames[ i ].charAt( 0 ).toUpperCase() + data.containerNames[ i ].slice( 1 );

          _rackspaceSelect.appendChild( option );
        }

        _rackspaceInput.addEventListener( "keydown", function( e ) {
          if ( e.keyCode === KeysUtils.ENTER ) {
            rackspaceSearchCallback();
          }
        }, false );

        _rackspaceButton.addEventListener( "click", function() {
          rackspaceSearchCallback();
        }, false );

        _rackspaceButtonNPrefix.addEventListener( "click", function() {
          rackspaceSearchCallback( true );
        }, false );
      }
    });

    setup();

    Editor.BaseEditor.extend( _this, butter, rootElement, {
      open: function() {},
      close: function() {}
    });

  }, true );
});