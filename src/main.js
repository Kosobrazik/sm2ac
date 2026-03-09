import { createBitmapScoreRenderer } from "./bitmap-score.js";
import { parseMenuScript } from "./menu-parser.js";
import { getMenuItemScore } from "./score-store.js";
import { rememberPrintFrameForTargetScript } from "./print-store.js";

const BASE_W = 640;
const BASE_H = 480;
const MODE_TRANSITION_MS = 2000;
const MENU_MUSIC_VOLUME = 0.35;
const MENU_INTRO_VIDEO_SRC = "./assets/video/menu/mmintro.webm";
const STARTUP_INTRO_SEEN_KEY = "chp_startup_intros_seen_v1";
const STARTUP_LOGO_INTROS = [
  { src: "./assets/video/logos/marvel.webm", label: "publisher intro (Marvel)" },
  { src: "./assets/video/logos/activision.webm", label: "publisher intro (Activision)" },
  { src: "./assets/video/logos/awegames.webm", label: "developer intro (AWE Games)" },
  { src: "./assets/video/logos/legal.webm", label: "legal intro" },
  { src: "./assets/video/logos/spider-man2.webm", label: "Spider-Man 2 intro" },
];

const menuEl = document.getElementById("menu");
const gameHostEl = document.getElementById("gameHost");
const gameCursorEl = document.getElementById("gameCursor");
const logEl = document.getElementById("log");
const hoverSfx = document.getElementById("hoverSfx");
const clickSfx = document.getElementById("clickSfx");
const music = document.getElementById("music");
const menuIntroLayer = document.getElementById("menuIntroLayer");
const menuIntroVideo = document.getElementById("menuIntroVideo");
const menuIntroPrompt = document.getElementById("menuIntroPrompt");
const debugReplayIntroBtn = document.getElementById("debugReplayIntroBtn");
const externalExitIconBtn = document.getElementById("externalExitIconBtn");
const externalExitIconImg = document.getElementById("externalExitIconImg");
const externalExitBtn = document.getElementById("externalExitBtn");
const musicToggleBtn = document.getElementById("musicToggleBtn");

let activeIntroPromise = null;

const MODE_PRESENTATIONS = {
  "crawl.txt": {
    helpImage: "./assets/art/ui/help/help1crawl.bmp",
    introVoice: "./assets/sounds/crawl/wcsmintro.wav",
  },
  "crook.txt": {
    helpImage: "./assets/art/ui/help/help2crook.bmp",
    introVoice: "./assets/sounds/catchcrook/ccintro.wav",
  },
  "heist.txt": {
    helpImage: "./assets/art/ui/help/help3heist.bmp",
    introVoice: "./assets/sounds/jewel/dhsmintro.wav",
  },
  "lab101.txt": {
    helpImage: "./assets/art/ui/help/help4lab.bmp",
    introVoice: "./assets/sounds/labwork/lwppintro.wav",
  },
  "mugshot.txt": {
    helpImage: "./assets/art/ui/help/help5MugShot.bmp",
    introVoice: "./assets/sounds/mugshot/msppintro.wav",
  },
  "websling.txt": {
    helpImage: "./assets/art/ui/help/help6WebSling.bmp",
    introVoice: "./assets/sounds/webslinger/wssmintro.wav",
  },
  "ware.txt": {
    helpImage: "./assets/art/ui/help/help7Ware.bmp",
    introVoice: "./assets/sounds/warehouse/wismintro.wav",
  },
};

const MODE_ROUTES = {
  "crawl.txt": "./crawl.html",
  "crook.txt": "./mode.html?mode=crook",
  "heist.txt": "./mode.html?mode=heist",
  "lab101.txt": "./lab.html",
  "mugshot.txt": "./mugshot.html",
  "websling.txt": "./websling.html",
  "ware.txt": "./mode.html?mode=ware",
  "print.txt": "./print.html",
};

const SCRIPTED_HOVER_VOICE_OVERRIDES = {
  "sounds/menu/mmsm001.wav": "./assets/sounds/menu/mmsm001.wav",
  "sounds/menu/mmsm002.wav": "./assets/sounds/menu/mmsm002.wav",
  "sounds/menu/mmsm004.wav": "./assets/sounds/menu/mmsm004.wav",
  "sounds/menu/mmsm005.wav": "./assets/sounds/menu/mmsm005.wav",
  "sounds/menu/mmsm006.wav": "./assets/sounds/menu/mmsm006.wav",
  "sounds/menu/mmsm007.wav": "./assets/sounds/menu/mmsm007.wav",
  "sounds/menu/mmsm008.wav": "./assets/sounds/menu/mmsm008.wav",
  "sounds/menu/mmsm009.wav": "./assets/sounds/menu/mmsm009.wav",
};

