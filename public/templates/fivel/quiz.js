/*global $ define*/

define(function() {
  function Quiz() {
    var currentIndex = 0,
        selectedAnswers = {},
        listeners = {},
        $quiz = $(".quiz-parent-container"),
        $questions = $(".quiz-question-container div"),
        $previousButton = $(".previous-button"),
        $continueButton = $(".continue-button"),
        $finishButton = $(".finish-button"),
        $reviewText = $(".quiz-review-text"),
        $completeText = $(".quiz-complete-text"),
        slice = Array.prototype.slice,
        self = this;

    $.each($questions, function(idx, question) {
      var $question = $(question)
       , mixAndMatchQuestion = $question.find("table.tablemixnmatch select");

      if (mixAndMatchQuestion.length > 0) {
        selectedAnswers[idx] = $.map(mixAndMatchQuestion, function() {
          return -1;
        });
      } else {
        selectedAnswers[idx] = [-1];
      }
    });

    function hideAll() {
      $questions.hide();
    }

    function showAll() {
      $questions.show();
    }

    function toggle( quizQuestion ) {
      hideAll();
      $($questions[quizQuestion]).show();
    }

    this.on = function(param, listener) {
      var callbacks = listeners[param];

      if (!callbacks) {
        callbacks = listeners[param] = $.Callbacks();
      }


      callbacks.add(listener);
    };

    this.off = function(param, listener) {
      var callbacks = listeners[param];

      if (!callbacks) {
        callbacks.remove(listener);
      }
    };

    this.fire = function(param) {
      var callbacks = listeners[param];

      if (callbacks) {
        callbacks.fireWith(null, slice.call(arguments, 1));
      }
    };

    this.prepare = function() {
      $questions.each(function(questionIdx, question) {
        if (question.classList.contains("quiz-type-mc")) {
          $(question).find("li input[type=radio]").each(function(answerIdx, radioButton) {
            $(radioButton).click(function() {
              selectedAnswers[questionIdx] = [answerIdx];
            });
          });
        } else if (question.classList.contains("quiz-type-mnm")) {
          $(question).find("table.tablemixnmatch select").each(function(answerIdx, select) {
            $(select).change(function() {
              var selectedIndex = $(this).prop("selectedIndex") - 1;
              selectedAnswers[questionIdx].splice(answerIdx, 1, selectedIndex);
            });
          });
        }
      });

      $continueButton.click(function() {
        if ( self.hasNext() ) {
          self.next();
          $previousButton.show();
        }
        else {
          self.review();
          $continueButton.hide();
          $previousButton.hide();
        }
      });

      $previousButton.click(function() {
        self.previous();

        if (self.hasPrevious()) {
          $previousButton.show();
        } else {
          $previousButton.hide();
        }
      });
    };

    this.show = function() {
      $quiz.show();
    };

    this.hide = function() {
      $quiz.hide();
    };

    this.hasPrevious = function() {
      return currentIndex > 0;
    };

    this.hasNext = function() {
      return currentIndex < $questions.length - 1;
    };

    this.next = function() {
      if ( this.hasNext() ) {
        currentIndex = currentIndex + 1;
        toggle( currentIndex );
        return $questions[ currentIndex ];
      }
    };

    this.previous = function() {
      if ( this.hasPrevious() ) {
        currentIndex = currentIndex - 1;
        toggle( currentIndex );
        return $questions[ currentIndex ];
      }
    };

    this.start = function() {
      currentIndex = 0;

      if ($questions.length > 0) {
        toggle( currentIndex );
      }
    };

    this.review = function() {
      var submitButton = $(".submit-button");

      $reviewText.show();

      submitButton.show().click(function() {
        $(this).hide();
        self.end();
      });

      showAll();
    };

    this.end = function() {
      var submission = [];
      $reviewText.hide();
      $completeText.show();

      // Disable radio buttons
      $questions.find("input[type=radio]").each(function() {
        $(this).attr("disabled", true);
      });

      $finishButton.show().click(function() {
        self.hide();
        self.fire("end");
      });

      $.each(selectedAnswers, function(key, value) {
        submission.push({ answer: value });
      });

      self.fire("submission", submission);
    };

    this.showResults = function(results) {
      var correctAnswers = results.correctAnswers;

      function showExplanation(options) {
        var appendTo = options.appendTo
          , correctAnswerElement = options.correctAnswerElement
          , explanation = options.explanation
          , correctAnswer = options.correctAnswer
          , $explanation;

        $explanation = $($.clone($(".popcorn-explanation:hidden")[0]));

        if (correctAnswer) {
          $explanation.find(".correct-answer-label").html(correctAnswer);
        } else if (correctAnswerElement) {
          $explanation.find(".correct-answer-label").html("Correct Answer: " + $(correctAnswerElement).find("label").html().substr(0, 2));
        }

        if (explanation && explanation.trim().length > 0) {
          $explanation.find(".quiz-explanation").html(explanation);
        }

        appendTo.append($explanation);

        $explanation.show();
      }

      if (!correctAnswers) {
        $completeText.html("Something went wrong while calculating your quiz. Please try again.");
        return;
      }

      if (results.hasOwnProperty("score") && results.hasOwnProperty("maxScore")) {
        $completeText.html($completeText.html() + " Your score is " + results.score + " out of " + results.maxScore + ".");
      }

      $(".popcorn-question-list li input[type=radio]").attr("disabled", "disabled");
      $(".tablemixnmatch tr td select").attr("disabled", "disabled");

      $(".quiz-question-container").scrollTop(0);
      $.each(correctAnswers, function(idx, result) {
        var $question = $($questions[idx])
          , correctAnswer = result.correctAnswer
          , explanationText = result.explanation
          , correctAnswerElement = $question.find("li")
          , selectedAnswer = selectedAnswers[idx]
          , incorrectAnswerElement;

        if (correctAnswerElement.length > 0) {
          correctAnswerElement = correctAnswerElement[correctAnswer];
          // Selected answers for MC questions are stored as an array of one element,
          // so accessing the first element is safe
          if (selectedAnswer[0] !== correctAnswer) {
            correctAnswerElement.classList.add("popcorn-correct-answer");
            incorrectAnswerElement = $question.find("li")[selectedAnswers[idx]];
            if (incorrectAnswerElement) {
              incorrectAnswerElement.classList.add("popcorn-incorrect-answer");
            }

            showExplanation({
              appendTo: $question,
              correctAnswerElement: correctAnswerElement,
              explanation: explanationText ? "Explanation: " + explanationText : ""
            });
          }
        } else {
          var $dropDownLists = $question.find("select")
            , correctSequenceLetters = $.map(correctAnswer, function(answer) {
                return ["a.", "b.", "c.", "d.", "e.", "f.", "g."][answer];
              }).join(" ");

          $.each(selectedAnswer, function(idx, chosenAnswer) {
            if (chosenAnswer !== correctAnswer[idx]) {
              $($dropDownLists[idx]).parent().parent()[0].classList.add("popcorn-incorrect-answer");
            }
          });

          showExplanation({
            appendTo: $question,
            correctAnswer: "The correct answer sequence is: " + correctSequenceLetters,
            explanation: explanationText ? "Explanation: " + explanationText : ""
          });
        }

        $("#questionScore" + idx).prepend(results.submissionScores[idx].score + "/");
      });

      showAll();
    };
  }

  return Quiz;
});

