const BASE_W = 640;
const BASE_H = 480;
const SKIP_HELP_KEY = "chp_skip_mode_help";

const MODE_CONFIG = {
  crawl: {
    title: "Wall Crawler",
    background: "./legacy/art/wallcrawl/blda.bmp",
    helpImage: "./assets/art/ui/help/help1crawl.bmp",
    introVoice: "./assets/sounds/crawl/wcsmintro.wav",
  },
  crook: {
    title: "Catch the Crook",
    background: "./legacy/art/catchcrook/bank.bmp",
    helpImage: "./assets/art/ui/help/help2crook.bmp",
    introVoice: "./assets/sounds/catchcrook/ccintro.wav",
  },
  heist: {
    title: "Cafe Attack",
    background: "./legacy/art/jewel/background.bmp",
    helpImage: "./assets/art/ui/help/help3heist.bmp",
    introVoice: "./assets/sounds/jewel/dhsmintro.wav",
  },
  lab101: {
    title: "Lab Work 101",
    background: "./legacy/art/lab/backgrounds/backgroundl3.bmp",
    helpImage: "./assets/art/ui/help/help4lab.bmp",
    introVoice: "./assets/sounds/labwork/lwppintro.wav",
  },
  websling: {
    title: "Web Slinger",
    background: "./legacy/art/webslinger/background.bmp",
    helpImage: "./assets/art/ui/help/help6WebSling.bmp",
    introVoice: "./assets/sounds/webslinger/wssmintro.wav",
  },
  ware: {
    title: "Warehouse Infiltration",
    background: "./legacy/art/ware/bkgnds/whbk2.bmp",
    helpImage: "./assets/art/ui/help/help7Ware.bmp",
    introVoice: "./assets/sounds/warehouse/wismintro.wav",
  },
};

const params = new URLSearchParams(window.location.search);
const modeKey = (params.get("mode") || "").toLowerCase();
const mode = MODE_CONFIG[modeKey] ?? null;

const wrap = document.getElementById("gameWrap");
const root = document.getElementById("root");
const cursor = document.getElementById("cursor");
const modeBackground = document.getElementById("modeBackground");
const introOverlay = document.getElementById("introOverlay");
const introImage = document.getElementById("introImage");
const introContinue = document.getElementById("introContinue");
const pauseMenuOverlay = document.getElementById("pauseMenuOverlay");
const pauseResumeOverlay = document.getElementById("pauseResumeOverlay");
const pauseResumeHit = document.getElementById("pauseResumeHit");
const pauseRestartOverlay = document.getElementById("pauseRestartOverlay");
const pauseRestartHit = document.getElementById("pauseRestartHit");
const pauseHelpOverlay = document.getElementById("pauseHelpOverlay");
const pauseHelpHit = document.getElementById("pauseHelpHit");
const pauseMainMenuOverlay = document.getElementById("pauseMainMenuOverlay");
const pauseMainMenuHit = document.getElementById("pauseMainMenuHit");
const pauseConfirmOverlay = document.getElementById("pauseConfirmOverlay");
const pauseConfirmYesOverlay = document.getElementById("pauseConfirmYesOverlay");
const pauseConfirmYesHit = document.getElementById("pauseConfirmYesHit");
const pauseConfirmNoOverlay = document.getElementById("pauseConfirmNoOverlay");
const pauseConfirmNoHit = document.getElementById("pauseConfirmNoHit");

const audio = {
  hover: new Audio("./assets/sounds/moclick001.wav"),
  click: new Audio("./assets/sounds/click001.wav"),
};

const state = {
  introScreenActive: false,
  pauseMenuOpen: false,
  confirmExitOpen: false,
};

function playSound(aud, volume = 1) {
  if (!aud) {
    return;
  }
  aud.pause();
  aud.currentTime = 0;
  aud.volume = volume;
  aud.play().catch(() => {});
}

function stopSound(aud) {
  if (!aud) {
    return;
  }
  aud.pause();
  aud.currentTime = 0;
}

function ensureScale() {
  const scale = Math.min(wrap.clientWidth / BASE_W, wrap.clientHeight / BASE_H);
  root.style.transform = `scale(${scale})`;
}

function setupCursor() {
  wrap.addEventListener("pointerenter", () => {
    cursor.style.display = "block";
  });

  wrap.addEventListener("pointerleave", () => {
    cursor.style.display = "none";
  });

  wrap.addEventListener("pointermove", (ev) => {
    const rect = wrap.getBoundingClientRect();
    cursor.style.left = `${ev.clientX - rect.left}px`;
    cursor.style.top = `${ev.clientY - rect.top}px`;
  });
}

function hidePauseMenuHighlights() {
  pauseResumeOverlay.classList.add("hidden");
  pauseRestartOverlay.classList.add("hidden");
  pauseHelpOverlay.classList.add("hidden");
  pauseMainMenuOverlay.classList.add("hidden");
}

function hidePauseConfirmHighlights() {
  pauseConfirmYesOverlay.classList.add("hidden");
  pauseConfirmNoOverlay.classList.add("hidden");
}

function closePauseMenu() {
  hidePauseMenuHighlights();
  pauseMenuOverlay.classList.add("hidden");
  state.pauseMenuOpen = false;
}

function closeConfirmOverlay() {
  hidePauseConfirmHighlights();
  pauseConfirmOverlay.classList.add("hidden");
  state.confirmExitOpen = false;
}