function setLog(text) {
  logEl.textContent = text;
}

function playSafe(audioEl, volume = 1) {
  if (!audioEl) {
    return;
  }
  audioEl.currentTime = 0;
  audioEl.volume = volume;
  audioEl.play().catch(() => {});
}

function stopSafe(audioEl) {
  if (!audioEl) {
    return;
  }
  audioEl.pause();
  audioEl.currentTime = 0;
}

function normalizeRelativeAssetPath(relativePath) {
  if (!relativePath) {
    return null;
  }
  return relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function getHoverVoiceCandidates(item) {
  const scriptedPath = normalizeRelativeAssetPath(item.hoverVoice);
  const scriptedKey = scriptedPath?.toLowerCase() ?? null;

  if (scriptedKey && SCRIPTED_HOVER_VOICE_OVERRIDES[scriptedKey]) {
    return [SCRIPTED_HOVER_VOICE_OVERRIDES[scriptedKey]];
  }

  if (scriptedPath) {
    return [toAssetUrl(scriptedPath)];
  }

  return [];
}

function createMenuMusicController() {
  let pendingStart = false;
  let enabled = false;

  const isPlaying = () => !music.paused && !music.ended;

  const tryStart = () => {
    if (!pendingStart || !enabled) {
      return;
    }

    if (isPlaying()) {
      pendingStart = false;
      return;
    }

    music.volume = MENU_MUSIC_VOLUME;
    const playPromise = music.play();
    if (!playPromise || typeof playPromise.then !== "function") {
      pendingStart = false;
      return;
    }

    playPromise.then(() => {
      pendingStart = false;
    }).catch(() => {});
  };

  window.addEventListener("pointerdown", tryStart);
  window.addEventListener("keydown", tryStart);

  const requestStart = () => {
    if (!enabled) {
      return;
    }

    pendingStart = true;
    tryStart();
  };

  return {
    start() {
      enabled = true;
      requestStart();
    },
    resume() {
      requestStart();
    },
    stop() {
      pendingStart = false;
      enabled = false;
      music.pause();
      music.currentTime = 0;
    },
  };
}

function setupExternalMenuButtons() {
  const EXIT_ICON_BASE_SRC = "./assets/art/ui/exit.png";
  const EXIT_ICON_HOVER_SRC = "./assets/art/ui/exit_over.png";

  const setExitIconHover = (hovered) => {
    if (!externalExitIconImg) {
      return;
    }

    externalExitIconImg.src = hovered ? EXIT_ICON_HOVER_SRC : EXIT_ICON_BASE_SRC;
  };

  const triggerExit = () => {
    playSafe(clickSfx, 0.8);
    setLog("Original behavior: exit the game (ESC). In the web version this can open a confirmation screen.");
  };

  const bindExitHover = (el) => {
    if (!el) {
      return;
    }

    el.addEventListener("pointerenter", () => {
      playSafe(hoverSfx, 0.6);
      setExitIconHover(true);
    });

    el.addEventListener("pointerleave", () => {
      setExitIconHover(false);
    });

    el.addEventListener("click", triggerExit);
  };

  bindExitHover(externalExitIconBtn);
  bindExitHover(externalExitBtn);

  if (!musicToggleBtn) {
    return;
  }

  const syncMusicToggle = () => {
    const isMuted = Boolean(music.muted);
    musicToggleBtn.textContent = isMuted ? "Music: off" : "Music: on";
    musicToggleBtn.classList.toggle("is-muted", isMuted);
    musicToggleBtn.setAttribute("aria-pressed", String(isMuted));
  };

  musicToggleBtn.addEventListener("pointerenter", () => {
    playSafe(hoverSfx, 0.6);
  });

  musicToggleBtn.addEventListener("click", () => {
    playSafe(clickSfx, 0.8);
    music.muted = !music.muted;
    syncMusicToggle();
    setLog(music.muted ? "Menu music muted." : "Menu music unmuted.");
  });

  setExitIconHover(false);
  syncMusicToggle();
}
function setupMenuMusicRecovery(menuMusic) {
  if (!menuMusic) {
    return;
  }

  window.addEventListener("pageshow", () => {
    menuMusic.resume();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      menuMusic.resume();
    }
  });
}

