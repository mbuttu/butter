document.addEventListener( "DOMContentLoaded", function() {

  var _comm = new window.Comm(),
      fields = [ "target", "paginate", "results", "questions", "answers", "start", "end" ],
      elements = {},
      popcornOptions = {},
      start, end, name, idx;

  for ( idx = 0; idx < fields.length; idx++ ) {
    name = fields[ idx ];
    elements[ name ] = document.getElementById( name );
    elements[ name ].addEventListener( "change", function( e ) {
      update( false );
    }, false);
  }

  document.getElementById( "addQuestion" ).addEventListener( "click", function( e ) {
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
    // li.appendChild( label );
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
    // questionDiv.appendChild( document.createTextNode( "Question " + ( popcornOptions.questions.length + 1 ) ) );
    questionDiv.appendChild( textarea );
    questionDiv.appendChild( removeQuestionButton );

    questionDiv.appendChild( ul );
    questionDiv.appendChild( label );
    questionDiv.appendChild( select );

    document.getElementById( "questions" ).appendChild( questionDiv );
    update( false );
  }, false);

  function update( alsoClose ) {
    var questions = document.getElementById( "questions" ).children,
        idx, answersIdx;

    alsoClose = !!alsoClose;
    document.getElementById( "message" ).innerHTML = "";

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
      // var answersList = document.querySelector( "#question-" + idx + " ul" ).querySelectorAll( "li > input ");
      var answersList = questions[ idx ].querySelectorAll( "ul li > input ");
      for ( answersIdx = 0; answersIdx < answersList.length; answersIdx++ ) {
        if ( !popcornOptions.questions[ idx ].answers ) {
          popcornOptions.questions[ idx ].answers = [];
        }
        // popcornOptions.questions[ idx ].answers[ answersIdx ] = document.getElementById( "answer-" + idx + "-" + answersIdx ).value;
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

    _comm.send( "submit", {
      eventData: popcornOptions,
      alsoClose: alsoClose
    });
  }

  function okPressed( e ) {
    // update( true );
  }

  function cancelPressed( e ) {
    _comm.send( "cancel" );
  }

  document.addEventListener( "keydown", function( e ) {
    if ( e.keyCode === 13 ) {
      okPressed( e );
    }
    else if ( e.keyCode === 27 ) {
      cancelPressed( e );
    }
  }, false);

  function addAnswer( aAddButton, aUl, aLi, aIdx, answersIdx ) {
    return function( e ) {
      var removeButton = document.createElement( "button" ),
          len = aUl.children.length,
          id;

      removeButton.innerHTML = "-";
      aLi.removeChild( aLi.lastChild );

      id = "answer-" + aIdx + "-" + len;

      aLi = document.createElement( "li" );
      // id = "answer-" + aIdx + "-" + answersIdx;
      input = document.createElement( "input" );
      input.setAttribute( "type", "text" );
      input.id = id;
      answerLabel = document.createElement( "label" );
      answerLabel.setAttribute( "for", id );
      answerLabel.innerHTML = len + 1;

      removeButton.addEventListener( "click", removeAnswer( removeButton, aUl, aLi, aIdx, answersIdx + 1 ), false );

      // aLi.appendChild( answerLabel );
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
          // previousLabel = aUl.lastChild.querySelectorAll( "label" )[ 0 ];
          previousInput = aUl.lastChild.querySelectorAll( "input" )[ 0 ];
          previousInput.setAttribute( "id", id );
          // previousLabel.setAttribute( "for", id );
          // previousLabel.innerHTML = aAnswersIdx + 1;
          aUl.lastChild.appendChild( addButton );
        }
        else {
          currentLi = aLi;
          count = aAnswersIdx;
          while ( ( currentLi = currentLi.nextSibling ) ) {
            id = "answer-" + aIdx + "-" + count;
            count += 1;
            // currentLabel = currentLi.querySelectorAll( "label" )[ 0 ];
            currentInput = currentLi.querySelectorAll( "input" )[ 0 ];
            currentInput.setAttribute( "id", id );
            // currentLabel.setAttribute( "for", id );
            // currentLabel.innerHTML = count;
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

  _comm.listen( "trackeventdata", function( e ) {
    function createQuestionsRow() {
      var question, answersDiv, questionContainer, theQuestion, answerLabel, id, input, ul, li, addButton, removeButton, idx, answersIdx, removeQuestionButton;

      questions.setAttribute( "class", "question-container" );

      for ( idx = 0; idx < popcornOptions.questions.length; idx++) {
        questionContainer = document.createElement( "div" );
        questionContainer.id = "question-" + idx;
        answersDiv = document.createElement( "div" );
        theQuestion = popcornOptions.questions[ idx ];
        question = document.createElement( "textarea" );
        question.innerHTML = theQuestion.question;
        ul = document.createElement( "ul" );
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
          // li.appendChild( answerLabel );
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

        // questionContainer.appendChild( document.createTextNode( "Question " + ( idx + 1 ) ) );
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

    popcornOptions = e.data.popcornOptions;

    createQuestionsRow();

    var targets = e.data.targets,
        idx, input, answers, questionsIdx, answersDropdown;

    for ( idx = 0; idx < targets.length; idx++ ) {
      input = document.createElement( "option" );
      input.appendChild( document.createTextNode( targets[ idx ] ) );
      input.value = targets[ idx ];
      elements.target.appendChild( input );
      if ( popcornOptions.target === targets[ idx ] ) {
        elements.target.selectedIndex = idx;
      }
    }

    for ( questionsIdx = 0; questionsIdx < popcornOptions.questions.length; questionsIdx++ ) {
      answers = popcornOptions.questions[ questionsIdx ] && popcornOptions.questions[ questionsIdx ].answers || [];
      for ( idx = 0; idx < answers.length; idx++ ) {
        input = document.createElement( "option" );
        input.appendChild( document.createTextNode( answers[ idx ] ) );
        input.value = answers[ idx ];
        answersDropdown = document.getElementById( "correct-" + questionsIdx );
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
    elements.results.checked = !!popcornOptions.decorators;

    update( false );
  });

  _comm.listen( "trackeventupdated", function( e ) {
    var questions = document.getElementById( "questions" ).children,
        idx, questionsIdx, answersDropdown, answers;

    for ( questionsIdx = 0; questionsIdx < popcornOptions.questions.length; questionsIdx++ ) {
      answers = popcornOptions.questions[ questionsIdx ] && popcornOptions.questions[ questionsIdx ].answers || [];
      // answersDropdown = document.getElementById( "correct-" + questionsIdx );
      answersDropdown = questions[ questionsIdx ].querySelectorAll( "select" )[ 0 ];

      while ( answersDropdown.hasChildNodes() ) {
        answersDropdown.removeChild( answersDropdown.lastChild );
      }

      for ( idx = 0; idx < answers.length; idx++ ) {
        input = document.createElement( "option" );
        input.appendChild( document.createTextNode( answers[ idx ] ) );
        input.value = answers[ idx ];
        answersDropdown.appendChild( input );
        if ( popcornOptions.questions[ 0 ].correctAnswer === idx ) {
          answersDropdown.selectedIndex = idx;
        }
      }
    }
  });

  _comm.listen( "trackeventupdatefailed", function( e ) {
    if( e.data === "invalidtime" ){
      document.getElementById( "message" ).innerHTML = "You've entered an invalid start or end time. Please verify that they are both greater than 0, the end time is equal to or less than the media's duration, and that the start time is less than the end time.";
      elements.start.className = elements.end.className = "error";
    } //if
  });

  _comm.listen( "close", function( e ){
    update( false );
  });
}, false );
