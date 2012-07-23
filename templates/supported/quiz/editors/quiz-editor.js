(function( Butter ) {

  Butter.Editor.register( "quiz", "load!{{baseDir}}/templates/supported/quiz/editors/quiz-editor.html", function( rootElement, butter ) {

  var _this = this,
      _rootElement = rootElement,
      fields = [ "target", "paginate", "results", "questions", "answers", "start", "end" ],
      _messageContainer = _rootElement.querySelector( "div.error-message" ),
      _targets,
      _trackEvent,
      elements = {},
      popcornOptions = {},
      start, end, name, idx;

  for ( idx = 0; idx < fields.length; idx++ ) {
    name = fields[ idx ];
    elements[ name ] = _rootElement.querySelector( "#" + name );
    elements[ name ].addEventListener( "change", function( e ) {
      update( false );
    }, false);
  }

  function setErrorState ( message ) {
    if ( message ) {
      _messageContainer.innerHTML = message;
      _messageContainer.parentNode.style.visibility = "visible";
      _messageContainer.parentNode.classList.add( "open" );
    }
    else {
      _messageContainer.innerHTML = "";
      _messageContainer.parentNode.style.visibility = "";
      _messageContainer.parentNode.classList.remove( "open" );
    }
  }

  _rootElement.querySelector( "#addQuestion" ).addEventListener( "click", function( e ){
    var questionDiv = document.createElement( "div" ),
        textarea = document.createElement( "textarea" ),
        ul = document.createElement( "ul" ),
        li = document.createElement( "li" ),
        id = "answer-" +  ( popcornOptions.questions.length + "-0" ),
        input = document.createElement( "input" ),
        label = document.createElement( "label" ),
        select = document.createElement( "select" ),
        addButton = document.createElement( "button" ),
        removeQuestionButton = document.createElement( "button" ),
        removeAnswerButton = document.createElement( "button" );

    ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
    textarea.setAttribute( "style", "width: 150px" );
    questionDiv.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );
    addButton.innerHTML = "+";
    removeQuestionButton.innerHTML = "-";
    removeAnswerButton.innerHTML = "-";
    addButton.addEventListener( "click", addAnswer( addButton, ul, li, popcornOptions.questions.length, 0 ) );
    removeAnswerButton.addEventListener( "click", removeAnswer( removeAnswerButton, ul, li, popcornOptions.questions.length + 1, 0 ) );
    removeQuestionButton.addEventListener( "click", removeQuestion( removeQuestionButton, elements.questions, questionDiv ), false );

    textarea.innerHTML = "Question";
    input.setAttribute( "id", id );
    input.value = "Answer";
    label.setAttribute( "for", id );
    label.innerHTML = "1";
    li.appendChild( input );
    li.appendChild( removeAnswerButton );
    li.appendChild( addButton );

    id = "correct-" + popcornOptions.questions.length;
    select.setAttribute( "id", id );
    label = document.createElement( "label" );
    label.setAttribute( "for", id );
    label.innerHTML = "Correct Answer";

    ul.appendChild( li );

    questionDiv.setAttribute( "id", "question-" + popcornOptions.questions.length );
    questionDiv.appendChild( textarea );
    questionDiv.appendChild( removeQuestionButton );

    questionDiv.appendChild( ul );
    questionDiv.appendChild( label );
    questionDiv.appendChild( select );

    _rootElement.querySelector( "#questions" ).appendChild( questionDiv );
    update( false );
  }, false);

  function update( alsoClose ) {
    var questions = _rootElement.querySelector( "#questions" ).children,
        idx, answersIdx;

    alsoClose = !!alsoClose;
    setErrorState( false );

    for ( idx = 0; idx < fields.length; idx ++ ) {
      var field = fields[ idx ],
          element = elements[ field ];
      if ( field !== "questions" ) {
        popcornOptions[ field ] = element.type === "checkbox" ? element.checked : element.value;
      }
    }

    popcornOptions.questions = [];

    for ( idx = 0; idx < questions.length; idx++ ) {
      if ( !popcornOptions.questions[ idx ] ) {
        popcornOptions.questions[ idx ] = {};
      }
      popcornOptions.questions[ idx ].question = questions[ idx ].querySelectorAll( "textarea" )[ 0 ].value;
      possibleAnswers = questions[ idx ].querySelectorAll( "select" )[ 0 ];
      popcornOptions.questions[ idx ].correctAnswer = possibleAnswers.selectedIndex;
      var answersList = questions[ idx ].querySelectorAll( "ul li > input ");
      for ( answersIdx = 0; answersIdx < answersList.length; answersIdx++ ) {
        if ( !popcornOptions.questions[ idx ].answers ) {
          popcornOptions.questions[ idx ].answers = [];
        }
        popcornOptions.questions[ idx ].answers[ answersIdx ] = answersList[ answersIdx ].value;
      }
    }

    if ( elements.results.checked ) {
      popcornOptions.decorators = [{
        "when": "end",
        "what": "results"
      }];
    }
    else {
      popcornOptions.decorators = [];
    }
    popcornOptions.paginate = elements.paginate.checked;

    try {
      _trackEvent.update( popcornOptions );
    }
    catch( e ) {
      setErrorState( e.toString() );
    }
  }

  function addAnswer( aAddButton, aUl, aLi, aIdx, answersIdx ) {
    return function( e ) {
      var removeButton = document.createElement( "button" ),
          len = aUl.children.length,
          id;

      removeButton.innerHTML = "-";
      aLi.removeChild( aLi.lastChild );

      id = "answer-" + aIdx + "-" + len;

      aLi = document.createElement( "li" );
      input = document.createElement( "input" );
      input.setAttribute( "type", "text" );
      input.id = id;
      answerLabel = document.createElement( "label" );
      answerLabel.setAttribute( "for", id );
      answerLabel.innerHTML = len + 1;

      removeButton.addEventListener( "click", removeAnswer( removeButton, aUl, aLi, aIdx, answersIdx + 1 ), false );

      aLi.appendChild( input );
      aUl.appendChild( aLi );
      aLi.appendChild( removeButton );
      aLi.appendChild( aAddButton );

      update( false );
    };
  }

  function removeAnswer( aAddButton, aUl, aLi, aIdx, aAnswersIdx ) {
    return function( e ) {
      var addButton, previousInput, previousLabel, previousLi, id, currentLi, currentLabel, currentInput, count;

      if ( aUl.lastChild !== aUl.firstChild ) {
        if ( aUl.lastChild === aLi ) {
          aUl.removeChild( aLi );
          addButton = document.createElement( "button" );
          addButton.innerHTML = "+";
          addButton.addEventListener( "click", addAnswer( addButton, aUl, aUl.lastChild, aIdx, aAnswersIdx ), false );
          id = "answer-" + aIdx + "-" + aAnswersIdx;
          previousInput = aUl.lastChild.querySelectorAll( "input" )[ 0 ];
          previousInput.setAttribute( "id", id );
          aUl.lastChild.appendChild( addButton );
        }
        else {
          currentLi = aLi;
          count = aAnswersIdx;
          while ( ( currentLi = currentLi.nextSibling ) ) {
            id = "answer-" + aIdx + "-" + count;
            count += 1;
            currentInput = currentLi.querySelectorAll( "input" )[ 0 ];
            currentInput.setAttribute( "id", id );
          }
          aUl.removeChild( aLi );
        }
        update( false );
      }
    };
  }

  function removeQuestion( aAddButton, container, div ) {
    return function( e ) {
      if ( container.firstChild !== container.lastChild ) {
        container.removeChild( div );
        update( false );
      }
    };
  }

  function onEditorOpen( e ) {
    function createQuestionsRow() {
      var question, answersDiv, questionContainer, theQuestion, answerLabel, id, input, ul, li, addButton, removeButton, idx, answersIdx, removeQuestionButton;

      // questions.setAttribute( "class", "question-container" );

      for ( idx = 0; idx < popcornOptions.questions.length; idx++) {
        questionContainer = document.createElement( "div" );
        questionContainer.setAttribute( "style", "padding-top: 20px; padding-bottom: 20px" );
        questionContainer.id = "question-" + idx;
        answersDiv = document.createElement( "div" );
        theQuestion = popcornOptions.questions[ idx ];
        question = document.createElement( "textarea" );
        question.innerHTML = theQuestion.question;
        ul = document.createElement( "ul" );
        ul.setAttribute( "style", "list-style-type: none; display: inline; padding: 0" );
        question.setAttribute( "style", "width: 150px" );
        for ( answersIdx = 0; answersIdx < theQuestion.answers.length; answersIdx++ ) {
          li = document.createElement( "li" );
          input = document.createElement( "input" );
          input.setAttribute( "type", "text" );
          id = "answer-" + idx + "-" + answersIdx;
          input.id = id;
          input.value = theQuestion.answers[ answersIdx ];
          answerLabel = document.createElement( "label" );
          answerLabel.setAttribute( "for", id );
          answerLabel.innerHTML = answersIdx + 1;
          li.appendChild( input );
          removeButton = document.createElement( "button" );
          removeButton.innerHTML = "-";
          removeButton.addEventListener( "click", removeAnswer( removeButton, ul, li, idx, answersIdx + 1 ), false );
          li.appendChild( removeButton );
          if ( answersIdx === theQuestion.answers.length - 1 ) {
            addButton = document.createElement( "button" );
            addButton.innerHTML = "+";
            addButton.addEventListener( "click", addAnswer( addButton, ul, li, idx, answersIdx ), false );
            li.appendChild( addButton );
          }
          ul.appendChild( li );
        }

        removeQuestionButton = document.createElement( "button" );
        removeQuestionButton.innerHTML = "-";
        removeQuestionButton.addEventListener( "click", removeQuestion( removeButton, elements.questions, questionContainer ), false );

        questionContainer.appendChild( question );
        questionContainer.appendChild( removeQuestionButton );
        questionContainer.appendChild( ul );

        var correct = document.createElement( "select" ),
            label = document.createElement( "label" );

        correct.setAttribute( "id", "correct-" + idx );
        label.innerHTML = "Correct Answer";
        label.setAttribute( "for", "correct-" + idx );

        questionContainer.appendChild( label );
        questionContainer.appendChild( correct );

        elements.questions.appendChild( questionContainer );
      }
      idx = idx - 1;
      answersIdx = answersIdx - 1;
    }

    createQuestionsRow();

    var select = _targets.querySelector( "select" ),
        targets;
    select.removeChild( select.querySelector( ".default-target-option" ) );
    targets = _targets.querySelector( "select" ).children;

    while ( targets[ 0 ] ) {
      elements.target.appendChild( targets[ 0 ] );
    }

    elements.target.value = _trackEvent.popcornOptions.target;

    for ( questionsIdx = 0; questionsIdx < popcornOptions.questions.length; questionsIdx++ ) {
      answers = popcornOptions.questions[ questionsIdx ] && popcornOptions.questions[ questionsIdx ].answers || [];
      for ( idx = 0; idx < answers.length; idx++ ) {
        input = document.createElement( "option" );
        input.appendChild( document.createTextNode( answers[ idx ] ) );
        input.value = answers[ idx ];
        answersDropdown = _rootElement.querySelector( "#correct-" + questionsIdx );
        answersDropdown.appendChild( input );
        answersDropdown.addEventListener( "change", function( e ) {
          update( false );
        }, false);
        if ( popcornOptions.questions[ questionsIdx ].correctAnswer === idx ) {
          answersDropdown.selectedIndex = idx;
        }
      }
    }

    elements.start.value = popcornOptions.start;
    elements.end.value = popcornOptions.end;
    elements.paginate.checked = !!popcornOptions.paginate;
    elements.results.checked = popcornOptions.decorators && popcornOptions.decorators.length > 0 || false;
  }

  function onTrackEventUpdated( e ) {
    var questions = _rootElement.querySelector( "#questions" ).children,
        idx, questionsIdx, answersDropdown, answers;

    for ( questionsIdx = 0; questionsIdx < popcornOptions.questions.length; questionsIdx++ ) {
      answers = popcornOptions.questions[ questionsIdx ] && popcornOptions.questions[ questionsIdx ].answers || [];
      answersDropdown = questions[ questionsIdx ].querySelectorAll( "select" )[ 0 ];

      while ( answersDropdown.hasChildNodes() ) {
        answersDropdown.removeChild( answersDropdown.lastChild );
      }

      for ( idx = 0; idx < answers.length; idx++ ) {
        input = document.createElement( "option" );
        input.appendChild( document.createTextNode( answers[ idx ] ) );
        input.value = answers[ idx ];
        answersDropdown.appendChild( input );
        if ( popcornOptions.questions[ questionsIdx ].correctAnswer === idx ) {
          answersDropdown.selectedIndex = idx;
        }
      }
    }
  }

  Butter.Editor.TrackEventEditor( _this, butter, rootElement, {
    open: function( parentElement, trackEvent ) {
      _targets = _this.createTargetsList( [ butter.currentMedia ].concat( butter.targets ) );
      popcornOptions = trackEvent.popcornOptions;
      _trackEvent = trackEvent;
      onEditorOpen();
      _trackEvent.listen( "trackeventupdated", onTrackEventUpdated );
    },
    close: function() {
      _trackEvent.unlisten( "trackeventupdated", onTrackEventUpdated );
    }
  });
  });
}( window.Butter ));