function hasSeenStartupIntros() {
  try {
    return window.localStorage.getItem(STARTUP_INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markStartupIntrosSeen() {
  try {
    window.localStorage.setItem(STARTUP_INTRO_SEEN_KEY, "1");
  } catch {
    // Ignore storage write errors (private mode, blocked storage, etc.).
  }
}

function buildIntroQueue(shouldPlayStartupLogos) {
  const menuIntroClip = { src: MENU_INTRO_VIDEO_SRC, label: "main menu intro" };
  if (!shouldPlayStartupLogos) {
    return [menuIntroClip];
  }

  return [...STARTUP_LOGO_INTROS, menuIntroClip];
}

function playMenuIntro(clips = buildIntroQueue(false), { onClipStarted = null } = {}) {
  if (!menuIntroLayer || !menuIntroVideo || !menuIntroPrompt) {
    return Promise.resolve();
  }

  const queue = clips.filter((clip) => typeof clip?.src === "string" && clip.src.trim().length > 0);
  if (!queue.length) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let started = false;
    let finished = false;
    let currentClipIndex = 0;

    const getCurrentClip = () => queue[currentClipIndex];

    const showPrompt = (text, className) => {
      menuIntroPrompt.textContent = text;
      menuIntroLayer.classList.remove("needs-gesture", "is-skippable");
      if (className) {
        menuIntroLayer.classList.add(className);
      }
    };

    const cleanup = () => {
      menuIntroLayer.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      menuIntroVideo.removeEventListener("ended", finishCurrentClip);
      menuIntroVideo.removeEventListener("error", finishCurrentClip);
      menuIntroVideo.removeEventListener("playing", markStarted);
    };

    const close = () => {
      menuIntroVideo.pause();
      menuIntroVideo.currentTime = 0;
      menuIntroLayer.classList.remove("is-visible", "needs-gesture", "is-skippable");
      resolve();
    };

    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;
      cleanup();
      close();
    };

    const markStarted = () => {
      if (started || finished) {
        return;
      }

      started = true;
      showPrompt("Click, Enter or Esc to skip intro", "is-skippable");
      const clip = getCurrentClip();
      const clipLabel = clip?.label ?? "intro";
      setLog(`Playing ${clipLabel}...`);
      if (typeof onClipStarted === "function") {
        onClipStarted(clip);
      }
    };

    const tryStart = () => {
      if (started || finished) {
        return;
      }

      const playPromise = menuIntroVideo.play();
      if (!playPromise || typeof playPromise.then !== "function") {
        markStarted();
        return;
      }

      playPromise.then(() => {
        markStarted();
      }).catch(() => {
        showPrompt("Click to start intro", "needs-gesture");
      });
    };

    const playCurrentClip = () => {
      started = false;
      const clip = getCurrentClip();
      if (!clip) {
        finish();
        return;
      }

      menuIntroVideo.pause();
      menuIntroVideo.src = clip.src;
      menuIntroVideo.currentTime = 0;
      menuIntroVideo.load();
      showPrompt("Launching intro...", "");
      tryStart();
    };

    const finishCurrentClip = () => {
      if (finished) {
        return;
      }

      if (currentClipIndex >= queue.length - 1) {
        finish();
        return;
      }

      currentClipIndex += 1;
      playCurrentClip();
    };

    const onPointerDown = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!started) {
        tryStart();
        return;
      }
      finishCurrentClip();
    };

    const onKeyDown = (ev) => {
      if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Escape") {
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();
      if (!started) {
        tryStart();
        return;
      }
      finishCurrentClip();
    };

    menuIntroLayer.classList.add("is-visible");
    menuIntroLayer.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    menuIntroVideo.addEventListener("ended", finishCurrentClip);
    menuIntroVideo.addEventListener("error", finishCurrentClip);
    menuIntroVideo.addEventListener("playing", markStarted);

    playCurrentClip();
  });
}