function closeAllOverlays() {
  closePauseMenu();
  closeConfirmOverlay();
}

function openPauseMenu() {
  if (state.introScreenActive || state.pauseMenuOpen || state.confirmExitOpen) {
    return;
  }

  closeConfirmOverlay();
  hidePauseMenuHighlights();
  pauseMenuOverlay.classList.remove("hidden");
  state.pauseMenuOpen = true;
  playSound(audio.click, 0.9);
}

function openConfirmOverlay() {
  if (!state.pauseMenuOpen) {
    return;
  }

  playSound(audio.click, 0.9);
  closePauseMenu();
  hidePauseConfirmHighlights();
  pauseConfirmOverlay.classList.remove("hidden");
  state.confirmExitOpen = true;
}

function bindOverlayButton(hitEl, overlayEl, isActive, onClick) {
  const show = () => {
    if (!isActive()) {
      return;
    }
    overlayEl.classList.remove("hidden");
    playSound(audio.hover, 0.6);
  };

  const hide = () => {
    overlayEl.classList.add("hidden");
  };

  hitEl.addEventListener("pointerenter", show);
  hitEl.addEventListener("focus", show);
  hitEl.addEventListener("pointerleave", hide);
  hitEl.addEventListener("blur", hide);
  hitEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!isActive()) {
      return;
    }
    onClick();
  });
}

function bindPauseOverlayButtons() {
  [pauseMenuOverlay, pauseConfirmOverlay].forEach((el) => {
    el.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
    });
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
    });
  });

  bindOverlayButton(pauseResumeHit, pauseResumeOverlay, () => state.pauseMenuOpen, () => {
    playSound(audio.click, 0.9);
    closePauseMenu();
  });

  bindOverlayButton(pauseRestartHit, pauseRestartOverlay, () => state.pauseMenuOpen, () => {
    playSound(audio.click, 0.9);
    sessionStorage.removeItem(SKIP_HELP_KEY);
    window.location.href = `./mode.html?mode=${modeKey}`;
  });

  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseMenuOpen, () => {
    playSound(audio.click, 0.9);
    closePauseMenu();
    showIntroScreen({ playCloseClick: true, allowEscape: false }).catch(() => {});
  });

  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseMenuOpen, openConfirmOverlay);

  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmExitOpen, () => {
    playSound(audio.click, 0.9);
    sessionStorage.removeItem(SKIP_HELP_KEY);
    window.location.href = "./index.html";
  });

  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmExitOpen, () => {
    playSound(audio.click, 0.9);
    closeConfirmOverlay();
  });
}

async function showIntroScreen(options = {}) {
  const { playCloseClick = false, allowEscape = true } = options;

  if (!mode || state.introScreenActive) {
    return;
  }

  state.introScreenActive = true;
  introImage.src = mode.helpImage;
  introOverlay.classList.remove("hidden");
  introOverlay.classList.remove("fade-out");

  const introVoice = new Audio(mode.introVoice);
  introVoice.volume = 1;
  introVoice.play().catch(() => {});

  await new Promise((resolve) => {
    let done = false;

    const finish = (ev) => {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      if (done) {
        return;
      }
      done = true;

      cleanup();
      stopSound(introVoice);
      if (playCloseClick) {
        playSound(audio.click, 0.9);
      }
      introOverlay.classList.add("fade-out");

      window.setTimeout(() => {
        introOverlay.classList.add("hidden");
        introOverlay.classList.remove("fade-out");
        state.introScreenActive = false;
        resolve();
      }, 380);
    };

    const keyHandler = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        finish(ev);
        return;
      }
      if (allowEscape && ev.key === "Escape") {
        finish(ev);
      }
    };

    const cleanup = () => {
      introContinue.removeEventListener("click", finish);
      introOverlay.removeEventListener("click", finish);
      window.removeEventListener("keydown", keyHandler);
    };

    introContinue.addEventListener("click", finish);
    introOverlay.addEventListener("click", finish);
    window.addEventListener("keydown", keyHandler);
  });
}

function setupGlobalKeys() {
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") {
      return;
    }

    if (state.introScreenActive) {
      return;
    }

    ev.preventDefault();

    if (state.pauseMenuOpen) {
      closePauseMenu();
      return;
    }

    if (state.confirmExitOpen) {
      closeConfirmOverlay();
      return;
    }

    openPauseMenu();
  });
}

function applyMode() {
  if (!mode) {
    window.location.replace("./index.html");
    return false;
  }

  document.title = mode.title;
  modeBackground.src = mode.background;
  modeBackground.alt = mode.title;
  introImage.src = mode.helpImage;

  modeBackground.addEventListener("error", () => {
    modeBackground.src = mode.helpImage;
  }, { once: true });

  return true;
}

async function boot() {
  if (!applyMode()) {
    return;
  }

  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCursor();
  bindPauseOverlayButtons();
  setupGlobalKeys();

  const shouldSkipIntroHelp = sessionStorage.getItem(SKIP_HELP_KEY) === modeKey;
  if (shouldSkipIntroHelp) {
    sessionStorage.removeItem(SKIP_HELP_KEY);
    return;
  }

  await showIntroScreen();
}

boot().catch((err) => {
  console.error(err);
  window.location.replace("./index.html");
});
