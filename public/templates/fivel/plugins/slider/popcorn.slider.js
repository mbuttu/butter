(function ( Popcorn ) {

  var _pluginRoot = "/plugins/icons/";

  /*
   * How to point to and use custom icons.
   *
   * The above URL, _pluginRoot, is an absolute path to where the directory
   * containing the icon files. By default, it's pointing to the icons shared with
   * the Popup plugin.
   *
   * Beyond the root being specified correctly, the only further action needed is properly
   * setting up the manifest for the icon option. There are two properties that need to be
   * setup properly for this to function. The "options" and "values" properties, both of which
   * are expected to be arrays of strings. For example, the following defaults for this plugin:

     options: [ "Error", "Audio", "Broken Heart", "Cone", "Earth",
                 "Eye", "Heart", "Info", "Man", "Money", "Music", "Net",
                 "Skull", "Star", "Thumbs Down", "Thumbs Up", "Time",
                 "Trophy", "Tv", "User", "Virus", "Women" ],
     values: [ "error.png", "audio.png", "brokenheart.png", "cone.png", "earth.png",
                 "eye.png", "heart.png", "info.png", "man.png", "money.png", "music.png", "net.png",
                 "skull.png", "star.png", "thumbsdown.png", "thumbsup.png", "time.png",
                 "trophy.png", "tv.png", "user.png", "virus.png", "women.png" ]

   * options: The human readable name that will appear in the select element to the user.
   * values: The corresponding value that will be returned to the plugin when that option
   *         is selected.
   *
   * Order is **VERY** important here. The order of what's put in the "values" array be in
   * the same order as the "options" array. Based on the above example, "error.png" is the file
   * for the "Error" icon. If Cone is selected, the plugins OptionsObject.icon === "cone.png".
   *
   * The only other important note is what is used for the "default" property. The value specified
   * here must match the string used in the "values" array. If we wanted the default to be the Music
   * icon then it would be "default": "music.png".
   *
   *
   * The above explanation will correspond the same for when adding in custom transitions/themes. Basically,
   * "select" elements in our manifest were designed in ways that allowed you to specify the actual value
   * of the <option> element to be different than it's innerHTML. This is useful in situations like our icons
   * or say something that's applying some sort of prefixed class. Looking at the transitions as an example:
   *
   * [ "popcorn-none", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down", "popcorn-slide-left", "popcorn-slide-right" ]
   *
   * If the text the user saw was "popcorn-fade" it wouldn't really hold any particular meaning to them. They may be able
   * to infer what is ment but it's best not to assume. By specifying that array as the "values" property and giving
   * a separate one for "options" we wind up getting HTML that looks like the following:
   *
   * <option value="popcorn-slide-right">Slide Right</option>
   *
   * And our code inside the plugins _setup can be:
   *
   * someVariable = "SOME OTHER STRING" + options.transition;
   */

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

  function newlineToBreak( string, elem ) {
    var splitNewlines = string.split( /\r?\n/gm );

    if ( splitNewlines.length > 1 ) {
      string = document.createTextNode( splitNewlines[ 0 ] );
      elem.appendChild( string );
      elem.appendChild( document.createElement( "br" ) );

      for ( var i = 1; i < splitNewlines.length; i++ ) {
        var breakElem,
            textNode = document.createTextNode( splitNewlines[ i ] );

        elem.appendChild( textNode );

        if ( splitNewlines[ i + 1 ] ) {
          breakElem = document.createElement( "br" );
          elem.appendChild( breakElem );
        }
      }
    } else {
      string = document.createTextNode( string );
      elem.appendChild( string );
    }
  }

  var descriptionHelper = (function parseFactory() {
    var descriptionRegex = /([\S\s]*)(\[[\S\s]+\]\(http[s]?:\/\/[\S]+\))([\S\s]*)/g;

    // Individual link regex
    var rawLinkRegex = /\[[\s\S]+\]\([\S]+ ?[\S]*\)/g,
        urlPhraseRegex = /^(\[)([ \S]+)(\])/,
        urlLinkRegex = /(\()([\S]+)(\))$/;

    // Containers for parsed data
    var markdownRemoved,
        finalCode;

    /**
     * parseText
     * --
     * Recursive function. Separates plaintext from
     * markdown-style link markup, then returns an
     * array containing both in the order they appeared
     * in the original string.
     * --
     * string : string to be parsed,
     * parsedText : array to attach results to (optional)
     */
    function parseText( string, parsedText ) {
      var matches;
      parsedText = parsedText || [];

      if ( !string ) {
        return null;
      }

      matches = descriptionRegex.exec( string );
      if ( matches ) {
        // Check if the first grouping needs more processing,
        // and if so, only keep the second (markup) and third (plaintext) groupings
        if ( matches[ 1 ].match( descriptionRegex ) ) {
          parsedText.unshift( matches[ 2 ], matches[ 3 ] );
        } else {
          parsedText.unshift( matches[ 1 ], matches[ 2 ], matches[ 3 ] );
        }

        return parseText( matches[ 1 ], parsedText );
      } else if ( !parsedText.length ) {
        // No links found
        parsedText.push( string );
      }

      return parsedText;
    }

    /**
     * parseLink
     * --
     * Returns an object with a phrase, and the link associated
     * with it.
     * --
     * rawLink : Markdown string to be parsed
     */
    function parseLink( rawLink ) {
      if ( rawLink && rawLink.length ) {
        rawLink = rawLink[ 0 ];
        return {
          phrase: rawLink.match( urlPhraseRegex )[ 2 ],
          url: rawLink.match( urlLinkRegex )[ 2 ]
        };
      }

      return null;
    }

    function parseDescription( rawText ) {
      var rawBits = parseText( rawText );

      // Reset containers
      markdownRemoved = "";
      finalCode = [];

      if ( rawBits && rawBits.length ) {
        var match,
            link;

        rawBits.forEach(function( rawBit ) {
          // Check if it's a link to be parsed
          match = rawBit.match( rawLinkRegex );
          link = parseLink( match );

          if ( link ) {
            finalCode.push( link );
            markdownRemoved += link.phrase;
          } else {
            // Wasn't a link? Must be plaintext
            finalCode.push( rawBit );
            markdownRemoved += rawBit;
          }
        });
      }

      return {
        finalCode: finalCode,
        markdownRemoved: markdownRemoved
      };
    }

    return {
      parseDescription: parseDescription,
      finalCode: function getFinalCode() {
        return finalCode;
      },
      markdownRemoved: function getMarkdownRemoved() {
        return markdownRemoved;
      }
    };
  })();

  Popcorn.plugin( "slider", {
    manifest: {
      about: {
        name: "Popcorn slider Plugin",
        version: "0.1",
        author: "@mjschranz, @sedge"
      },
      options: {
        start: {
          elem: "input",
          type: "text",
          label: "In",
          "units": "seconds"
        },
        end: {
          elem: "input",
          type: "text",
          label: "Out",
          "units": "seconds"
        },
        title: {
          elem: "input",
          type: "text",
          label: "Slider Title",
          "default": "Title here!",
          hidden: false
        },
        description: {
          elem: "textarea",
          type: "text",
          label: "Slider Description",
          "default": "Add links using the [markdown](http://goo.gl/wPqayl) link syntax.",
          instructions: "Add links using the [markdown](http://goo.gl/wPqayl) link syntax.",
          hidden: false
        },
        icon: {
          elem: "select",
          // Put the icon name in the options array
          options: [ "Error", "Audio", "Broken Heart", "Cone", "Earth",
                     "Eye", "Heart", "Info", "Man", "Money", "Music", "Net",
                     "Skull", "Star", "Thumbs Down", "Thumbs Up", "Time",
                     "Trophy", "Tv", "User", "Virus", "Women" ],
          // Put the icon filename in the values array
          values: [ "error.png", "audio.png", "brokenheart.png", "cone.png", "earth.png",
                     "eye.png", "heart.png", "info.png", "man.png", "money.png", "music.png", "net.png",
                     "skull.png", "star.png", "thumbsdown.png", "thumbsup.png", "time.png",
                     "trophy.png", "tv.png", "user.png", "virus.png", "women.png" ],
          label: "Slider Image",
          // Default must match the filename of the icon, not the generic name
          "default": "error.png",
          optional: true
        },
        left: {
          elem: "input",
          type: "number",
          label: "X Position",
          "units": "%",
          "default": 2
        },
        top: {
          elem: "input",
          type: "number",
          label: "Y Position",
          "units": "%",
          "default": 60
        },
        transition: {
          elem: "select",
          options: [ "None", "Fade", "Slide Up", "Slide Down", "Slide Left", "Slide Right" ],
          values: [ "popcorn-none", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down",
                    "popcorn-slide-left", "popcorn-slide-right" ],
          label: "Slider Transition",
          "default": "popcorn-slide-right"
        },
        theme: {
          elem: "select",
          // Put the names of your themes in the options property array.
          options: [ "Light", "Dark" ],
          // Put the actual CSS class you want to apply in the values array
          values: [ "popcorn-slider-light", "popcorn-slider-dark" ],
          label: "Slider Theme",
          // Default must match the CSS class for the theme, not the generic name
          "default": "popcorn-slider-light"
        },
        zindex: {
          hidden: true
        }
      }
    },

    _setup: function( options ) {
      // Expose parseDescription
      options.parseDescription = descriptionHelper.parseDescription;

      // Scaffolding vars
      var outerContainer = options._container = document.createElement( "div" ),
          textContainer = document.createElement( "div" ),
          imgContainer = document.createElement( "div" ),
          header = document.createElement( "h2" ),
          description = document.createElement( "p" ),
          img = document.createElement( "img" ),
          target = Popcorn.dom.find( options.target );

      // Pull parsed description from `descriptionHelper` object
      var finalCode = descriptionHelper.finalCode();

      var context = this;

      if ( !target ) {
        target = this.media.parentNode;
      }

      outerContainer.style.zIndex = +options.zindex;
      outerContainer.style.left = options.left + "%";
      outerContainer.style.top = options.top + "%";

      // Add base classes.
      options._target = target;
      outerContainer.id = Popcorn.guid( "slider" );
      outerContainer.classList.add( "slider-outer" );

      if ( options.transition ) {
        outerContainer.classList.add( options.transition );
      }

      outerContainer.classList.add( "off" );
      textContainer.classList.add( "slider-inner" );
      header.classList.add( "slider-header" );
      description.classList.add( "slider-description" );

      // Check that description has been parsed
      if ( !( finalCode && typeof( finalCode.push ) === "function" ) ) {
        descriptionHelper.parseDescription( options.description );
        finalCode = descriptionHelper.finalCode();
      }

      // Construct final version of description
      if ( finalCode && finalCode.length ) {
        finalCode.forEach(function( result ) {
          if ( typeof( result ) === "string" ) {
            newlineToBreak( result, description );
          } else {
            var link;

            link = document.createElement( "a" );
            link.target = "_blank";
            link.href = result.url;
            newlineToBreak( result.phrase, link );

            link.addEventListener( "click", function(){
              context.media.pause();
            }, false );

            description.appendChild( link );
          }
        });
      } else {
        description.innerHTML = "";
      }

      // Basic addition of text.
      newlineToBreak( options.title, header );
      textContainer.appendChild( header );
      textContainer.appendChild( description );
      imgContainer.appendChild( img );
      outerContainer.appendChild( imgContainer );
      outerContainer.appendChild( textContainer );
      target.appendChild( outerContainer );

      // Setup image
      imgContainer.classList.add( "slider-icon" );
      img.src = _pluginRoot + options.icon;

      options.toString = function() {
        // use the default option if it doesn't exist
        return options.title;
      };

      // Apply theme
      outerContainer.classList.add( options.theme );
    },

    start: function( event, options ) {
      if ( options._container ) {
        options._container.classList.remove( "off" );
      }
    },

    end: function( event, options ) {
      if ( options._container ) {
        options._container.classList.add( "off" );
      }
    },

    _teardown: function( options ) {
      if ( options._target ) {
        options._target.removeChild( options._container );
      }
    }
  });
}( window.Popcorn ));
