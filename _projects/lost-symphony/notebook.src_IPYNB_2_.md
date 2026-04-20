---
layout: pso-game
title: The Lost Symphony
description: A world-based orchestra adventure layout for the Poway Symphony Orchestra.
permalink: /games/lost-symphony
hide: True
toc: False
---

<section class="pso-game-stage">
  <article class="pso-game-hero">
    <p class="pso-game-kicker">Poway Symphony Orchestra Game</p>
    <h1>The Lost Symphony</h1>
    <p class="pso-game-lead">
      Enter the concert hall, travel through each orchestra section world, and restore the full ensemble in a story-driven Poway Symphony Orchestra adventure.
    </p>
    <div class="pso-game-facts">
      <span>Grand Concert Hall Hub</span>
      <span>4 Section Worlds</span>
      <span>Battle Of The Sections</span>
      <span>Final Concert Unlock</span>
    </div>
  </article>

  <section class="pso-game-panel">
<div class="pso-game-runner" id="pso-lost-symphony-runner">
  <div class="pso-game-runner-bar">
    <div class="pso-game-runner-copy">
      <strong>Embedded Game Runner</strong>
      <span>Press play to begin concert night from the opening scene.</span>
    </div>
    <div class="pso-game-runner-actions">
      <button type="button" data-ls-play>Play Intro</button>
      <button type="button" data-ls-pause disabled>Pause</button>
      <button type="button" data-ls-fullscreen disabled>Fullscreen</button>
    </div>
    <span class="pso-game-runner-status" data-ls-status>Ready</span>
  </div>
  <div class="pso-game-runner-stage">
    <div class="pso-game-runner-overlay is-visible" data-ls-overlay>
      <div class="pso-game-runner-overlay-card">
        <strong>The Lost Symphony</strong>
        <p>Launch the game runner to start from the opening cutscene and step into the concert hall.</p>
      </div>
    </div>
    <div id="pso-lost-symphony-root" class="pso-lost-symphony-canvas"></div>
  </div>
</div>
</section>
</section><script type="module">
import { mountLostSymphonyGame } from "/assets/js/projects/lost-symphony/levels/LostSymphonyGame.js?v=20260420a";

const runner = document.getElementById("pso-lost-symphony-runner");

if (runner) {
  const gameRoot = document.getElementById("pso-lost-symphony-root");
  const gameStage = runner.querySelector(".pso-game-runner-stage");
  const playButton = runner.querySelector("[data-ls-play]");
  const pauseButton = runner.querySelector("[data-ls-pause]");
  const fullscreenButton = runner.querySelector("[data-ls-fullscreen]");
  const statusNode = runner.querySelector("[data-ls-status]");
  const overlay = runner.querySelector("[data-ls-overlay]");
  const overlayTitle = overlay.querySelector("strong");
  const overlayCopy = overlay.querySelector("p");

  let activeGame = null;
  let isPaused = false;

  function applyFullscreenState(isStageFullscreen) {
    runner.classList.toggle("is-fullscreen", isStageFullscreen);
    document.body.classList.toggle("pso-lost-symphony-fullscreen", isStageFullscreen);
    fullscreenButton.textContent = isStageFullscreen ? "Exit Fullscreen" : "Fullscreen";
  }

  function updateFullscreenState() {
    const activeFullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    applyFullscreenState(activeFullscreenElement === gameStage);
  }

  function setStatus(text) {
    statusNode.textContent = text;
  }

  function setOverlay(mode) {
    if (mode === "idle") {
      overlay.classList.add("is-visible");
      overlayTitle.textContent = "The Lost Symphony";
      overlayCopy.textContent = "Launch the game runner to start from the opening cutscene and step into the concert hall.";
      return;
    }

    if (mode === "paused") {
      overlay.classList.add("is-visible");
      overlayTitle.textContent = "Game Paused";
      overlayCopy.textContent = "Press Pause again to resume exactly where you left off.";
      return;
    }

    overlay.classList.remove("is-visible");
  }

  function startFreshGame() {
    gameRoot.replaceChildren();
    activeGame = mountLostSymphonyGame(gameRoot, { forceFreshStart: true });
    isPaused = false;
    runner.classList.remove("is-paused");
    pauseButton.disabled = false;
    fullscreenButton.disabled = false;
    pauseButton.textContent = "Pause";
    setOverlay(null);
    setStatus("Running");
  }

  function togglePause() {
    if (!activeGame) return;

    isPaused = !isPaused;
    runner.classList.toggle("is-paused", isPaused);
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    setOverlay(isPaused ? "paused" : null);
    setStatus(isPaused ? "Paused" : "Running");
  }

  async function toggleFullscreen() {
    if (!gameStage) return;

    const activeFullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    const requestFullscreen = gameStage.requestFullscreen?.bind(gameStage)
      || gameStage.webkitRequestFullscreen?.bind(gameStage);
    const exitFullscreen = document.exitFullscreen?.bind(document)
      || document.webkitExitFullscreen?.bind(document);

    if (activeFullscreenElement !== gameStage) {
      applyFullscreenState(true);

      if (requestFullscreen) {
        try {
          await requestFullscreen();
        } catch (error) {
          applyFullscreenState(false);
          throw error;
        }
      }

      return;
    }

    if (activeFullscreenElement === gameStage) {
      if (exitFullscreen) {
        await exitFullscreen();
      }

      applyFullscreenState(false);
    }
  }

  playButton.addEventListener("click", startFreshGame);
  pauseButton.addEventListener("click", togglePause);
  fullscreenButton.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", updateFullscreenState);
  document.addEventListener("webkitfullscreenchange", updateFullscreenState);

  setOverlay("idle");
  updateFullscreenState();
  setStatus("Ready");
}
</script>