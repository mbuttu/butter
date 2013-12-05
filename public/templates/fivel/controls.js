/*global window $ define document*/

/************************************************************************
Controls Constructor
************************************************************************/

define(function() {
  function Controls(popcorn, title, cont) {
    var p, volumeWidth, seeking,
        titleWidth, baseWidth, playerBarWidth, playStateCache,
        timeMouseUp, timeMouseDown, timeMouseMove, position,
        volumeMouseUp, volumeMouseDown, volumeMouseMove,
        mutechange, togglePlay,

    // Control Elements
    timebar = document.getElementById("playerProgressBase"),
    progressTime = document.getElementById("playerProgressTime"),
    currentTimeDialog = document.getElementById("playerTimeText"),
    videoDuration = document.getElementById("playerDurationText"),
    playerTitleText = document.getElementById("playerTitleText"),
    muteButton = document.getElementById("playerVolumeButton"),
    volume = document.getElementById("playerVolumeBase"),
    volumeProgressBar = document.getElementById("playerVolumeLevel"),
    playButton = document.getElementById("playerPlayPauseButton"),
    fullscreen = document.getElementById("playerFullscreen"),
    caption = document.getElementById("playerCloseCaption");

    // video element
    var videoContainer = document.getElementById("video-container"),
        tocContainer = document.getElementById("toc");

    cont = typeof cont === "string" ? document.getElementById(cont) : cont;

    p = popcorn;
    p.controls(0);

    var ready = function() {
      var timeStamp = new Date(1970, 0, 1),
          time = p.duration(),
          seconds;

      timeStamp.setSeconds(Math.round(time));
      seconds = timeStamp.toTimeString().substr(3, 5);

      videoDuration.innerHTML = seconds;
      playerTitleText.innerHTML = playerTitleText.title = title;

      baseWidth = 1000; //cont.getBoundingClientRect().width;
      titleWidth = 200; // baseWidth * 0.20;
      playerBarWidth = 399; // baseWidth * 0.395;
      volumeWidth = 120; // baseWidth * 0.12;

      $("#playerTitle").css("width", titleWidth);
      $("#playerProgressBase").css("width", playerBarWidth);
      $("#playerVolumeBase").css("width", volumeWidth);

      if(timebar) {
        timeMouseMove = function(e) {
          e.preventDefault();
          position = e.clientX - timebar.getBoundingClientRect().left;

          if(position < 0) {
            position = 0;
          } else if(position > timebar.offsetWidth) {
            position = timebar.offsetWidth;
          }

          if(progressTime) {
            progressTime.style.width = (position / timebar.offsetWidth * 100) + "%";
          }

          p.currentTime(position / timebar.offsetWidth * 100 * p.duration() / 100);
        };

        timeMouseDown = function(e) {

          if(e.button !== 0) {
            return;
          }

          position = e.clientX - timebar.getBoundingClientRect().left;

          e.preventDefault();
          seeking = true;
          playStateCache = !p.paused();
          p.pause();
          window.addEventListener("mouseup", timeMouseUp, false);
          window.addEventListener("mousemove", timeMouseMove, false);

          if(progressTime) {
            progressTime.style.width = (position / timebar.offsetWidth * 100) + "%";
          }

          p.currentTime(position / timebar.offsetWidth * 100 * p.duration() / 100);
        };

        timeMouseUp = function(e) {
          if(e.button !== 0) {
            return;
          }

          e.preventDefault();
          seeking = false;
          if(playStateCache) {
            p.play();
          }
          window.removeEventListener("mouseup", timeMouseUp, false);
          window.removeEventListener("mousemove", timeMouseMove, false);
        };

        timebar.addEventListener("mousedown", timeMouseDown, false);

        p.on("timeupdate", function() {
          var timeStamp = new Date(1970, 0, 1),
              time = p.currentTime(),
              seconds,
              width = (time / p.duration() * 100 * timebar.offsetWidth / 100);

          if(progressTime) {
            progressTime.style.width = (width / timebar.offsetWidth * 100) + "%";
          }
          timeStamp.setSeconds(Math.round(time));
          seconds = timeStamp.toTimeString().substr(3, 5);

          if(currentTimeDialog) {
            currentTimeDialog.innerHTML = seconds;
          }
        }, false);
      }

      if(muteButton) {
        muteButton.addEventListener("click", function(e) {
          if(e.button !== 0) {
            return;
          }
          p[p.muted() ? "unmute" : "mute"]();
        }, false);

        mutechange = function() {

          if(p.muted()) {
            muteButton.classList.remove("unmuted");
            muteButton.classList.add("muted");
          } else {
            muteButton.classList.add("unmuted");
            muteButton.classList.remove("muted");
          }
        };
        p.on("volumechange", mutechange);
        mutechange();
      }

      if(volume) {
        volumeMouseMove = function(e) {
          e.preventDefault();
          position = e.clientX - volume.getBoundingClientRect().left;

          if(position <= 0) {
            p.mute();
            position = 0;
          } else if(position > volume.offsetWidth) {
            position = volume.offsetWidth;
          } else if(p.muted()) {
            p.unmute();
          }

          if(volumeProgressBar) {
            volumeProgressBar.style.width = (position / volume.offsetWidth * 100) + "%";
          }
          p.volume(position / volume.offsetWidth);
        };

        volumeMouseUp = function(e) {

          if(e.button !== 0) {
            return;
          }

          e.preventDefault();
          window.removeEventListener("mouseup", volumeMouseUp, false);
          window.removeEventListener("mousemove", volumeMouseMove, false);
        };

        volumeMouseDown = function(e) {

          if(e.button !== 0) {
            return;
          }

          position = e.clientX - volume.getBoundingClientRect().left;

          e.preventDefault();
          window.addEventListener("mouseup", volumeMouseUp, false);
          window.addEventListener("mousemove", volumeMouseMove, false);

          if(position === 0) {
            p.mute();
          } else if(p.muted()) {
            p.unmute();
          }

          if(volumeProgressBar) {
            volumeProgressBar.style.width = (position / volume.offsetWidth * 100) + "%";
          }
          p.volume(position / volume.offsetWidth);
        };

        volume.addEventListener("mousedown", volumeMouseDown, false);

        var volumechange = function() {
          var width;

          if(p.muted()) {
            width = 0;
          } else {
            width = p.volume();
          }

          if(width === 0) {
            if(muteButton) {
              muteButton.classList.remove("unmuted");
              muteButton.classList.add("muted");
            }
          }

          if(volumeProgressBar) {
            volumeProgressBar.style.width = (width * 100) + "%";
          }
        };

        p.on("volumechange", volumechange);

        // fire to get and set initially volume slider position
        volumechange();
      }

      if(fullscreen) {
        fullscreen.addEventListener("click", function() {
          fullscreen.classList.toggle("full-screen");
          fullscreen.classList.toggle("normal-screen");
          videoContainer.classList.toggle("full-screen");
          videoContainer.classList.toggle("normal-screen");
          tocContainer.classList.toggle("normal-screen");
          tocContainer.classList.toggle("full-screen");
        }, false);
      }

      if(caption) {
        caption.addEventListener("click", function() {
          caption.classList.toggle("cc-off");
          caption.classList.toggle("cc-on");
        }, false);
      }

      togglePlay = function(e) {
        if(e.button !== 0) {
          return;
        }
        if(p.paused()) {
          p.play();
        } else {
          p.pause();
        }
      };

      p.media.addEventListener("click", togglePlay, false);

      if(playButton) {

        playButton.addEventListener("click", togglePlay, false);

        p.on("play", function() {
          playButton.classList.remove("paused");
          playButton.classList.add("playing");
        });

        p.on("pause", function() {
          playButton.classList.add("paused");
          playButton.classList.remove("playing");
        });
      }

      p.on("ended", function() {
        playButton.classList.add("paused");
        playButton.classList.remove("playing");
      });
    };

    if(p.readyState() >= 1) {

      ready();
    } else {

      p.media.addEventListener("loadedmetadata", ready, false);
    }

    return this;
  }

  return Controls;
});
