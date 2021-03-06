// PLUGIN: Quiz

(function ( Popcorn ) {

  var QUIZ_NUMBER = 0,
      NO_ANSWER = -1,
      weight = function( correctAnswer ) {
        return ( correctAnswer === NO_ANSWER ) ? 0 : 1;
      };

  Popcorn.plugin( "quiz", function( options ) {
    function Quiz() {
      var currentIndex = 0,
          self = this;

      function decoratable( funcName ) {
        var result,
        decorators = self.decoratorsList[ funcName ] || [],
        args = Array.prototype.slice.call( arguments, 1 );

        for ( var idx = 0; idx < decorators.length; idx++ ) {
          result = Quiz.decorators[ decorators[ idx ] ].prepare.apply( null, args );
        }

        return result;
      }

      this.decoratorsList = {};

      this.decorate = function( funcName, decorator ) {
        if ( !this.decoratorsList[ funcName ] ) {
          this.decoratorsList[ funcName ] = [];
        }
        this.decoratorsList[ funcName ].push( decorator );
      };

      function toggle( quizQuestion ) {
        hideAll();
        document.getElementById( "questionContainer-" + quizNumber + "-" + quizQuestion ).style.display = "inline";
      }

      this.prepare = function( target ) {
        var questionContainer, answerRadioButton, answerLabel, p, ul, li;
        for ( var questionIdx = 0; questionIdx < questions.length; questionIdx++ ) {
          var theQuestion = questions[ questionIdx ],
          answers = theQuestion.answers,
          radioButtonGuid = "answer-" + Popcorn.guid(),
          id;

          questionContainer = document.createElement( "div" );
          p = document.createElement( "p" );
          ul = document.createElement( "ul" );
          ul.setAttribute( "class", "popcorn-question-list" );

          // SET OTHER CLASSES
          // Popcorn.extend( questionContainer, {
          //   "class": "popcorn-question-container",
          //   id: "questionContainer-" + questionIdx
          // });
          Popcorn.extend( questionContainer, {
            "class": "popcorn-question-container",
            id: "questionContainer-" + quizNumber + "-" + questionIdx
          });

          // questionContainer.style.display = "none";

          // decoratable( "prepare", questionContainer );

          p.innerHTML = theQuestion.question;

          questionContainer.appendChild( p );

          for ( var idx = 0; idx < answers.length; idx++ ) {
            li = document. createElement( "li" );
            id = "answer-" + quizNumber + "-" + questionIdx + "-" + idx;

            answerRadioButton = document.createElement( "input" );
            Popcorn.extend( answerRadioButton, {
              "id": id,
              name: radioButtonGuid,
              type: "radio"
            });

            answerRadioButton.addEventListener( "click", function( questionIdx, answer ) {
              return function() {
                selectedAnswers[ questionIdx ] = answer;
              };
            }( questionIdx, answers[ idx ] ), false );

            answerLabel = document.createElement( "label" );
            answerLabel.innerHTML = answers[ idx ];
            answerLabel.setAttribute( "for", id );

            li.appendChild( answerRadioButton );
            li.appendChild( answerLabel );
            ul.appendChild( li );
            questionContainer.appendChild( ul );
            options._container.appendChild( questionContainer );
          }
        }
      };

      this.hasPrevious = function() {
        if ( !paginated ) {
          return false;
        }
        return currentIndex > 0;
      };

      this.hasNext = function() {
        if ( !paginated ) {
          return false;
        }
        return currentIndex < questions.length - 1;
      };

      this.next = function() {
        if ( this.hasNext() ) {
          currentIndex = currentIndex + 1;
          toggle( currentIndex );
          return questions[ currentIndex ];
        }
      };

      this.previous = function() {
        if ( this.hasPrevious() ) {
          currentIndex = currentIndex - 1;
          toggle( currentIndex );
          return questions[ currentIndex ];
        }
      };

      this.start = function() {
        if ( !paginated ) {
          showAll();
          return;
        }
        currentIndex = 0;
        questions.length > 0 && toggle( currentIndex );
        // return questions[ currentIndex ];
      };

      this.review = function( target ) {
        var reviewTextContainer = document.createElement( "div" ),
            resumeButton = addButton( "resumeButton", "Submit", function() {
              buttons.resumeButton.style.display = "none";
              self.end( target );
            });

        if (paginated) {
          showAll();
        }

        reviewTextContainer.id = "review-text-" + quizNumber;

        reviewTextContainer.appendChild( document.createTextNode( "Please review your answers. Once you are done, click Submit to complete this quiz." ) );

        // FIXME: Remove the breaks, allow it to be done via CSS
        reviewTextContainer.appendChild( document.createElement( "br" ) );
        reviewTextContainer.appendChild( document.createElement( "br" ) );

        target.appendChild( reviewTextContainer );

        target.appendChild( resumeButton );
      };

      this.end = function( target ) {
        var resumeButton = addButton( "finishButton", "Finish", function() {
              options._parentContainer.style.display = "none";
              popcorn.play();
            }),
            resumeText = document.createElement( "p" ),
            reviewTextContainer = document.getElementById( "review-text-" + quizNumber ),
            radioButtons;

        if (reviewTextContainer) {
          reviewTextContainer.style.display = "none";
        }

        // Disable radio buttons
        radioButtons = target.querySelectorAll( "input[type=radio]" );

        for ( var idx = 0, length = radioButtons.length; idx < length; idx++ ) {
          radioButtons[ idx ].disabled = true;
        }

        resumeText.innerHTML = "Quiz is complete!";

        function checkAnswers() {
          var theQuestion, correctAnswer, selectedAnswer, score;

          correctAnswers = 0;

          for ( var questionIdx = 0; questionIdx < questions.length; questionIdx++ ) {
            theQuestion = questions[ questionIdx ];
            correctAnswer = theQuestion.correctAnswer;
            selectedAnswer = selectedAnswers[ questionIdx ];
            // what if nothing is selected?
            if ( correctAnswer === NO_ANSWER || selectedAnswer && selectedAnswer === theQuestion.answers[ correctAnswer ] ) {
              score = 1 * weight( correctAnswer );
              correctAnswers = correctAnswers + score;
              theQuestion.isCorrect = true;
              theQuestion.correctAnswerCallback && theQuestion.correctAnswerCallback( selectedAnswer );
            }
            else {
              theQuestion.isCorrect = false;
              theQuestion.wrongAnswerCallback && theQuestion.wrongAnswerCallback();
            }
          }
        }

        checkAnswers();

        decoratable( "end", target );

        target.appendChild( resumeText );
        target.appendChild( resumeButton );

        quizComplete = true;
        popcorn.emit("quizended", {
          score: correctAnswers,
          outOf: questionable
        });
      };
    }

    Quiz.decorators = {};

    Quiz.decorators.correctAnswers = {
      prepare: function( target ) {
        document.getElementById( "popcorn-question-result" ) && target.removeChild( document.getElementById( "popcorn-quiz-results" ) );
        var resultsDiv = document.createElement( "div" );
        // hideAll();
        resultsDiv.setAttribute( "id", "popcorn-quiz-results" );
        resultsDiv.appendChild( document.createTextNode( "You got " + correctAnswers + " / " + questionable + " correct answers!" ) );
        target.appendChild( resultsDiv );
      }
    };

    Quiz.decorators.results = {
      prepare: function( target ) {
        var resultsDiv = document.createElement( "div" );

        function checkAnswers() {
          var correctAnswerDiv, correctAnswerDivId, theQuestion,
              correctAnswer, selectedAnswer, questionContainer;

          // If it's paginated, showAll so that the results can be displayed
          if (paginated) {
            showAll();
          }

          for ( var questionIdx = 0; questionIdx < questions.length; questionIdx++ ) {
            correctAnswerDiv = document.createElement( "div" );
            correctAnswerDivId = "popcorn-correct-answer-" + quizNumber + "-" + questionIdx;
            theQuestion = questions[ questionIdx ];
            correctAnswer = theQuestion.correctAnswer;
            selectedAnswer = selectedAnswers[ questionIdx ];
            // document.getElementById( "answer-" + quizNumber + "-" + questionIdx + "-" + correctAnswer ).parentNode.setAttribute( "class", "" );
            // what if nothing is selected?
            if ( !theQuestion.isCorrect ) {
              var p = document.createElement( "p" );
              questionContainer = document.getElementById( "questionContainer-" + quizNumber + "-" + questionIdx );
              document.getElementById( correctAnswerDivId ) && questionContainer.removeChild( document.getElementById( correctAnswerDivId ) );
              p.innerHTML = "Correct Answer: " + theQuestion.answers[ correctAnswer ];
              correctAnswerDiv.appendChild( p );

              if ( theQuestion.explanation ) {
                p = document.createElement( "p" );
                p.innerHTML = "Explanation: " + theQuestion.explanation;
                correctAnswerDiv.appendChild( p );
              }

              correctAnswerDiv.setAttribute( "id", correctAnswerDivId );
              questionContainer.appendChild( correctAnswerDiv );

              // TODO: Add to class list?
              document.getElementById( "answer-" + quizNumber + "-" + questionIdx + "-" + correctAnswer ).parentNode.setAttribute( "class", "popcorn-correct-answer" );
            }
          }
        }

        checkAnswers();

        document.getElementById( "popcorn-quiz-" + quizNumber + "-results" ) && target.removeChild( document.getElementById( "popcorn-quiz-" + quizNumber + "-results" ) );
        // hideAll();
        resultsDiv.setAttribute( "id", "popcorn-quiz-" + quizNumber + "-results" );
        resultsDiv.appendChild( document.createTextNode( "You got " + correctAnswers + " / " + questionable + " correct answers!" ) );
        target.appendChild( resultsDiv );
      }
    };

    Quiz.decorators.paginate = {
      prepare: function( target ) {
        target.style.display = "none";
      }
    };

    function showAll() {
      for ( var idx=0; idx<questions.length; idx++ ) {
        document.getElementById( "questionContainer-" + quizNumber + "-" + idx ).style.display = "inline";
      }
    }

    function hideAll() {
      for ( var idx=0; idx<questions.length; idx++ ) {
        document.getElementById( "questionContainer-" + quizNumber + "-" + idx ).style.display = "none";
      }
    }

    function addButton( buttonName, buttonText, clickCallback ) {
      var button = buttons[ buttonName ];

      if ( !button ) {
        button = document.createElement( "button" );
        button.appendChild( document.createTextNode( buttonText ) );
        button.addEventListener( "click", function() {
          clickCallback();
        }, false );
        buttons[ buttonName ] = button;
        options._container.appendChild( button );
      }
      return button;
    }

    // end = end || start + 0.5,
    // UL > LI elements?
    var popcorn = this,
        questions = options.questions || [],
        // allowPause = options.allowPause === false ? false : true,
        allowPause = options.allowPause = typeof allowPause === "undefined" ? true : !!options.allowPause,
        continueButtonText = options.continueButtonText || "Continue",
        previousButtonText = options.previousButtonText || "Previous",
        quiz = new Quiz(),
        selectedAnswers = {},
        buttons = {},
        correctAnswers = 0,
        quizNumber = QUIZ_NUMBER++,
        questionable = 0,
        quizComplete = false,
        paginated;

    for ( var idx = 0; idx < questions.length; idx++ ) {
      ( questions[ idx ].correctAnswer !== NO_ANSWER ) && questionable++;
    }

    return {
      _setup: function( popcornOptions ) {
        var target = document.getElementById( options.target ),
            title = document.createElement( "div" );

        title.classList.add( "quiz-title" );
        paginated = options.paginate = typeof options.paginate === "undefined" ? true : !!options.paginate;

        options.decorators = options.decorators || [];
        options.title = options.title || "Quiz";
        options._target = target;

        title.innerHTML = options.title;

        options._container = document.createElement( "div" );
        // options._container.style.display = "none";

        // FIXME: make this options._container?
        options._parentContainer = document.createElement( "div" );
        options._parentContainer.style.display = "none";
        options._parentContainer.classList.add( "quiz-parent-container" );
        options._parentContainer.appendChild( title );
        options._parentContainer.appendChild( options._container );

        for ( var idx = 0; idx < options.decorators.length; idx++ ) {
          var decoratorOptions = options.decorators[ idx ];
          quiz.decorate( decoratorOptions.when, decoratorOptions.what );
        }

        // paginated && quiz.decorate( "prepare", "paginate" );

        // quiz.decorate( "end", "results" );
        // TODO: IS THIS RIGHT? or pass in target?
        quiz.prepare( options._container );

        if ( !target && Popcorn.plugin.debug ) {
          throw new Error( "target container doesn't exist" );
        }

        // FIXME: This is a work around until a bug is fixed in Popcorn Maker
        // Bug is not filed yet, but it has to do with the default Ids in editor's being "Media Element" (not supposed to have spaces in Ids)
        if ( target === popcorn.media.parentNode.parentNode ) {
          options._container.classList.add( "quiz-question-container" );
        }

        // if ( !options.question || !options.answers && Popcorn.plugin.debug ) {
        //   throw new Error( "a quiz needs a question and possible answers" );
        // }
        target && target.appendChild( options._parentContainer );

        // Can't pass in options to _setup since that will shadow the options
        // defined and needed earlier in the file
        //
        // This can be removed if the structure of how this plugin is written is refactored.
        popcornOptions._target = target;
        popcornOptions._container = options._container;
      },
      start: function( event ) {
        function toggleButtons() {
          var previousButton, continueButton;

          previousButton = addButton( "previousButton", previousButtonText, function() {
            quiz.previous();
            previousButton.style.display = quiz.hasPrevious() ? "inline" : "none";
          });

          // FIXME: Remove the forced new line and allow it to be done via CSS
          options._container.appendChild( document.createTextNode( "\u00A0" ) );

          continueButton = addButton( "continueButton", continueButtonText, function() {
            if ( quiz.hasNext() ) {
              quiz.next();
              previousButton.style.display = "inline";
            }
            else {
              quiz.review( options._container );
              continueButton.style.display = "none";
              previousButton.style.display = "none";
            }
          });

          continueButton.style.display = "inline";
          previousButton.style.display = "none";
        }

        if ( allowPause ) {
          popcorn.pause();
        }

        options._parentContainer.style.display = "inline";
        if ( !quizComplete ) {
          quiz.start();
          toggleButtons();
        }
      },
      end: function( event ) {
        options._parentContainer.style.display = "none";
      },
      _teardown: function() {
        document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._parentContainer );
      }
    };
  },
  {
    about: {
      name: "Popcorn Quiz Plugin",
      version: "0.1",
      author: "Brian Chirls, @bchirls",
      website: "http://github.com/brianchirls"
    },
    options: {
      questions: {
        elem: "input",
        type: "textarea",
        label: "Question"
      },
      paginate: {
        elem: "input",
        type: "checkbox",
        label: "Paginate",
        "default": true
      },
      decorators: {
        elem: "input",
        type: "textarea",
        label: "Show Results"
      },
      target: "questions",
      start: {
        elem: "input",
        type: "number",
        label: "Start Time"
      },
      end: {
        elem: "input",
        type: "number",
        label: "End Time"
      },
      title: {
        elem: "input",
        type: "textarea",
        label: "Title"
      }
    }
  });
})( Popcorn );
