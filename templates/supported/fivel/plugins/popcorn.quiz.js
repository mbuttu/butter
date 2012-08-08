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
          that = this;

      function decoratable( funcName ) {
        var result,
        decorators = that.decoratorsList[ funcName ] || [],
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

      this.end = function( target ) {
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

        if ( paginated ) {
          hideAll();
        }

        popcorn.play();
        decoratable( "end", target );
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
          var correctAnswerDiv, correctAnswerDivId, theQuestion, correctAnswer, selectedAnswer, questionContainer;

          for ( var questionIdx = 0; questionIdx < questions.length; questionIdx++ ) {
            correctAnswerDiv = document.createElement( "div" );
            correctAnswerDivId = "popcorn-correct-answer-" + quizNumber + "-" + questionIdx;
            theQuestion = questions[ questionIdx ];
            correctAnswer = theQuestion.correctAnswer;
            selectedAnswer = selectedAnswers[ questionIdx ];
            // document.getElementById( "answer-" + quizNumber + "-" + questionIdx + "-" + correctAnswer ).parentNode.setAttribute( "class", "" );
            // what if nothing is selected?
            if ( !theQuestion.isCorrect ) {
              if ( !paginated ) {
                questionContainer = document.getElementById( "questionContainer-" + quizNumber + "-" + questionIdx );
                document.getElementById( correctAnswerDivId ) && questionContainer.removeChild( document.getElementById( correctAnswerDivId ) );
                correctAnswerDiv.appendChild( document.createTextNode( "Correct Answer: " + theQuestion.answers[ correctAnswer ] ) );
                correctAnswerDiv.setAttribute( "id", correctAnswerDivId );
                questionContainer.appendChild( correctAnswerDiv );

                // TODO: Add to class list?
                document.getElementById( "answer-" + quizNumber + "-" + questionIdx + "-" + correctAnswer ).parentNode.setAttribute( "class", "popcorn-correct-answer" );
              }
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
        paginated;

    for ( var idx = 0; idx < questions.length; idx++ ) {
      ( questions[ idx ].correctAnswer !== NO_ANSWER ) && questionable++;
    }

    return {
      _setup: function( options ) {
        var target = document.getElementById( options.target );

        paginated = options.paginate = typeof options.paginate === "undefined" ? true : !!options.paginate;

        options.decorators = options.decorators || [];

        options._container = document.createElement( "div" );
        options._container.style.display = "none";

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
        // if ( !options.question || !options.answers && Popcorn.plugin.debug ) {
        //   throw new Error( "a quiz needs a question and possible answers" );
        // }
        target && target.appendChild( options._container );
      },
      start: function( event, options ) {
        function addButton( buttonText, clickCallback ) {
          var button = buttons[ buttonText ];

          if ( !button ) {
            button = document.createElement( "button" );
            button.appendChild( document.createTextNode( buttonText ) );
            button.addEventListener( "click", function() {
              clickCallback();
            }, false );
            buttons[ buttonText ] = button;
            options._container.appendChild( button );
          }
          return button;
        }

        function toggleButtons() {
          var previousButton = addButton( previousButtonText, function() {
                quiz.previous();
                previousButton.style.display = quiz.hasPrevious() ? "inline" : "none";
              }),
              continueButton = addButton( continueButtonText, function() {
                if ( quiz.hasNext() ) {
                  quiz.next();
                  previousButton.style.display = "inline";
                }
                else {
                  quiz.end( options._container );
                  continueButton.style.display = "none";
                  previousButton.style.display = "none";
                }
              });

          continueButton.style.display = "inline";
          previousButton.style.display = "none";
        }

        if ( allowPause ) {
          popcorn.pause();
          toggleButtons();
        }

        options._container.style.display = "inline";
        quiz.start();
      },
      end: function( event, options ) {
        options._container.style.display = "none";
      },
      _teardown: function( options ) {
        document.getElementById( options.target ) && document.getElementById( options.target ).removeChild( options._container );
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
      }
    }
  });
})( Popcorn );