function launchIntroSequence({ withStartupLogos = false, markSeen = false, onClipStarted = null } = {}) {
  if (activeIntroPromise) {
    return activeIntroPromise;
  }

  setLog(withStartupLogos ? "Launching publisher/developer intros..." : "Launching main menu intro...");

  const introQueue = buildIntroQueue(withStartupLogos);
  activeIntroPromise = playMenuIntro(introQueue, { onClipStarted }).then(() => {
    if (markSeen) {
      markStartupIntrosSeen();
    }
  }).finally(() => {
    activeIntroPromise = null;
  });

  return activeIntroPromise;
}

function setupDebugReplayIntroButton(menuMusic) {
  if (!debugReplayIntroBtn || !menuMusic) {
    return;
  }

  let replayInProgress = false;

  const setBusyState = (isBusy) => {
    debugReplayIntroBtn.disabled = isBusy;
    debugReplayIntroBtn.textContent = isBusy ? "INTRO..." : "INTRO";
  };

  debugReplayIntroBtn.addEventListener("click", async () => {
    if (replayInProgress || activeIntroPromise) {
      return;
    }

    replayInProgress = true;
    setBusyState(true);
    menuMusic.stop();

    try {
      await launchIntroSequence({
        withStartupLogos: true,
        markSeen: false,
        onClipStarted: (clip) => {
          if (clip?.src === MENU_INTRO_VIDEO_SRC) {
            menuMusic.start();
          }
        },
      });
    } finally {
      setBusyState(false);
      replayInProgress = false;
    }
  });
}

function toAssetUrl(relativePath) {
  return `./assets/${relativePath.replace(/^\/+/, "")}`;
}

function resolveOverlayPath(relativePath) {
  if (!relativePath) {
    return relativePath;
  }
  return relativePath.replace(/\.bmp$/i, ".png");
}

function toPopupVideoPath(binkPath) {
  if (!binkPath) {
    return null;
  }
  const normalized = binkPath.replace(/\\/g, "/");
  const file = normalized.split("/").pop();
  if (!file) {
    return null;
  }
  const base = file.replace(/\.bik$/i, "").toLowerCase();
  return `video/menu_popups/${base}.webm`;
}

function toNameBinkVideoPath(binkPath) {
  if (!binkPath) {
    return null;
  }
  const normalized = binkPath.replace(/\\/g, "/");
  const file = normalized.split("/").pop();
  if (!file) {
    return null;
  }
  const base = file.replace(/\.bik$/i, "").toLowerCase();
  return `video/namebink/${base}.webm`;
}

function setupCustomCursor() {
  const move = (ev) => {
    const rect = gameHostEl.getBoundingClientRect();
    gameCursorEl.style.left = `${ev.clientX - rect.left}px`;
    gameCursorEl.style.top = `${ev.clientY - rect.top}px`;
  };

  gameHostEl.addEventListener("pointerenter", () => {
    gameCursorEl.style.display = "block";
  });

  gameHostEl.addEventListener("pointerleave", () => {
    gameCursorEl.style.display = "none";
  });

  gameHostEl.addEventListener("pointermove", move);
}

function ensureScale() {
  const scale = Math.min(gameHostEl.clientWidth / BASE_W, gameHostEl.clientHeight / BASE_H);
  menuEl.style.width = `${BASE_W}px`;
  menuEl.style.height = `${BASE_H}px`;
  menuEl.style.transform = `scale(${scale})`;
}

function createBackground() {
  const bg = document.createElement("img");
  bg.className = "bg";
  bg.src = "./assets/art/menu/background.bmp";
  menuEl.appendChild(bg);
}

