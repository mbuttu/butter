// PLUGIN: hotspot

(function ( Popcorn ) {

  // Polyfill for browsers that don't support addEventListener/removeEventListener.
  // see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.removeEventListener
  if (!Element.prototype.addEventListener) {
    var oListeners = {};
    function runListeners(oEvent) {
      if (!oEvent) { oEvent = window.event; }
      for (var iLstId = 0, iElId = 0, oEvtListeners = oListeners[oEvent.type]; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) {
          for (iLstId; iLstId < oEvtListeners.aEvts[iElId].length; iLstId++) { oEvtListeners.aEvts[iElId][iLstId].call(this, oEvent); }
          break;
        }
      }
    }
    Element.prototype.addEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
      if (oListeners.hasOwnProperty(sEventType)) {
        var oEvtListeners = oListeners[sEventType];
        for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
          if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
        }
        if (nElIdx === -1) {
          oEvtListeners.aEls.push(this);
          oEvtListeners.aEvts.push([fListener]);
          this["on" + sEventType] = runListeners;
        } else {
          var aElListeners = oEvtListeners.aEvts[nElIdx];
          if (this["on" + sEventType] !== runListeners) {
            aElListeners.splice(0);
            this["on" + sEventType] = runListeners;
          }
          for (var iLstId = 0; iLstId < aElListeners.length; iLstId++) {
            if (aElListeners[iLstId] === fListener) { return; }
          }     
          aElListeners.push(fListener);
        }
      } else {
        oListeners[sEventType] = { aEls: [this], aEvts: [ [fListener] ] };
        this["on" + sEventType] = runListeners;
      }
    };
    Element.prototype.removeEventListener = function (sEventType, fListener /*, useCapture (will be ignored!) */) {
      if (!oListeners.hasOwnProperty(sEventType)) { return; }
      var oEvtListeners = oListeners[sEventType];
      for (var nElIdx = -1, iElId = 0; iElId < oEvtListeners.aEls.length; iElId++) {
        if (oEvtListeners.aEls[iElId] === this) { nElIdx = iElId; break; }
      }
      if (nElIdx === -1) { return; }
      for (var iLstId = 0, aElListeners = oEvtListeners.aEvts[nElIdx]; iLstId < aElListeners.length; iLstId++) {
        if (aElListeners[iLstId] === fListener) { aElListeners.splice(iLstId, 1); }
      }
    };
  }

  // Polyfill for classList in browsers that don't support it.
  // see https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
  /*global self, document, DOMException */
  if (typeof document !== "undefined" && !("classList" in document.documentElement)) {
    (function (view) {

    "use strict";

    if (!('HTMLElement' in view) && !('Element' in view)) return;

    var
        classListProp = "classList"
      , protoProp = "prototype"
      , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
      , objCtr = Object
      , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
      }
      , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
            i = 0
          , len = this.length
        ;
        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }
        return -1;
      }
      // Vendors: please allow content code to instantiate DOMExceptions
      , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      }
      , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
          throw new DOMEx(
              "SYNTAX_ERR"
            , "An invalid or illegal string was specified"
          );
        }
        if (/\s/.test(token)) {
          throw new DOMEx(
              "INVALID_CHARACTER_ERR"
            , "String contains an invalid character"
          );
        }
        return arrIndexOf.call(classList, token);
      }
      , ClassList = function (elem) {
        var
            trimmedClasses = strTrim.call(elem.className)
          , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
          , i = 0
          , len = classes.length
        ;
        for (; i < len; i++) {
          this.push(classes[i]);
        }
        this._updateClassName = function () {
          elem.className = this.toString();
        };
      }
      , classListProto = ClassList[protoProp] = []
      , classListGetter = function () {
        return new ClassList(this);
      }
    ;
    // Most DOMException implementations don't allow calling DOMException's toString()
    // on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp];
    classListProto.item = function (i) {
      return this[i] || null;
    };
    classListProto.contains = function (token) {
      token += "";
      return checkTokenAndGetIndex(this, token) !== -1;
    };
    classListProto.add = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.remove = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        var index = checkTokenAndGetIndex(this, token);
        if (index !== -1) {
          this.splice(index, 1);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.toggle = function (token, forse) {
      token += "";

      var
          result = this.contains(token)
        , method = result ?
          forse !== true && "remove"
        :
          forse !== false && "add"
      ;

      if (method) {
        this[method](token);
      }

      return !result;
    };
    classListProto.toString = function () {
      return this.join(" ");
    };

    if (objCtr.defineProperty) {
      var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
      };
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
          classListPropDesc.enumerable = false;
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
      }
    } else if (objCtr[protoProp].__defineGetter__) {
      elemCtrProto.__defineGetter__(classListProp, classListGetter);
    }

    }(self));
  }

  // Older version if IE don't support Event.target for access to the DOM Element
  function getTarget( oEvent ) {
    var target = oEvent.target ? oEvent.target : oEvent.srcElement;

    return target;
  }

  var DEFAULT_WIDTH = 10,
      DEFAULT_HEIGHT = 10;

  Popcorn.plugin( "hotspot", {

    manifest: {
      about: {
        name: "Popcorn hotspot Plugin",
        version: "0.1",
        author: "@mjschranz"
      },
      options: {
        frames: {
          hidden: true,
          "default": ""
        },
        start: {
          elem: "input",
          type: "text",
          label: "In",
          group: "advanced",
          "units": "seconds"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          group: "advanced",
          "units": "seconds"
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {
      var TRANSPARENT_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

      var target = Popcorn.dom.find( options.target ),
          container = options._container = document.createElement( "div" ),
          self = this,
          IE = document.getElementsByTagName( "html" )[ 0 ].classList.contains( "ie8" ) !== -1;

      if ( !target ) {
        target = this.media.parentNode;
      }

      function calcDefaultPosition( hotspot ) {
        var top = Math.random() * 100,
            left = Math.random() * 100;

        if ( top + DEFAULT_HEIGHT > 100 ) {
          top = 100 - DEFAULT_HEIGHT;
        }

        if ( left + DEFAULT_WIDTH > 100 ) {
          left = 100 - DEFAULT_WIDTH;
        }

        hotspot.top = top;
        hotspot.left = left;
        hotspot.width = DEFAULT_WIDTH;
        hotspot.height = DEFAULT_HEIGHT;
      }

      function setupErrorFrame( errorFrame ) {
        errorFrame.classList.add( "error-frame" );
        errorFrame.innerHTML = "Incorrect area clicked! Please click on the frame to return.";

        errorFrame.addEventListener( "click", function( e ) {
          var previousFrame = options._activeFrame;
          getTarget( e ).classList.add( "hidden" );

          // In editor edgecase where this may not be true. Assign some sort of default.
          if ( !previousFrame ) {
            previousFrame = options.frames[ 0 ];
          }

          document.querySelector( "[data-frame-container-id='" + previousFrame.id + "']" ).classList.remove( "hidden" );
          // Notify editor to return to previous frame.
          self.emit( "error-frame-return", { activeFrame: previousFrame } );
        }, false );
      }

      options._target = target;
      container.classList.add( "popcorn-hotspot-wrapper" );
      options._container.style.display = "none";
      container.style.zIndex = +options.zindex;
      target.appendChild( container );

      var frame,
          hotspot;

      for ( var i = 0; i < options.frames.length; i++ ) {
        var frameContainer = document.createElement( "div" );

        frame = options.frames[ i ];

        frameContainer.setAttribute( "data-frame-container-id", frame.id );
        frameContainer.classList.add( "popcorn-frame-container" );
        frameContainer.classList.add( "hidden" );
        container.appendChild( frameContainer );

        if ( frame.image ) {
          // Internet Explorer is the BEST YO
          if ( IE ) {
            var img = document.createElement( "img" ),
                transparentImgOne = document.createElement( "img" ),
                transparentImgTwo = document.createElement( "img" ),
                maxHeight = self.media.height,
                maxWidth = self.media.width,
                ratio,
                width,
                height;

            img.src = frame.image;

            width = img.width;
            height = img.height;

            // Check if the current width is larger than the max
            if ( width > maxWidth ) {
              ratio = maxWidth / width;
              img.style.width = maxWidth + "px";
              img.style.height = ( height * ratio ) + "px";
              height = height * ratio;
              width = width * ratio;
            }

            // Check if current height is larger than max
            if ( height > maxHeight ) {
                ratio = maxHeight / height;
                img.style.height = maxHeight + "px";
                img.style.width = ( width * ratio ) + "px";
                width = width * ratio;
                height = height * ratio;
            }

            img.style.left = ( ( maxWidth - width ) / 2 ) + "px";

            // Now we need to add two transparent images to the left and right of
            // the actual image used for the plugin.
            transparentImgOne.src = TRANSPARENT_IMG;
            transparentImgOne.style.width = ( width / 2 ) + "px";
            transparentImgOne.style.left = "0px";
            transparentImgTwo.src = TRANSPARENT_IMG;
            transparentImgTwo.style.width = ( width / 2 ) + "px";
            transparentImgTwo.style.right = "0px";

            frameContainer.appendChild( transparentImgOne );
            frameContainer.appendChild( img );
            frameContainer.appendChild( transparentImgTwo );
          } else {
            frameContainer.style.backgroundImage = "url( \"" + frame.image + "\" )";
          }
        } else if ( IE ) {
          var img = document.createElement( "img" );

          img.src = TRANSPARENT_IMG;
          img.style.width = "100%";
          img.style.height = "100%";
          frameContainer.appendChild( img );
        }

        if ( frame.id === "error" ) {
          setupErrorFrame( frameContainer );
        } else {
          frameContainer.addEventListener( "click", function( e ) {console.log("d")
            var errorFrame = document.querySelector( "[data-frame-container-id='error']" ),
                elem = getTarget( e ),
                activeId = elem.getAttribute( "data-frame-container-id" );

            // Our IMG element winds up getting hit potentially
            if ( IE && elem.nodeName === "IMG" ) {
              activeId = elem.parentNode.getAttribute( "data-frame-container-id" );
            }

            // Most likely a click container was selected
            if ( !activeId ) {
              return;
            }

            if ( errorFrame ) {
              options._activeFrameId = activeId;
              for ( var i = 0; i < options.frames.length; i++ ) {
                if ( options.frames[ i ].id === activeId ) {
                  options._activeFrame = options.frames[ i ];
                  document.querySelector( "[data-frame-container-id='" + options._activeFrame.id + "']" ).classList.add( "hidden" );
                  errorFrame.classList.remove( "hidden" );
                }
              }
            }
          }, false );

          for ( var k = 0; k < frame.hotspots.length; k++ ) {
            var hotspotContainer = document.createElement( "div" ),
                clickContainer = document.createElement( "div" );

            hotspot = frame.hotspots[ k ];
            hotspotContainer.classList.add( "hotspot-container" );

            if ( !hotspot.left || !hotspot.top || !hotspot.height || !hotspot.width ) {
              calcDefaultPosition( hotspot );
            }

            hotspotContainer.style.left = hotspot.left + "%";
            hotspotContainer.style.top = hotspot.top + "%";
            hotspotContainer.style.height = hotspot.height + "%";
            hotspotContainer.style.width = hotspot.width + "%";
            clickContainer.classList.add( "click-container" );
            clickContainer.setAttribute( "data-hotspot-click-container-id", hotspot.id );
            clickContainer.setAttribute( "data-current-frame", frame.id );

            // Yay IE8!
            if ( IE ) {
              var img = document.createElement( "img" );

              img.src = TRANSPARENT_IMG;
              img.style.width = "100%";
              img.style.height = "100%";
              clickContainer.appendChild( img );
            }

            // If there is another frame and it isn't our last frame in the array,
            // which is reservered for the error frame.
            if ( options.frames[ i + 1 ] && options.frames[ i + 1 ].id !== "error" ) {
              clickContainer.setAttribute( "data-next-frame", options.frames[ i + 1 ].id );
            }

            hotspotContainer.appendChild( clickContainer );
            hotspotContainer.setAttribute( "data-hotspot-container-id", hotspot.id );

            clickContainer.addEventListener( "mousedown", function( e ) {
              var elem = getTarget( e ),
                  nextFrameId = elem.getAttribute( "data-next-frame" ),
                  currentFrame = elem.parentNode.parentNode;

              // IE click events will originate from our transparent IMG. Must grab from the parent DIV
              if ( IE ) {
                nextFrameId = elem.parentNode.getAttribute( "data-next-frame" );
                currentFrame = elem.parentNode.parentNode.parentNode;
              }

              currentFrame.classList.add( "hidden" );

              if ( nextFrameId ) {
                document.querySelector( "[data-frame-container-id='" + nextFrameId + "']" ).classList.remove( "hidden" );
              } else {
                self.play();
              }
            }, false );

            frameContainer.appendChild( hotspotContainer );
          }
        }
      }

      options.toString = function() {
        return "Hotspot";
      };
    },

    start: function( event, options ) {
      options._container.style.display = "";

      if ( !this.paused() ) {
        options.wasPaused = true;
        // Pause main timeline until all clickable areas are hit
        this.pause();
      }

      // Our editor handles all of the basic toggling of what the active frame is for editing,
      // but we need to still activate the first frame outside of Popcorn Maker.
      if ( !options.inEditor && options.frames[ 0 ] ) {
        options._container.querySelector( "[data-frame-container-id='" + options.frames[ 0 ].id + "']" )
          .classList.remove( "hidden" );
      }

    },

    end: function( event, options ) {
      var frameContainer;

      options._container.style.display = "none";

      // "Turn off" all frames so we start at the first again
      for ( var i = 0; i < options.frames.length; i++ ) {
        frameContainer = document.querySelector( "[data-frame-container-id='" + options.frames[ i ].id + "']" );
        
        if ( frameContainer ) {
          frameContainer.classList.add( "hidden" );
        }
      }

      if ( options.wasPaused ) {
        options.wasPaused = false;
        // Possible for end to be hit after the main timeline has finished
        // Playing without checking will cause looping.
        if ( !this.ended() ) {
          // Resume timeline if user navigates out of the video
          this.play();
        }
      }

    },

    _teardown: function( options ) {
      if ( options._target ) {
        options._target.removeChild( options._container );
      }
    }
  });
}( window.Popcorn ));