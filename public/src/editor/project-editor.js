/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/project-editor.html",
          "util/social-media", "ui/widget/textbox",
          "ui/widget/tooltip", "util/xhr" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, TextboxWrapper, ToolTip, XHR ) {

  Editor.register( "project-editor", LAYOUT_SRC, function( rootElement, butter ) {
    var _rootElement = rootElement,
        _socialMedia = new SocialMedia(),
        _projectURL = _rootElement.querySelector( ".butter-project-url" ),
        _authorInput = _rootElement.querySelector( ".butter-project-author" ),
        _descriptionInput = _rootElement.querySelector( ".butter-project-description" ),
        _dropArea = _rootElement.querySelector( ".image-droparea" ),
        _thumbnailInput = _rootElement.querySelector( ".butter-project-thumbnail" ),
        _projectEmbedURL = _rootElement.querySelector( ".butter-project-embed-url" ),
        _embedSize = _rootElement.querySelector( ".butter-embed-size" ),
        _previewBtn = _rootElement.querySelector( ".butter-preview-link" ),
        _viewSourceBtn = _rootElement.querySelector( ".butter-view-source-btn" ),
        _shareTwitter = _rootElement.querySelector( ".butter-share-twitter" ),
        _shareGoogle = _rootElement.querySelector( ".butter-share-google" ),
        _embedDimensions = _embedSize.value.split( "x" ),
        _embedWidth = _embedDimensions[ 0 ],
        _embedHeight = _embedDimensions[ 1 ],
        _projectTabs = _rootElement.querySelectorAll( ".project-tab" ),
        _this = this,
        _numProjectTabs = _projectTabs.length,
        _descriptionToolTip,
        _descriptionTimeout,
        _project,
        _projectTab,
        _idx;

    _authorInput.value = butter.project.author ? butter.project.author : "";
    _descriptionInput.value = butter.project.description ? butter.project.description : "";

    ToolTip.create({
      name: "description-tooltip",
      element: _descriptionInput.parentNode,
      message: "Your description will show up when shared on social media!",
      top: "100%",
      left: "50%",
      error: true,
      hidden: true,
      hover: false
    });

    _descriptionToolTip = ToolTip.get( "description-tooltip" );

    function checkDescription() {
      if ( _descriptionInput.value ) {
        if ( _descriptionTimeout ) {
          clearTimeout( _descriptionTimeout );
          _descriptionToolTip.hidden = true;
        }
        return;
      }
      _descriptionToolTip.hidden = false;

      _descriptionTimeout = setTimeout(function() {
        _descriptionToolTip.hidden = true;
      }, 5000 );
    }

    function onProjectTabClick( e ) {
      var target = e.target,
          currentDataName = target.getAttribute( "data-tab-name" ),
          dataName;

      for ( var i = 0; i < _numProjectTabs; i++ ) {
        dataName = _projectTabs[ i ].getAttribute( "data-tab-name" );

        if ( dataName === currentDataName ) {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.remove( "display-off" );
          target.classList.add( "butter-active" );
        } else {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.add( "display-off" );
          _projectTabs[ i ].classList.remove( "butter-active" );
        }

      }

      _this.scrollbar.update();
    }

    for ( _idx = 0; _idx < _numProjectTabs; _idx++ ) {
      _projectTab = _projectTabs[ _idx ];
      _projectTab.addEventListener( "click", onProjectTabClick, false );
    }

    function updateEmbed( url ) {
      _projectEmbedURL.value = "<iframe src='" + url + "' width='" + _embedWidth + "' height='" + _embedHeight + "'" +
      " frameborder='0' mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>";
    }

    _embedSize.addEventListener( "change", function() {
      _embedDimensions = _embedSize.value.split( "x" );
      _embedWidth = _embedDimensions[ 0 ];
      _embedHeight = _embedDimensions[ 1 ];
      updateEmbed( butter.project.iframeUrl );
    }, false );

    function applyInputListeners( element, key ) {
      var ignoreBlur = false,
          target;

      function checkValue( e ) {
        target = e.target;
        if ( target.value !== _project[ key ] ) {
          _project[ key ] = target.value;
          if ( butter.cornfield.authenticated() ) {
            _project.save(function() {
              butter.editor.openEditor( "project-editor" );
              checkDescription();
            });
          }
        }
      }

      element.addEventListener( "blur", function( e ) {
        if ( !ignoreBlur ) {
          checkValue( e );
        } else {
          ignoreBlur = false;
        }
      }, false );
    }

    applyInputListeners( _authorInput, "author" );
    applyInputListeners( _thumbnailInput, "thumbnail" );

    applyInputListeners( _descriptionInput, "description" );
    _descriptionInput.addEventListener( "keyup", checkDescription, false );

    TextboxWrapper.applyTo( _projectURL, { readOnly: true } );
    TextboxWrapper.applyTo( _projectEmbedURL, { readOnly: true } );
    TextboxWrapper.applyTo( _authorInput );
    TextboxWrapper.applyTo( _descriptionInput );
    TextboxWrapper.applyTo( _thumbnailInput );

    window.EditorHelper.droppable( null, _dropArea, function onDrop( uri ) {
      _project.thumbnail = uri;
      _project.save(function() {
        butter.editor.openEditor( "project-editor" );
        checkDescription();
        _thumbnailInput.value = _project.thumbnail;
      });
    });

    butter.listen( "droppable-unsupported", function unSupported() {
      _this.setErrorState( "Sorry, but your browser doesn't support this feature." );
    });

    butter.listen( "droppable-upload-failed", function failedUpload( e ) {
      _this.setErrorState( e.data );
    });

    butter.listen( "projectsaved", function onProjectSaved() {
      _projectURL.value = _project.publishUrl;
      _previewBtn.href = _project.previewUrl;
      _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
      updateEmbed( _project.iframeUrl );
    });

    function setupLearningMoment() {
      var lmName = document.querySelector( ".learning-moment-name" ),
          lmFriendlyName = document.querySelector( ".learning-moment-friendlyName" ),
          lmDesc = document.querySelector( ".learning-moment-description" ),
          lmPublishDate = document.querySelector( ".learning-moment-publish" ),
          lmExpiryDate = document.querySelector( ".learning-moment-expiry" ),
          lmDocket = document.querySelector( ".learning-moment-docket" ),
          lmCost = document.querySelector( ".learning-moment-cost" ),
          lmTags = document.querySelector( ".learning-moment-tags" ),
          lmFile = document.querySelector( ".learning-moment-image" ),
          lmSupplier = document.querySelector( ".learning-moment-suppliers" ),
          lmButton = document.querySelector( ".learning-moment-submit" ),
          lmInternalNotes = document.querySelector( ".learning-moment-internal-notes" ),
          lmOptions = {},
          fd;

      function addListener( element, key ) {
        element.addEventListener( "blur", function( e ) {
          lmOptions[ key ] = e.target.value;
        }, false );
      }

      addListener( lmName, "courseName" );
      addListener( lmFriendlyName, "friendlyName" );
      addListener( lmDesc, "description" );
      addListener( lmDocket, "docketNumber" );
      addListener( lmCost, "creditCost" );
      addListener( lmInternalNotes, "internalNotes" );

      XHR.get( "/api/fivel/courseinfo/" + _project.courseId, function( data ) {
        if ( data.error ) {
          return _this.setErrorState( data.error );
        }

        var tags = data.tags;

        if ( !lmSupplier.children.length ) {
          for ( var i = 0; i < data.suppliers.length; i++ ) {
            var option = document.createElement( "option" ),
                supplier = data.suppliers[ i ];

            option.value = supplier.id;
            option.innerHTML = supplier.supplierName;

            lmSupplier.appendChild( option );
          }
        }

        lmSupplier.addEventListener( "change", function( e ) {
          lmOptions[ "suppliedBy" ] = e.target.value;
        }, false );

        // Basically means we have an existing LM
        // TODO: Come up with some potential solution to show the LM image and quiz.
        if ( data.course.id ) {
          var publishDate = new Date( data.course.publishDate ),
              expiryDate;

          Popcorn.extend(lmOptions, data.course);

          lmOptions.tags = lmOptions.tags.map(function(tag) {
            return tag.id;
          }).join(",");

          data.course.publishDate = ( publishDate.getMonth() + 1 ) + "/" + publishDate.getDate() + "/" + publishDate.getFullYear();

          if ( data.course.expiryDate ) {
            expiryDate = new Date( data.course.expiryDate );
            data.course.expiryDate = ( expiryDate.getMonth() + 1 ) + "/" + expiryDate.getDate() + "/" + expiryDate.getFullYear();
          }

          lmName.value = data.course.courseName;
          lmFriendlyName.value = data.course.friendlyName;
          lmDesc.value = data.course.description;
          lmDocket.value = data.course.docketNumber || "";
          lmCost.value = data.course.creditCost;
          lmTags.value = data.course.tagNames.join( "," );
          lmPublishDate.value = data.course.publishDate;
          lmExpiryDate.value = data.course.expiryDate || "";
          lmInternalNotes.value = data.course.internalNotes || "";
          lmSupplier.value = data.course.suppliedBy || lmSupplier.children[ 0 ].value;
        }

        window.jQuery( lmPublishDate ).datepicker({
          onClose: function( val ) {
            lmOptions[ "publishDate" ] = val;
          }
        });

        window.jQuery( lmExpiryDate ).datepicker({
          onClose: function( val ) {
            lmOptions[ "expiryDate" ] = val;
          }
        });

        window.jQuery( lmTags ).tagit({
          availableTags: tags,
          caseSensitive: false,
          beforeTagAdded: function( event, ui ) {
            var found = false;

            tags.forEach( function( tag ) {
              if ( tag.toLowerCase() === ui.tagLabel.toLowerCase() ) {
                found = true;
                $( ui.tag ).find( ".tagit-label" ).html( tag );
                return;
              }
            });

            return found;
          },
          afterTagAdded: function() {
            lmOptions[ "tagNames" ] = lmTags.value;
          }
        });
      });

      lmFile.addEventListener( "change", function() {
        var imageFd = new FormData(),
            imagePreview = _rootElement.querySelector( ".learning-moment-image-preview" );

        imagePreview.src = "";
        imagePreview.classList.add( "butter-hidden" );
        lmOptions[ "courseImage" ] = lmFile.files[ 0 ];
        imageFd.append( "image", lmFile.files[ 0 ] );
        _this.scrollbar.update();

        XHR.put( "/api/image", imageFd, function( data ) {
          if ( !data.error ) {
            imagePreview.addEventListener( "load", function onImageLoad() {
              imagePreview.removeEventListener( "load", onImageLoad );
              imagePreview.classList.remove( "butter-hidden" );
              _this.scrollbar.update();
            });
            imagePreview.src = data.url;
          }
        });
      }, false );

      function lmSubmit() {
        lmButton.removeEventListener( "click", lmSubmit );

        if ( !Object.keys( lmOptions ).length ) {
          return _this.setErrorState( "Must enter learning moment data before submitting." );
        }

        // Clear error message
        _this.setErrorState();

        fd = new FormData();
        for ( var key in lmOptions ) {
          fd.append( key, lmOptions[ key ] );
        }

        XHR.put( "/api/fivel/course/?id=" + _project.id + "&courseId=" + _project.courseId, fd, function( data ) {
          if ( data.error === "okay" ) {
            var lmAction = _project.courseId ? "updated." : "created.";

            _project.courseId = data.project.courseId;
            _this.setErrorState( "Learning Moment was successfully " + lmAction, "success" );
          } else {
            _this.setErrorState( data.message || data.data || data.error, "error" );
          }

          lmButton.addEventListener( "click", lmSubmit );
        });
      }

      lmButton.addEventListener( "click", lmSubmit );
    }

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        _project = butter.project;

        _projectURL.value = _project.publishUrl;
        _previewBtn.href = _project.previewUrl;
        _viewSourceBtn.href = "view-source:" + _project.iframeUrl;
        _thumbnailInput.value = _project.thumbnail;
        updateEmbed( _project.iframeUrl );

        _previewBtn.onclick = function() {
          return true;
        };
        _viewSourceBtn.onclick = function() {
          return true;
        };

        // Ensure Share buttons have loaded
        if ( !_shareTwitter.childNodes.length ) {
          _socialMedia.hotLoad( _shareTwitter, _socialMedia.twitter, _project.publishUrl );
        }
        if ( !_shareGoogle.childNodes.length ) {
          _socialMedia.hotLoad( _shareGoogle, _socialMedia.google, _project.publishUrl );
        }

        _this.scrollbar.update();

        setupLearningMoment();
      },
      close: function() {
      }
    });
  }, true );
});