function createStaticUI() {
  const scoreTitle = document.createElement("div");
  scoreTitle.className = "score-title";
  scoreTitle.textContent = "\u0421\u0427\u0415\u0422";
  menuEl.appendChild(scoreTitle);

  const scoreTitleArt = document.createElement("img");
  scoreTitleArt.className = "score-title-art";
  scoreTitleArt.src = "./assets/art/ui/score_ru.png";
  scoreTitleArt.alt = "";
  scoreTitleArt.draggable = false;
  scoreTitleArt.style.display = "none";
  scoreTitleArt.addEventListener("load", () => {
    scoreTitleArt.style.display = "block";
    scoreTitle.classList.add("bitmap-score-fallback-hidden");
  }, { once: true });
  menuEl.appendChild(scoreTitleArt);

  const scoreValue = document.createElement("div");
  scoreValue.className = "score-value";
  scoreValue.textContent = "0";
  menuEl.appendChild(scoreValue);

  const scoreValueBitmap = document.createElement("div");
  scoreValueBitmap.className = "score-value-bitmap bitmap-score";
  scoreValueBitmap.style.display = "none";
  menuEl.appendChild(scoreValueBitmap);

  // Keep the text score in place as a fallback until the DAT font is ready.
  const scoreRenderer = createBitmapScoreRenderer({
    container: scoreValueBitmap,
    fallbackEl: scoreValue,
  });

  const nameBink = document.createElement("video");
  nameBink.className = "overlay";
  nameBink.muted = true;
  nameBink.loop = true;
  nameBink.playsInline = true;
  nameBink.preload = "auto";
  nameBink.style.zIndex = "24";
  menuEl.appendChild(nameBink);

  const helpLayer = document.createElement("div");
  helpLayer.className = "help-layer";

  const helpImage = document.createElement("img");
  helpImage.className = "help-image";

  const helpPlay = document.createElement("img");
  helpPlay.className = "help-play";
  helpPlay.src = "./assets/art/ui/help/playover.bmp";

  helpLayer.appendChild(helpImage);
  helpLayer.appendChild(helpPlay);
  menuEl.appendChild(helpLayer);

  const transitionLayer = document.createElement("div");
  transitionLayer.className = "mode-transition";

  const leftTransitionRect = document.createElement("div");
  leftTransitionRect.className = "mode-transition-rect left";

  const rightTransitionRect = document.createElement("div");
  rightTransitionRect.className = "mode-transition-rect right";

  transitionLayer.appendChild(leftTransitionRect);
  transitionLayer.appendChild(rightTransitionRect);
  menuEl.appendChild(transitionLayer);

  let presentationOpen = false;
  let introVoice = null;
  const hoverVoice = new Audio();
  hoverVoice.preload = "auto";
  let savedMusicVolume = null;
  let transitionPromise = null;
  let hoverVoiceRequestId = 0;

  const closePresentation = () => {
    presentationOpen = false;
    helpLayer.style.display = "none";
    hoverVoiceRequestId += 1;
    stopSafe(hoverVoice);
    stopSafe(introVoice);
    introVoice = null;
    if (savedMusicVolume !== null) {
      music.volume = savedMusicVolume;
      savedMusicVolume = null;
    }
  };

  return {
    setScore(value) {
      scoreValue.textContent = String(value);
      scoreRenderer.setValue(value);
    },
    showNameBink(item) {
      const path = toNameBinkVideoPath(item.nameBink);
      if (!path || !item.nameBinkPosition) {
        this.hideNameBink();
        return;
      }

      const nextSrc = toAssetUrl(path);
      if (nameBink.dataset.src !== nextSrc) {
        nameBink.src = nextSrc;
        nameBink.dataset.src = nextSrc;
      }

      nameBink.style.left = `${item.nameBinkPosition.x}px`;
      nameBink.style.top = `${item.nameBinkPosition.y}px`;
      nameBink.style.display = "block";
      nameBink.currentTime = 0;
      nameBink.play().catch(() => {});
    },
    hideNameBink() {
      nameBink.pause();
      nameBink.style.display = "none";
    },
    playHoverVoice(item) {
      const candidates = getHoverVoiceCandidates(item);
      if (!candidates.length) {
        this.stopHoverVoice();
        return;
      }

      const requestId = ++hoverVoiceRequestId;
      stopSafe(hoverVoice);

      const tryPlay = (index) => {
        if (requestId !== hoverVoiceRequestId || index >= candidates.length) {
          return;
        }

        const nextSrc = candidates[index];
        if (hoverVoice.dataset.src !== nextSrc) {
          hoverVoice.src = nextSrc;
          hoverVoice.dataset.src = nextSrc;
        }

        hoverVoice.volume = 1;
        hoverVoice.currentTime = 0;
        hoverVoice.play().catch(() => {
          tryPlay(index + 1);
        });
      };

      tryPlay(0);
    },
    stopHoverVoice() {
      hoverVoiceRequestId += 1;
      stopSafe(hoverVoice);
    },
    isPresentationOpen() {
      return presentationOpen;
    },
    isTransitionActive() {
      return Boolean(transitionPromise);
    },
    playModeTransition() {
      if (transitionPromise) {
        return transitionPromise;
      }

      transitionLayer.classList.remove("is-active");
      transitionLayer.style.display = "block";
      gameCursorEl.style.display = "none";
      music.volume = Math.min(music.volume, 0.08);

      transitionPromise = new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            transitionLayer.classList.add("is-active");
          });
        });

        window.setTimeout(resolve, MODE_TRANSITION_MS);
      });

      return transitionPromise;
    },
    resetModeTransition() {
      transitionLayer.classList.remove("is-active");
      transitionLayer.style.display = "none";
      transitionPromise = null;
    },
    async showModePresentation(item) {
      const cfg = MODE_PRESENTATIONS[item.targetScript];
      if (!cfg || presentationOpen) {
        return;
      }

      presentationOpen = true;
      helpImage.src = cfg.helpImage;
      helpLayer.style.display = "block";
      transitionLayer.classList.remove("is-active");
      transitionLayer.style.display = "none";
      transitionPromise = null;

      if (savedMusicVolume === null) {
        savedMusicVolume = music.volume;
        music.volume = Math.max(0.06, savedMusicVolume * 0.3);
      }

      stopSafe(introVoice);
      introVoice = new Audio(cfg.introVoice);
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
          closePresentation();
          resolve();
        };

        const onKey = (ev) => {
          if (ev.key === "Enter" || ev.key === " " || ev.key === "Escape") {
            finish(ev);
          }
        };

        const onOverlay = (ev) => {
          if (ev.target === helpLayer || ev.target === helpImage) {
            finish(ev);
          }
        };

        const cleanup = () => {
          helpPlay.removeEventListener("click", finish);
          helpLayer.removeEventListener("click", onOverlay);
          window.removeEventListener("keydown", onKey);
        };

        helpPlay.addEventListener("click", finish);
        helpLayer.addEventListener("click", onOverlay);
        window.addEventListener("keydown", onKey);
      });
    },
  };
}

