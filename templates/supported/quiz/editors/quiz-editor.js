(function( Butter ){

  Butter.Editor.register( "quiz", "load!{{baseDir}}/templates/supported/quiz/editors/quiz-editor.html", function( rootElement, butter ) {

  var _this = this,
      _rootElement = rootElement,
      _fields = [ "target", "paginate", "results", "questions", "start", "end" ],
      _messageContainer = _rootElement.querySelector( "div.error-message" ),
      _targets,
      _trackEvent,
      _elements = {},
      _popcornOptions = {};

  function setErrorState( message ){
    if ( message ){
      _messageContainer.innerHTML = message;
      _messageContainer.parentNode.style.visibility = "visible";
      _messageContainer.parentNode.classList.add( "open" );
    }
    else{
      _messageContainer.innerHTML = "";
      _messageContainer.parentNode.style.visibility = "";
      _messageContainer.parentNode.classList.remove( "open" );
    }
  }

  function updateTrackEvent(){
    var questions = _rootElement.querySelector( "#questions" ).children,
        idx;

    setErrorState( false );

    for ( idx = 0; idx < _fields.length; idx ++ ){
      var field = _fields[ idx ],
          element = _elements[ field ];
      if ( field !== "questions" ){
        _popcornOptions[ field ] = element.type === "checkbox" ? element.checked : element.value;
      }
    }

    _popcornOptions.questions = [];

    for ( idx = 0; idx < questions.length; idx++ ){
      if ( !_popcornOptions.questions[ idx ] ){
        _popcornOptions.questions[ idx ] = {};
      }
      _popcornOptions.questions[ idx ].question = questions[ idx ].querySelector( "textarea" ).value;
      possibleAnswers = questions[ idx ].querySelector( "select" );
      _popcornOptions.questions[ idx ].correctAnswer = possibleAnswers.selectedIndex;
      var answersList = questions[ idx ].querySelectorAll( "ul li > input ");
      for ( var answersIdx = 0; answersIdx < answersList.length; answersIdx++ ){
        if ( !_popcornOptions.questions[ idx ].answers ){
          _popcornOptions.questions[ idx ].answers = [];
        }
        _popcornOptions.questions[ idx ].answers[ answersIdx ] = answersList[ answersIdx ].value;
      }
    }

    if ( _elements.results.checked ){
      _popcornOptions.decorators = [{
        "when": "end",
        "what": "results"
      }];
    }
    else{
      _popcornOptions.decorators = [];
    }
    _popcornOptions.paginate = _elements.paginate.checked;

    try{
      _trackEvent.update( _popcornOptions );
    }
    catch( e ){
      setErrorState( e.toString() );
    }
  }

  function addQuestion( e ){
    var questionDiv = document.createElement( "div" ),
        textarea = document.createElement( "textarea" ),
        ul = document.createElement( "ul" ),
        li = document.createElement( "li" ),
        input = document.createElement( "input" ),
        select = document.createElement( "select" ),
        addButton = document.createElement( "button" ),
        labelDiv = document.createElement( "div" ),
        removeQuestionButton = document.createElement( "button" ),
        removeAnswerButton = document.createElement( "button" );

    ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
    textarea.setAttribute( "style", "width: 130px" );
    questionDiv.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );
    input.setAttribute( "style", "float: none; width: 100px" );

    addButton.innerHTML = "+";
    removeQuestionButton.innerHTML = "-";
    removeAnswerButton.innerHTML = "-";
    addButton.addEventListener( "click", addAnswer( addButton, ul, li, _popcornOptions.questions.length, 0 ) );
    removeAnswerButton.addEventListener( "click", removeAnswer( removeAnswerButton, ul, li, _popcornOptions.questions.length + 1, 0 ) );
    removeQuestionButton.addEventListener( "click", removeQuestion( removeQuestionButton, _elements.questions, questionDiv ), false );

    textarea.innerHTML = "Question";
    input.value = "Answer";
    li.appendChild( input );
    li.appendChild( removeAnswerButton );
    li.appendChild( addButton );

    labelDiv.setAttribute( "class", "trackevent-property default input" );
    labelDiv.innerHTML = "Correct Answer";

    ul.appendChild( li );

    questionDiv.appendChild( textarea );
    questionDiv.appendChild( removeQuestionButton );

    questionDiv.appendChild( ul );
    questionDiv.appendChild( labelDiv );
    questionDiv.appendChild( select );

    _rootElement.querySelector( "#questions" ).appendChild( questionDiv );
    updateTrackEvent();
  }

  function addAnswer( aAddButton, aUl, aLi, aIdx, answersIdx ){
    return function( e ){
      var removeButton = document.createElement( "button" ),
          len = aUl.children.length;

      removeButton.innerHTML = "-";
      aLi.removeChild( aLi.lastChild );

      aLi = document.createElement( "li" );
      input = document.createElement( "input" );
      input.setAttribute( "type", "text" );
      input.setAttribute( "style", "float: none; width: 100px" );

      removeButton.addEventListener( "click", removeAnswer( removeButton, aUl, aLi, aIdx, answersIdx + 1 ), false );

      aLi.appendChild( input );
      aUl.appendChild( aLi );
      aLi.appendChild( removeButton );
      aLi.appendChild( aAddButton );

      updateTrackEvent();
    };
  }

  function removeAnswer( aAddButton, aUl, aLi, aIdx, aAnswersIdx ){
    return function( e ){
      var addButton, previousInput, previousLabel, previousLi, currentLi, currentLabel, currentInput, count;

      if ( aUl.lastChild !== aUl.firstChild ){
        if ( aUl.lastChild === aLi ){
          aUl.removeChild( aLi );
          addButton = document.createElement( "button" );
          addButton.innerHTML = "+";
          addButton.addEventListener( "click", addAnswer( addButton, aUl, aUl.lastChild, aIdx, aAnswersIdx ), false );
          previousInput = aUl.lastChild.querySelector( "input" );
          aUl.lastChild.appendChild( addButton );
        }
        else{
          currentLi = aLi;
          count = aAnswersIdx;
          while ( ( currentLi = currentLi.nextSibling ) ){
            count += 1;
            currentInput = currentLi.querySelector( "input" );
          }
          aUl.removeChild( aLi );
        }
        updateTrackEvent();
      }
    };
  }

  function removeQuestion( aAddButton, container, div ){
    return function( e ){
      if ( container.firstChild !== container.lastChild ){
        container.removeChild( div );
        updateTrackEvent();
      }
    };
  }

  function onEditorOpen( e ){
    function createQuestionsRow(){
      var question, answersDiv, questionContainer, theQuestion, input, ul, li, addButton, removeButton, idx, answersIdx, removeQuestionButton;

      // questions.setAttribute( "class", "question-container" );

      for ( idx = 0; idx < _popcornOptions.questions.length; idx++){
        questionContainer = document.createElement( "div" );
        questionContainer.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );
        answersDiv = document.createElement( "div" );
        theQuestion = _popcornOptions.questions[ idx ];
        question = document.createElement( "textarea" );
        question.innerHTML = theQuestion.question;
        ul = document.createElement( "ul" );
        ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
        question.setAttribute( "style", "width: 130px" );
        for ( answersIdx = 0; answersIdx < theQuestion.answers.length; answersIdx++ ){
          li = document.createElement( "li" );
          input = document.createElement( "input" );
          input.setAttribute( "type", "text" );
          input.setAttribute( "style", "float: none; width: 100px" );
          input.value = theQuestion.answers[ answersIdx ];
          li.appendChild( input );
          removeButton = document.createElement( "button" );
          removeButton.innerHTML = "-";
          removeButton.addEventListener( "click", removeAnswer( removeButton, ul, li, idx, answersIdx + 1 ), false );
          li.appendChild( removeButton );
          if ( answersIdx === theQuestion.answers.length - 1 ){
            addButton = document.createElement( "button" );
            addButton.innerHTML = "+";
            addButton.addEventListener( "click", addAnswer( addButton, ul, li, idx, answersIdx ), false );
            li.appendChild( addButton );
          }
          ul.appendChild( li );
        }

        removeQuestionButton = document.createElement( "button" );
        removeQuestionButton.innerHTML = "-";
        removeQuestionButton.addEventListener( "click", removeQuestion( removeButton, _elements.questions, questionContainer ), false );

        questionContainer.appendChild( question );
        questionContainer.appendChild( removeQuestionButton );
        questionContainer.appendChild( ul );

        var correct = document.createElement( "select" ),
            labelDiv = document.createElement( "div" );

        labelDiv.setAttribute( "class", "trackevent-property default input" );
        labelDiv.innerHTML = "Correct Answer";

        questionContainer.appendChild( labelDiv );
        questionContainer.appendChild( correct );

        _elements.questions.appendChild( questionContainer );
      }
      idx = idx - 1;
      answersIdx = answersIdx - 1;
    }

    createQuestionsRow();

    var select = _targets.querySelector( "select" ),
        targets;
    select.removeChild( select.querySelector( ".default-target-option" ) );
    targets = _targets.querySelector( "select" ).children;

    while ( targets[ 0 ] ){
      _elements.target.appendChild( targets[ 0 ] );
    }

    _elements.target.value = _trackEvent.popcornOptions.target;

    refreshUI();
  }

  function populateDropdowns() {
    var questions = _rootElement.querySelector( "#questions" ).children,
        idx, answersDropdown, answers;

    for ( var questionsIdx = 0; questionsIdx < _popcornOptions.questions.length; questionsIdx++ ){
      answers = _popcornOptions.questions[ questionsIdx ] && _popcornOptions.questions[ questionsIdx ].answers || [];
      answersDropdown = questions[ questionsIdx ].querySelector( "select" );

      while ( answersDropdown.hasChildNodes() ){
        answersDropdown.removeChild( answersDropdown.lastChild );
      }

      for ( idx = 0; idx < answers.length; idx++ ){
        input = document.createElement( "option" );
        input.appendChild( document.createTextNode( answers[ idx ] ) );
        input.value = answers[ idx ];
        answersDropdown.appendChild( input );
        answersDropdown.addEventListener( "change", function( e ){
          updateTrackEvent();
        }, false);
        if ( _popcornOptions.questions[ questionsIdx ].correctAnswer === idx ){
          answersDropdown.selectedIndex = idx;
        }
      }
    }
  }

  function refreshUI() {
    populateDropdowns();
    _elements.start.value = _popcornOptions.start;
    _elements.end.value = _popcornOptions.end;
    _elements.paginate.checked = !!_popcornOptions.paginate;
    _elements.results.checked = _popcornOptions.decorators && _popcornOptions.decorators.length > 0 || false;
  }

  function onTrackEventUpdated( e ){
    refreshUI();
  }

  Butter.Editor.TrackEventEditor( _this, butter, rootElement,{
    open: function( parentElement, trackEvent ){

      _rootElement.querySelector( "#addQuestion" ).addEventListener( "click", addQuestion, false );

      for ( var idx = 0; idx < _fields.length; idx++ ){
        var name = _fields[ idx ];
        _elements[ name ] = _rootElement.querySelector( "#" + name );
        _elements[ name ].addEventListener( "change", function( e ){
          updateTrackEvent();
        }, false);
      }

      _targets = _this.createTargetsList( [ butter.currentMedia ].concat( butter.targets ) );
      _popcornOptions = trackEvent.popcornOptions;
      _trackEvent = trackEvent;
      onEditorOpen();
      _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
    },
    close: function(){
      _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
    }
  });
  });
}( window.Butter ));