function createPopupPlayer() {
  const popup = document.createElement("video");
  popup.className = "overlay";
  popup.volume = 0.75;
  popup.loop = true;
  popup.playsInline = true;
  popup.preload = "auto";
  popup.width = 200;
  popup.height = 150;
  popup.style.zIndex = "12";
  menuEl.appendChild(popup);

  let audioUnlocked = false;
  window.addEventListener("pointerdown", () => {
    audioUnlocked = true;
  });

  return {
    show(item) {
      const videoPath = toPopupVideoPath(item.popupBink);
      if (!videoPath || !item.popupPosition) {
        this.hide();
        return;
      }

      const nextSrc = toAssetUrl(videoPath);
      if (popup.dataset.src !== nextSrc) {
        popup.src = nextSrc;
        popup.dataset.src = nextSrc;
      }

      popup.style.left = `${item.popupPosition.x}px`;
      popup.style.top = `${item.popupPosition.y}px`;
      popup.style.display = "block";
      popup.currentTime = 0;
      popup.muted = !audioUnlocked;

      popup.play().catch(() => {
        popup.muted = true;
        popup.play().catch(() => {});
      });
    },
    hide() {
      popup.pause();
      popup.style.display = "none";
    },
  };
}

function createMenuItem(item, popupPlayer, ui) {
  let base = null;
  if (item.base) {
    base = document.createElement("img");
    base.className = "overlay";
    base.src = toAssetUrl(resolveOverlayPath(item.base));
    base.style.left = `${item.position.x}px`;
    base.style.top = `${item.position.y}px`;
    base.style.display = "block";
  }

  const overlay = document.createElement("img");
  overlay.className = "overlay";
  overlay.style.left = `${item.position.x}px`;
  overlay.style.top = `${item.position.y}px`;

  if (item.overlay) {
    overlay.src = toAssetUrl(resolveOverlayPath(item.overlay));
  }

  const hit = document.createElement("div");
  hit.className = "hit";

  const placeHitboxFromImage = () => {
    if (item.hotspot) {
      hit.style.left = `${item.position.x + item.hotspot.ox}px`;
      hit.style.top = `${item.position.y + item.hotspot.oy}px`;
      hit.style.width = `${item.hotspot.w}px`;
      hit.style.height = `${item.hotspot.h}px`;
      return;
    }

    const w = overlay.naturalWidth || base?.naturalWidth || 72;
    const h = overlay.naturalHeight || base?.naturalHeight || 72;
    hit.style.left = `${item.position.x}px`;
    hit.style.top = `${item.position.y}px`;
    hit.style.width = `${w}px`;
    hit.style.height = `${h}px`;
  };

  overlay.addEventListener("load", placeHitboxFromImage);
  overlay.addEventListener("error", placeHitboxFromImage);
  if (base) {
    base.addEventListener("load", placeHitboxFromImage);
    base.addEventListener("error", placeHitboxFromImage);
  }

  hit.addEventListener("pointerenter", () => {
    if (ui.isPresentationOpen() || ui.isTransitionActive()) {
      return;
    }
    overlay.style.display = item.overlay ? "block" : "none";
    popupPlayer.show(item);
    ui.showNameBink(item);
    ui.setScore(getMenuItemScore(item));
    playSafe(hoverSfx, 0.6);
    ui.playHoverVoice(item);
    setLog(`Selected mode: ${item.label}`);
  });

  hit.addEventListener("pointerleave", () => {
    if (ui.isPresentationOpen() || ui.isTransitionActive()) {
      return;
    }
    overlay.style.display = "none";
    popupPlayer.hide();
    ui.hideNameBink();
    ui.stopHoverVoice();
    ui.setScore(0);
    setLog("Move the cursor over a city hotspot.");
  });

  hit.addEventListener("click", async () => {
    if (ui.isPresentationOpen() || ui.isTransitionActive()) {
      return;
    }

    playSafe(clickSfx, 0.8);
    overlay.style.display = "none";
    popupPlayer.hide();
    ui.hideNameBink();
    ui.stopHoverVoice();
    ui.setScore(0);

    const hasPresentation = Boolean(MODE_PRESENTATIONS[item.targetScript]);
    if (hasPresentation) {
      setLog(`Opening mode: ${item.label}`);
      await ui.playModeTransition();
      setLog(`Mode briefing: ${item.label}`);
      await ui.showModePresentation(item);
    }

    const route = MODE_ROUTES[item.targetScript];
    if (route) {
      rememberPrintFrameForTargetScript(item.targetScript);
      if (item.targetScript === "mugshot.txt") {
        sessionStorage.setItem("chp_skip_mugshot_help", "1");
      }

      if (item.targetScript === "lab101.txt") {
        sessionStorage.setItem("chp_skip_lab_help", "1");
      }

      if (item.targetScript === "crawl.txt") {
        sessionStorage.setItem("chp_skip_mode_help", "crawl");
      }

      if (item.targetScript === "websling.txt") {
        sessionStorage.setItem("chp_skip_mode_help", "websling");
      }

      const genericModeMatch = route.match(/[?&]mode=([^&]+)/i);
      if (genericModeMatch) {
        sessionStorage.setItem("chp_skip_mode_help", genericModeMatch[1].toLowerCase());
      }

      window.location.href = route;
      return;
    }

    if (hasPresentation) {
      ui.resetModeTransition();
    }

    if (item.targetScript === "exit") {
      setLog("Original behavior: exit the game (ESC). In the web version this can open a confirmation screen.");
      return;
    }

    setLog(`Opening minigame: ${item.targetScript}. Next step: connect this scene loader.`);
  });

  if (base) {
    menuEl.appendChild(base);
  }
  menuEl.appendChild(overlay);
  menuEl.appendChild(hit);
}

async function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCustomCursor();

  const menuMusic = createMenuMusicController();
  setupMenuMusicRecovery(menuMusic);
  createBackground();

  const ui = createStaticUI();
  ui.setScore(0);

  const shouldPlayStartupLogos = !hasSeenStartupIntros();
  const introPromise = launchIntroSequence({
    withStartupLogos: shouldPlayStartupLogos,
    markSeen: shouldPlayStartupLogos,
    onClipStarted: (clip) => {
      if (clip?.src === MENU_INTRO_VIDEO_SRC) {
        menuMusic.start();
      }
    },
  });

  setupDebugReplayIntroButton(menuMusic);
  setupExternalMenuButtons();
  const res = await fetch("./assets/scripts/menu.txt");
  const txt = await res.text();
  const data = parseMenuScript(txt);
  const popupPlayer = createPopupPlayer();

  const items = data.items.filter((item) => item.overlay || item.id === "quit");
  for (const item of items) {
    createMenuItem(item, popupPlayer, ui);
  }

  await introPromise;
  setLog(`Menu ready: loaded ${items.length} interactive zones from menu.txt.`);
}

boot().catch((err) => {
  console.error(err);
  setLog(`Launch error: ${err.message}`);
});





















