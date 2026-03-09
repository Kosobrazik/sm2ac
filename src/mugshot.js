import { createBitmapScoreRenderer } from "./bitmap-score.js";
import { getModeScore, recordModeScore } from "./score-store.js";

const BASE_W = 640;
const BASE_H = 480;
const FRAME_COUNT = 7;
const POINTS_PER_PART = 1750;
const MODE_SCORE_KEY = "mugshot";
const MAX_MISSES = 3;
const BOOK_BUTTON_SRC = "./assets/art/ui/book.png";
const BOOK_BUTTON_HOVER_SRC = "./assets/art/ui/bookover.png";
const MISS_FILL_SOURCES = [
  "",
  "./assets/art/global/miss302.png",
  "./assets/art/global/miss303.png",
  "./assets/art/global/miss304.png",
];

const MATCH_LOOP_DELAY_MS = 500;
const MATCH_TOTAL_MS = 4000;
const PLAY_DELAY_MS = 2000;
const POSTER_SHOW_DELAY_MS = 3200;
const POSTER_TOTAL_MS = 7000;
const MESSAGE_MS = 2900;
const SCENE_TIMEOUT_MS = {
  bank: 22000,
  ally: 22000,
  ware: 22000,
  shortbank: 12000,
  shortally: 12000,
  shortware: 12000,
  jailbirds: 26000,
};

const root = document.getElementById("root");
const wrap = document.getElementById("gameWrap");
const cursor = document.getElementById("cursor");
const introOverlay = document.getElementById("introOverlay");
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
const shouldSkipIntroHelp = sessionStorage.getItem("chp_skip_mugshot_help") === "1";

const art = "./assets/art/mugshot/crimecomputer";
const soundsBase = "./assets/sounds/mugshot";
const videosBase = "./assets/video/mugshot/binks";

const state = {
  crooks: [1, 2, 0],
  roundIndex: 0,
  badGuy: 1,
  score: 0,
  bestScore: 0,
  lives: 3,
  misses: 0,
  prevPartMatch: 0,
  controlsEnabled: false,
  hudVisible: false,
  busy: false,
  gameOver: false,
  currentScene: null,
  sceneSkippable: false,
  forceSceneEnd: null,
  posterVisible: false,
  posterSkipArmed: false,
  posterResolve: null,
  faceAnimTimer: null,
  faceAnimFrame: 0,
  centerTextTimer: null,
  playBlinkTimer: null,
  playBlinkOn: false,
  playBlinkSpeed: 680,
  matchBlinkTimer: null,
  matchBlinkOn: false,
  matchBlinkSpeed: 700,
  introScreenActive: false,
  introShown: false,
  paused: false,
  pauseMenuOpen: false,
  confirmExitOpen: false,
  pauseMediaSnapshot: [],
};

const partDefs = {
  eyes: {
    partPos: [167, 93],
    panelPos: [130, 278],
    checkPos: [150, 282],
    partZ: 21,
    partPrefix: "eyes",
    panelPrefix: "peyes",
    checkFile: "checkeyes.png",
    upBtn: { pos: [227, 270], base: "eyetop.png", hover: "eyetop_h.png" },
    downBtn: { pos: [224, 305], base: "eyebot.png", hover: "eyebot_h.png" },
    initialFrame: 1,
  },
  hair: {
    partPos: [140, 40],
    panelPos: [117, 365],
    checkPos: [138, 368],
    partZ: 20,
    partPrefix: "hair",
    panelPrefix: "phair",
    checkFile: "checkHair.png",
    upBtn: { pos: [214, 356], base: "hairtop.png", hover: "hairtop_h.png" },
    downBtn: { pos: [199, 401], base: "hairbot.png", hover: "hairbot_h.png" },
    initialFrame: 2,
  },
  nose: {
    partPos: [193, 109],
    panelPos: [429, 277],
    checkPos: [446, 283],
    partZ: 23,
    partPrefix: "nose",
    panelPrefix: "pnose",
    checkFile: "checkNose.png",
    upBtn: { pos: [381, 265], base: "nosetop.png", hover: "nosetop_h.png" },
    downBtn: { pos: [384, 309], base: "nosebot.png", hover: "nosebot_h.png" },
    initialFrame: 3,
  },
  mouth: {
    partPos: [140, 140],
    panelPos: [439, 362],
    checkPos: [459, 368],
    partZ: 22,
    partPrefix: "mouth",
    panelPrefix: "pmouth",
    checkFile: "checkmouth.png",
    upBtn: { pos: [388, 355], base: "mouthtop.png", hover: "mouthtop_h.png" },
    downBtn: { pos: [391, 404], base: "mouthbot.png", hover: "mouthbot_h.png" },
    initialFrame: 0,
  },
};

const parts = {};
const ui = {};

const audio = {
  hover: new Audio("./assets/sounds/moclick001.wav"),
  uiClick: new Audio("./assets/sounds/click001.wav"),
  roundover: new Audio(`${soundsBase}/roundover.wav`),
  arrow: new Audio(`${soundsBase}/arrowbtn.wav`),
  binkBtn: new Audio(`${soundsBase}/binkbtn.wav`),
  matchBtn: new Audio(`${soundsBase}/matchbtn.wav`),
  matchingLoop: new Audio(`${soundsBase}/matchingloop.wav`),
  mismatch: new Audio(`${soundsBase}/mismatch.wav`),
  partmatch: new Audio(`${soundsBase}/partmatch.wav`),
  match: new Audio(`${soundsBase}/match.wav`),
  caught: new Audio(`${soundsBase}/caught.wav`),
  policeAmbient: new Audio(`${soundsBase}/policeambient.wav`),
  intro: new Audio(`${soundsBase}/msppintro.wav`),
  peter1: new Audio(`${soundsBase}/mspp001.wav`),
  peter2: new Audio(`${soundsBase}/mspp002.wav`),
  peter3: new Audio(`${soundsBase}/mspp003.wav`),
  peter4: new Audio(`${soundsBase}/mspp004.wav`),
  lose: new Audio(`${soundsBase}/mspplose.wav`),
  win: new Audio(`${soundsBase}/msppwin.wav`),
};
audio.matchingLoop.loop = true;
audio.policeAmbient.loop = true;

const ambientState = {
  enabled: false,
  pendingStart: false,
};

const scheduledTasks = new Set();

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

function startScheduledTask(task) {
  if (!task.active || task.timerId !== null || state.paused) {
    return;
  }

  task.startedAt = performance.now();
  task.timerId = window.setTimeout(() => {
    task.timerId = null;
    if (!task.active) {
      return;
    }

    if (!task.repeat) {
      scheduledTasks.delete(task);
      task.active = false;
      task.callback();
      return;
    }

    task.callback();
    task.remaining = task.delayMs;
    startScheduledTask(task);
  }, task.remaining);
}

function createScheduledTask(callback, delayMs, repeat = false) {
  const safeDelay = Math.max(0, delayMs);
  const task = {
    callback,
    delayMs: safeDelay,
    remaining: safeDelay,
    repeat,
    active: true,
    timerId: null,
    startedAt: 0,
  };

  scheduledTasks.add(task);
  startScheduledTask(task);
  return task;
}

function scheduleTimeout(callback, delayMs) {
  return createScheduledTask(callback, delayMs, false);
}

function scheduleInterval(callback, delayMs) {
  return createScheduledTask(callback, delayMs, true);
}

function clearScheduledTask(task) {
  if (!task) {
    return;
  }

  task.active = false;
  if (task.timerId !== null) {
    clearTimeout(task.timerId);
    task.timerId = null;
  }
  scheduledTasks.delete(task);
}

function pauseScheduledTasks() {
  const now = performance.now();

  scheduledTasks.forEach((task) => {
    if (!task.active || task.timerId === null) {
      return;
    }

    clearTimeout(task.timerId);
    task.timerId = null;
    task.remaining = Math.max(0, task.remaining - (now - task.startedAt));
  });
}

function resumeScheduledTasks() {
  scheduledTasks.forEach((task) => {
    if (task.active && task.timerId === null) {
      startScheduledTask(task);
    }
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    scheduleTimeout(resolve, ms);
  });
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

function sprite(src, x, y, z = 10, className = "layer") {
  const el = document.createElement("img");
  el.className = className;
  el.src = src;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = String(z);
  root.appendChild(el);
  return el;
}

function video(src, x, y, z = 10, width = null, height = null) {
  const el = document.createElement("video");
  el.className = "layer";
  el.src = src;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = String(z);
  el.playsInline = true;
  if (width !== null) {
    el.width = width;
  }
  if (height !== null) {
    el.height = height;
  }
  root.appendChild(el);
  return el;
}

function framePath(prefix, frame) {
  const n = String(frame + 1).padStart(2, "0");
  return `${art}/headparts/${prefix}${n}.png`;
}

function panelPath(prefix, frame) {
  const n = String(frame + 1).padStart(2, "0");
  return `${art}/panels/${prefix}${n}.png`;
}

function facePath(frame) {
  const n = String(frame + 1).padStart(2, "0");
  return `${art}/heads/face${n}.png`;
}

function tryStartAmbient(options = {}) {
  const { restart = false } = options;

  if (!ambientState.enabled || state.gameOver || state.paused) {
    return;
  }

  if (restart) {
    audio.policeAmbient.pause();
    audio.policeAmbient.currentTime = 0;
  }

  audio.policeAmbient.volume = 0.55;
  const playPromise = audio.policeAmbient.play();
  if (!playPromise || typeof playPromise.then !== "function") {
    ambientState.pendingStart = false;
    return;
  }

  playPromise.then(() => {
    ambientState.pendingStart = false;
  }).catch(() => {
    ambientState.pendingStart = true;
  });
}

function sceneByBadGuy(badGuy) {
  if (badGuy === 1) return "bank";
  if (badGuy === 2) return "ally";
  return "ware";
}

function shortSceneByBadGuy(badGuy) {
  if (badGuy === 1) return "shortbank";
  if (badGuy === 2) return "shortally";
  return "shortware";
}

function posterByBadGuy(badGuy) {
  if (badGuy === 1) return ui.poster1;
  if (badGuy === 2) return ui.poster2;
  return ui.poster3;
}

function setAmbient(enabled) {
  ambientState.enabled = enabled && !state.gameOver;

  if (ambientState.enabled) {
    tryStartAmbient({ restart: true });
    return;
  }

  ambientState.pendingStart = false;
  stopSound(audio.policeAmbient);
}

function retryAmbientPlayback() {
  if (
    !ambientState.enabled ||
    state.paused ||
    state.gameOver ||
    state.currentScene ||
    state.introScreenActive ||
    state.pauseMenuOpen ||
    state.confirmExitOpen
  ) {
    return;
  }

  if (!ambientState.pendingStart && !audio.policeAmbient.paused) {
    return;
  }

  tryStartAmbient();
}

function canResumeMedia(el) {
  return Boolean(el) && (el.isConnected || el instanceof HTMLAudioElement);
}

function setControls(enabled) {
  state.controlsEnabled = enabled && !state.gameOver && !state.busy && !state.currentScene && !state.posterVisible;
}

function updateScore() {
  const currentScoreText = String(state.score);
  ui.currentScoreValue.textContent = currentScoreText;
  ui.currentScoreRenderer?.setValue(currentScoreText);

  if (state.score > state.bestScore) {
    state.bestScore = recordModeScore(MODE_SCORE_KEY, state.score);
  }

  const bestScoreText = String(state.bestScore);
  ui.scoreValue.textContent = bestScoreText;
  ui.scoreRenderer?.setValue(bestScoreText);
}

function updateLives() {
  const visibleLives = Math.max(0, Math.min(ui.life.length, state.lives - 1));
  ui.life.forEach((el, i) => {
    el.style.display = i < visibleLives ? "block" : "none";
  });
}

function updateMisses() {
  if (!ui.missMeterFill) {
    return;
  }

  if (!state.hudVisible || state.misses <= 0) {
    ui.missMeterFill.classList.add("hidden");
    return;
  }

  const missIndex = Math.max(0, Math.min(MAX_MISSES, state.misses));
  const nextSrc = MISS_FILL_SOURCES[missIndex];
  if (!nextSrc) {
    ui.missMeterFill.classList.add("hidden");
    return;
  }

  ui.missMeterFill.src = nextSrc;
  ui.missMeterFill.classList.remove("hidden");
}

function registerMiss() {
  state.misses = Math.min(MAX_MISSES, state.misses + 1);
  updateMisses();

  if (state.misses < MAX_MISSES) {
    return false;
  }

  state.lives = Math.max(0, state.lives - 1);
  updateLives();
  state.misses = 0;
  updateMisses();
  return state.lives <= 0;
}

function setHudVisible(visible) {
  state.hudVisible = visible;
  const method = visible ? "remove" : "add";
  ui.scoreLabel.classList[method]("hidden");
  ui.scoreLabelArt.classList[method]("hidden");
  ui.scoreValue.classList[method]("hidden");
  ui.scoreBitmap.classList[method]("hidden");
  ui.currentScoreValue.classList[method]("hidden");
  ui.currentScoreBitmap.classList[method]("hidden");
  ui.life.forEach((el) => el.classList[method]("hidden"));
  ui.bookBtn.classList[method]("hidden");
  ui.missMeterBase.classList[method]("hidden");
  ui.missLabel.classList[method]("hidden");

  if (!visible) {
    ui.missMeterFill.classList.add("hidden");
    return;
  }

  updateMisses();
}

function clearCenterText() {
  clearScheduledTask(state.centerTextTimer);
  state.centerTextTimer = null;
  ui.centerText.textContent = "";
  ui.centerText.classList.add("hidden");
}

function showCenterText(text, durationMs = MESSAGE_MS) {
  clearScheduledTask(state.centerTextTimer);
  state.centerTextTimer = null;
  ui.centerText.textContent = text;
  ui.centerText.classList.remove("hidden");

  if (!durationMs || durationMs <= 0) {
    return;
  }

  state.centerTextTimer = scheduleTimeout(() => {
    clearCenterText();
  }, durationMs);
}

function pressButton(el, ms = 200) {
  if (!el || !el.dataset.hover || !el.dataset.base) {
    return;
  }
  el.src = el.dataset.hover;
  scheduleTimeout(() => {
    if (!el.matches(":hover")) {
      el.src = el.dataset.base;
    }
  }, ms);
}

function hideGameplayElements() {
  Object.values(parts).forEach((part) => {
    part.partEl.classList.add("hidden");
    part.panelEl.classList.add("hidden");
    part.upBtn.classList.add("hidden");
    part.downBtn.classList.add("hidden");
    part.checkEl.classList.add("hidden");
  });

  ui.playBtn.classList.add("hidden");
  ui.matchBtn.classList.add("hidden");
}

function showGameplayElements() {
  Object.values(parts).forEach((part) => {
    part.partEl.classList.remove("hidden");
    part.panelEl.classList.remove("hidden");
    part.upBtn.classList.remove("hidden");
    part.downBtn.classList.remove("hidden");
    part.checkEl.classList.toggle("hidden", !part.locked);
  });

  ui.playBtn.classList.remove("hidden");
  ui.matchBtn.classList.remove("hidden");
}

function setPartFrame(partName, frame) {
  const part = parts[partName];
  part.frame = frame;
  part.partEl.src = framePath(part.def.partPrefix, frame);
  part.panelEl.src = panelPath(part.def.panelPrefix, frame);
}

function randomizeFace() {
  showGameplayElements();

  Object.values(parts).forEach((part) => {
    const frame = Math.floor(Math.random() * FRAME_COUNT);
    setPartFrame(part.name, frame);
    part.locked = false;
    part.checkEl.classList.add("hidden");
  });

  ui.face.classList.add("hidden");
  state.prevPartMatch = 0;
}

function partMatchCount() {
  let total = 0;

  Object.values(parts).forEach((part) => {
    const ok = part.frame === state.badGuy;
    part.locked = ok;
    part.checkEl.classList.toggle("hidden", !ok);
    if (ok) {
      total += 1;
    }
  });

  return total;
}

function showIdleLights() {
  ui.matchLightVideo.classList.add("hidden");
  ui.idleLightVideo.classList.remove("hidden");
  ui.idleLightVideo.play().catch(() => {});
}

function showMatchLights() {
  ui.idleLightVideo.classList.add("hidden");
  ui.matchLightVideo.classList.remove("hidden");
  ui.matchLightVideo.play().catch(() => {});
}

function startFaceCycle() {
  clearScheduledTask(state.faceAnimTimer);
  state.faceAnimTimer = null;
  state.faceAnimFrame = 0;
  ui.face.src = facePath(state.faceAnimFrame);
  ui.face.classList.remove("hidden");

  state.faceAnimTimer = scheduleInterval(() => {
    state.faceAnimFrame = (state.faceAnimFrame + 1) % FRAME_COUNT;
    ui.face.src = facePath(state.faceAnimFrame);
  }, Math.round(1000 / 11));
}

function stopFaceCycle(options = {}) {
  const { hide = true, freezeFrame = null } = options;

  clearScheduledTask(state.faceAnimTimer);
  state.faceAnimTimer = null;

  if (freezeFrame !== null) {
    ui.face.src = facePath(freezeFrame);
    ui.face.classList.remove("hidden");
    return;
  }

  if (hide) {
    ui.face.classList.add("hidden");
  }
}

function runBlinkLoop(key, lightEl) {
  const timerKey = `${key}BlinkTimer`;
  const onKey = `${key}BlinkOn`;
  const speedKey = `${key}BlinkSpeed`;

  if (state[timerKey]) {
    return;
  }

  const tick = () => {
    state[onKey] = !state[onKey];
    lightEl.classList.toggle("hidden", !state[onKey]);
    state[timerKey] = scheduleTimeout(tick, state[speedKey]);
  };

  tick();
}

function setBlinkSpeed(key, lightEl, ms) {
  state[`${key}BlinkSpeed`] = ms;
  runBlinkLoop(key, lightEl);
}

function stopBlinkLoop(key, lightEl) {
  const timerKey = `${key}BlinkTimer`;
  const onKey = `${key}BlinkOn`;

  clearScheduledTask(state[timerKey]);
  state[timerKey] = null;
  state[onKey] = false;
  lightEl.classList.add("hidden");
}

function playRoundVoiceForCurrentCrook() {
  if (state.roundIndex === 0) {
    playSound(audio.peter1);
    return;
  }
  if (state.roundIndex === 1) {
    playSound(audio.peter2);
    return;
  }
  if (state.roundIndex === 2) {
    playSound(audio.peter3);
  }
}

function skipCurrentScene() {
  if (state.paused || !state.currentScene || !state.sceneSkippable || !ui.binkPlayer) {
    return;
  }

  // Some converted clips have unreliable seeking, so force-finish first.
  if (typeof state.forceSceneEnd === "function") {
    state.forceSceneEnd();
    return;
  }

  const duration = ui.binkPlayer.duration;
  if (Number.isFinite(duration) && duration > 0.1) {
    ui.binkPlayer.currentTime = Math.max(0, duration - 0.05);
  }
}


function getPauseManagedMedia() {
  return [
    ui.rightLight,
    ui.idleLightVideo,
    ui.matchLightVideo,
    ui.binkPlayer,
    audio.roundover,
    audio.matchingLoop,
    audio.mismatch,
    audio.partmatch,
    audio.match,
    audio.caught,
    audio.policeAmbient,
    audio.intro,
    audio.peter1,
    audio.peter2,
    audio.peter3,
    audio.peter4,
    audio.lose,
    audio.win,
  ].filter(Boolean);
}

function pauseGameplaySystems() {
  if (state.paused) {
    return;
  }

  state.paused = true;
  pauseScheduledTasks();
  state.pauseMediaSnapshot = getPauseManagedMedia()
    .filter((el) => !el.paused && !el.ended)
    .map((el) => ({
      el,
      currentTime: Number.isFinite(el.currentTime) ? el.currentTime : 0,
    }));

  state.pauseMediaSnapshot.forEach(({ el }) => {
    el.pause();
  });
}

function resumeGameplaySystems() {
  if (!state.paused) {
    return;
  }

  state.paused = false;
  const snapshot = state.pauseMediaSnapshot;
  state.pauseMediaSnapshot = [];
  resumeScheduledTasks();

  snapshot.forEach(({ el, currentTime }) => {
    if (!canResumeMedia(el)) {
      return;
    }

    try {
      el.currentTime = currentTime;
    } catch {}

    const playPromise = el.play();
    if (el === audio.policeAmbient && playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        ambientState.pendingStart = ambientState.enabled;
      });
      return;
    }

    playPromise?.catch(() => {});
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

function closePauseMenuAndResume() {
  hidePauseMenuHighlights();
  hidePauseConfirmHighlights();
  pauseMenuOverlay.classList.add("hidden");
  pauseConfirmOverlay.classList.add("hidden");
  state.pauseMenuOpen = false;
  state.confirmExitOpen = false;
  if (ui.bookBtn) {
    ui.bookBtn.src = ui.bookBtn.dataset.base;
  }
  resumeGameplaySystems();
}

function resumeFromPauseMenu() {
  playSound(audio.uiClick, 0.9);
  closePauseMenuAndResume();
}

function openPauseMenu() {
  if (state.paused || state.introScreenActive || state.confirmExitOpen || state.pauseMenuOpen) {
    return;
  }

  pauseGameplaySystems();
  hidePauseConfirmHighlights();
  hidePauseMenuHighlights();
  pauseConfirmOverlay.classList.add("hidden");
  pauseMenuOverlay.classList.remove("hidden");
  state.pauseMenuOpen = true;
  state.confirmExitOpen = false;
  if (ui.bookBtn) {
    ui.bookBtn.src = ui.bookBtn.dataset.base;
  }
  playSound(audio.uiClick, 0.9);
}

function openPauseHelp() {
  if (!state.pauseMenuOpen) {
    return;
  }

  playSound(audio.uiClick, 0.9);
  hidePauseMenuHighlights();
  pauseMenuOverlay.classList.add("hidden");
  state.pauseMenuOpen = false;

  showIntroScreen({
    resumeAfterClose: true,
    playCloseClick: true,
    allowEscape: false,
  }).catch(() => {});
}

function openPauseConfirm() {
  if (!state.pauseMenuOpen) {
    return;
  }

  playSound(audio.uiClick, 0.9);
  hidePauseMenuHighlights();
  hidePauseConfirmHighlights();
  pauseMenuOverlay.classList.add("hidden");
  pauseConfirmOverlay.classList.remove("hidden");
  state.pauseMenuOpen = false;
  state.confirmExitOpen = true;
}

function closePauseConfirmAndResume() {
  playSound(audio.uiClick, 0.9);
  hidePauseConfirmHighlights();
  pauseConfirmOverlay.classList.add("hidden");
  state.confirmExitOpen = false;
  resumeGameplaySystems();
}

function restartFromPauseMenu() {
  playSound(audio.uiClick, 0.9);
  sessionStorage.removeItem("chp_skip_mugshot_help");
  window.location.href = "./mugshot.html";
}

function exitToMainMenu() {
  playSound(audio.uiClick, 0.9);
  sessionStorage.removeItem("chp_skip_mugshot_help");
  window.location.href = "./index.html";
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

  bindOverlayButton(pauseResumeHit, pauseResumeOverlay, () => state.pauseMenuOpen, resumeFromPauseMenu);
  bindOverlayButton(pauseRestartHit, pauseRestartOverlay, () => state.pauseMenuOpen, restartFromPauseMenu);
  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseMenuOpen, openPauseHelp);
  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseMenuOpen, openPauseConfirm);
  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmExitOpen, exitToMainMenu);
  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmExitOpen, closePauseConfirmAndResume);
}

async function showIntroScreen(options = {}) {
  const {
    markIntroShown = false,
    resumeAfterClose = false,
    playCloseClick = false,
    allowEscape = true,
  } = options;

  if ((markIntroShown && state.introShown) || !introOverlay || !introContinue) {
    return;
  }

  if (markIntroShown) {
    state.introShown = true;
  }

  state.introScreenActive = true;
  introOverlay.classList.remove("hidden");
  introOverlay.classList.remove("fade-out");

  playSound(audio.intro, 0.9);

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
      stopSound(audio.intro);
      if (playCloseClick) {
        playSound(audio.uiClick, 0.9);
      }
      introOverlay.classList.add("fade-out");

      window.setTimeout(() => {
        introOverlay.classList.add("hidden");
        introOverlay.classList.remove("fade-out");
        state.introScreenActive = false;
        if (resumeAfterClose) {
          resumeGameplaySystems();
        }
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

function setupGlobalClickLogic() {
  root.addEventListener("click", () => {
    if (state.introScreenActive || state.paused) {
      return;
    }
    if (state.posterVisible) {
      if (state.posterSkipArmed) {
        return;
      }

      state.posterSkipArmed = true;
      scheduleTimeout(() => {
        state.posterSkipArmed = false;
        if (state.posterVisible && typeof state.posterResolve === "function") {
          state.posterResolve();
        }
      }, 500);

      return;
    }

    if (state.currentScene && state.sceneSkippable) {
      skipCurrentScene();
    }
  });
}

function setupGlobalKeyLogic() {
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      if (state.introScreenActive) {
        return;
      }

      ev.preventDefault();

      if (state.pauseMenuOpen) {
        closePauseMenuAndResume();
        return;
      }

      if (state.confirmExitOpen || state.paused) {
        return;
      }

      openPauseMenu();
      return;
    }

    if (state.introScreenActive || state.paused) {
      return;
    }

    if (ev.key !== "Enter") {
      return;
    }

    if (state.currentScene && state.sceneSkippable) {
      ev.preventDefault();
      skipCurrentScene();
    }
  });
}

async function waitPosterAdvance(timeoutMs) {
  await new Promise((resolve) => {
    let done = false;
    let timerTask = null;

    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      state.posterResolve = null;
      clearScheduledTask(timerTask);
      resolve();
    };

    timerTask = scheduleTimeout(finish, timeoutMs);
    state.posterResolve = finish;
  });
}

function endGame(result) {
  state.gameOver = true;
  state.busy = false;
  state.currentScene = null;
  state.sceneSkippable = false;
  state.forceSceneEnd = null;
  setControls(false);

  stopSound(audio.matchingLoop);
  stopFaceCycle({ hide: true });
  setAmbient(false);
  stopBlinkLoop("play", ui.playLight);
  stopBlinkLoop("match", ui.matchLight);

  if (result === "win") {
    showCenterText("\u041F\u041E\u0411\u0415\u0414\u0410", 0);
    playSound(audio.win);
    return;
  }

  showCenterText("\u041F\u041E\u0420\u0410\u0416\u0415\u041D\u0418\u0415", 0);
  playSound(audio.lose);
}

async function playScene(sceneName, options = {}) {
  const {
    randomizeOnEnd = false,
    skippable = true,
    playRoundVoice = true,
  } = options;

  state.busy = true;
  setControls(false);
  state.currentScene = sceneName;
  state.sceneSkippable = skippable;

  stopSound(audio.matchingLoop);
  setAmbient(false);

  ui.face.classList.add("hidden");
  ui.poster1.classList.add("hidden");
  ui.poster2.classList.add("hidden");
  ui.poster3.classList.add("hidden");
  state.posterVisible = false;
  state.posterResolve = null;

  ui.idleLightVideo.classList.add("hidden");
  ui.matchLightVideo.classList.add("hidden");

  ui.binkPlayer.classList.remove("hidden");
  const nextSceneSrc = `${videosBase}/${sceneName}.webm`;
  if (ui.binkPlayer.dataset.scene !== sceneName) {
    ui.binkPlayer.src = nextSceneSrc;
    ui.binkPlayer.dataset.scene = sceneName;
  }
  ui.binkPlayer.currentTime = 0;
  ui.binkPlayer.muted = false;
  ui.binkPlayer.loop = false;

  await new Promise((resolve) => {
    let finished = false;
    let lastTime = 0;
    let sawProgress = false;
    const sceneTimeout = SCENE_TIMEOUT_MS[sceneName] ?? 22000;
    let timeoutTask = null;

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      ui.binkPlayer.removeEventListener("ended", onEnded);
      ui.binkPlayer.removeEventListener("error", onError);
      ui.binkPlayer.removeEventListener("timeupdate", onTimeUpdate);
      clearScheduledTask(timeoutTask);
      state.forceSceneEnd = null;
      resolve();
    };

    const onEnded = () => {
      finish();
    };
    const onError = () => {
      finish();
    };
    const onTimeUpdate = () => {
      const t = ui.binkPlayer.currentTime;
      if (!Number.isFinite(t)) {
        return;
      }

      if (t > 0.15) {
        sawProgress = true;
      }

      const d = ui.binkPlayer.duration;
      if (Number.isFinite(d) && d > 0.1 && t >= d - 0.03) {
        finish();
        return;
      }

      // Some converted clips can wrap to frame 0 without firing `ended`.
      if (sawProgress && t + 0.25 < lastTime) {
        finish();
        return;
      }

      lastTime = t;
    };

    state.forceSceneEnd = finish;
    ui.binkPlayer.addEventListener("ended", onEnded);
    ui.binkPlayer.addEventListener("error", onError);
    ui.binkPlayer.addEventListener("timeupdate", onTimeUpdate);
    timeoutTask = scheduleTimeout(finish, sceneTimeout);

    ui.binkPlayer.play().catch(() => {
      ui.binkPlayer.muted = true;
      ui.binkPlayer.play().catch(() => {
        finish();
      });
    });
  });

  ui.binkPlayer.pause();
  ui.binkPlayer.classList.add("hidden");

  state.currentScene = null;
  state.sceneSkippable = false;
  state.forceSceneEnd = null;

  if (sceneName === "jailbirds") {
    endGame("win");
    return;
  }

  if (randomizeOnEnd) {
    randomizeFace();
  }

  setHudVisible(true);
  showIdleLights();
  setAmbient(true);

  state.busy = false;
  setControls(true);

  if (playRoundVoice && !state.gameOver) {
    playRoundVoiceForCurrentCrook();
  }
}

async function onPlayClick() {
  if (!state.controlsEnabled || state.busy || state.gameOver || state.paused) {
    return;
  }

  state.busy = true;
  setControls(false);

  pressButton(ui.playBtn);
  playSound(audio.binkBtn);
  setBlinkSpeed("play", ui.playLight, 100);

  await delay(PLAY_DELAY_MS);

  if (state.gameOver) {
    return;
  }

  await playScene(shortSceneByBadGuy(state.badGuy), {
    randomizeOnEnd: false,
    skippable: true,
    playRoundVoice: true,
  });

  if (!state.gameOver) {
    setBlinkSpeed("play", ui.playLight, 680);
  }
}

async function onMatchClick() {
  if (!state.controlsEnabled || state.busy || state.gameOver || state.lives <= 0 || state.paused) {
    return;
  }

  state.busy = true;
  setControls(false);

  pressButton(ui.matchBtn);
  playSound(audio.matchBtn);

  setBlinkSpeed("match", ui.matchLight, 150);
  showMatchLights();
  startFaceCycle();

  scheduleTimeout(() => {
    if (!state.gameOver) {
      playSound(audio.matchingLoop, 0.72);
    }
  }, MATCH_LOOP_DELAY_MS);

  await delay(MATCH_TOTAL_MS);

  stopSound(audio.matchingLoop);
  showIdleLights();

  const found = partMatchCount();
  const newParts = Math.max(0, found - state.prevPartMatch);

  if (newParts > 0) {
    state.score += newParts * POINTS_PER_PART;
    updateScore();
  }

  if (found === 4) {
    playSound(audio.match);
    showCenterText("\u0421\u041E\u0412\u041F\u0410\u0414\u0415\u041D\u0418\u0415", MESSAGE_MS);
    stopFaceCycle({ hide: false, freezeFrame: state.badGuy });

    const capturedBadGuy = state.badGuy;
    state.roundIndex += 1;

    scheduleTimeout(() => {
      if (!state.gameOver) {
        playSound(audio.peter4);
      }
    }, 1000);

    await delay(POSTER_SHOW_DELAY_MS);

    const poster = posterByBadGuy(capturedBadGuy);
    poster.classList.remove("hidden");
    state.posterVisible = true;
    setHudVisible(false);
    playSound(audio.caught);

    await waitPosterAdvance(Math.max(0, POSTER_TOTAL_MS - POSTER_SHOW_DELAY_MS));

    state.posterVisible = false;
    state.posterResolve = null;
    poster.classList.add("hidden");
    ui.face.classList.add("hidden");

    if (state.roundIndex >= state.crooks.length) {
      await playScene("jailbirds", {
        randomizeOnEnd: false,
        skippable: false,
        playRoundVoice: false,
      });
      return;
    }

    state.badGuy = state.crooks[state.roundIndex];
    state.lives = 3;
    state.misses = 0;
    state.prevPartMatch = 0;
    updateLives();
    updateMisses();

    await playScene(sceneByBadGuy(state.badGuy), {
      randomizeOnEnd: true,
      skippable: true,
      playRoundVoice: true,
    });

    return;
  }

  stopFaceCycle({ hide: true });

  if (newParts === 0) {
    const gameOverByMisses = registerMiss();
    playSound(audio.mismatch);
    showCenterText("\u041D\u0415 \u041D\u0410\u0419\u0414\u0415\u041D", MESSAGE_MS);

    if (gameOverByMisses) {
      endGame("lose");
      return;
    }
  } else {
    playSound(audio.partmatch);
  }

  state.prevPartMatch = found;
  state.busy = false;
  setControls(true);
  setBlinkSpeed("match", ui.matchLight, 700);
}

function createButton(def, onClick, hoverSound = audio.hover) {
  const el = sprite(`${art}/buttons/${def.base}`, def.pos[0], def.pos[1], 70);
  el.dataset.base = `${art}/buttons/${def.base}`;
  el.dataset.hover = `${art}/buttons/${def.hover}`;

  el.addEventListener("pointerenter", () => {
    if (!state.controlsEnabled || state.paused || state.introScreenActive) {
      return;
    }
    el.src = el.dataset.hover;
    playSound(hoverSound, 0.6);
  });

  el.addEventListener("pointerleave", () => {
    el.src = el.dataset.base;
  });

  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (state.paused || state.introScreenActive) {
      return;
    }
    onClick();
  });

  return el;
}

function createBookButton(onClick) {
  const el = sprite(BOOK_BUTTON_SRC, 5, 414, 105);
  el.dataset.base = BOOK_BUTTON_SRC;
  el.dataset.hover = BOOK_BUTTON_HOVER_SRC;

  el.addEventListener("pointerenter", () => {
    if (state.paused || state.introScreenActive || state.confirmExitOpen || state.pauseMenuOpen) {
      return;
    }
    el.src = el.dataset.hover;
    playSound(audio.hover, 0.6);
  });

  el.addEventListener("pointerleave", () => {
    el.src = el.dataset.base;
  });

  el.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (state.paused || state.introScreenActive || state.confirmExitOpen || state.pauseMenuOpen) {
      return;
    }
    onClick();
  });

  return el;
}

function initScene() {
  sprite(`${art}/crimecomputer.png`, 0, 0, 1);
  sprite(`${art}/heads/base.png`, 133, 28, 12);

  ui.face = sprite(facePath(0), 330, 30, 30);
  ui.face.classList.add("hidden");

  ui.rightLight = video(`${videosBase}/complight.webm`, 544, 171, 32);
  ui.rightLight.loop = true;
  ui.rightLight.muted = true;
  ui.rightLight.play().catch(() => {});

  ui.idleLightVideo = video(`${videosBase}/lights.webm`, 553, 364, 32);
  ui.idleLightVideo.loop = true;
  ui.idleLightVideo.muted = true;
  ui.idleLightVideo.classList.add("hidden");

  ui.matchLightVideo = video(`${videosBase}/matchlights.webm`, 553, 364, 33);
  ui.matchLightVideo.loop = true;
  ui.matchLightVideo.muted = true;
  ui.matchLightVideo.classList.add("hidden");

  ui.playLight = sprite(`${art}/buttons/playlight.png`, 15, 219, 31);
  ui.matchLight = sprite(`${art}/buttons/matchlight.png`, 19, 251, 31);
  ui.playLight.classList.add("hidden");
  ui.matchLight.classList.add("hidden");

  ui.poster1 = sprite(`${art}/poster1.png`, 0, 0, 95);
  ui.poster2 = sprite(`${art}/poster2.png`, 0, 0, 95);
  ui.poster3 = sprite(`${art}/poster3.png`, 0, 0, 95);
  ui.poster1.classList.add("hidden");
  ui.poster2.classList.add("hidden");
  ui.poster3.classList.add("hidden");

  ui.binkPlayer = video(`${videosBase}/bank.webm`, 0, 0, 80, 640, 480);
  ui.binkPlayer.dataset.scene = "bank";
  ui.binkPlayer.style.backgroundColor = "#000";
  ui.binkPlayer.load();
  ui.binkPlayer.classList.add("hidden");

  Object.entries(partDefs).forEach(([name, def]) => {
    const partEl = sprite(
      framePath(def.partPrefix, def.initialFrame),
      def.partPos[0],
      def.partPos[1],
      def.partZ ?? 20
    );
    const panelEl = sprite(panelPath(def.panelPrefix, def.initialFrame), def.panelPos[0], def.panelPos[1], 19);
    const checkEl = sprite(`${art}/panels/${def.checkFile}`, def.checkPos[0], def.checkPos[1], 25);

    partEl.classList.add("hidden");
    panelEl.classList.add("hidden");
    checkEl.classList.add("hidden");

    const part = {
      name,
      def,
      frame: def.initialFrame,
      locked: false,
      partEl,
      panelEl,
      checkEl,
    };

    part.upBtn = createButton(def.upBtn, () => {
      if (!state.controlsEnabled || state.busy || part.locked) {
        return;
      }
      pressButton(part.upBtn);
      playSound(audio.arrow, 0.9);
      setPartFrame(name, (part.frame + 1) % FRAME_COUNT);
    });

    part.downBtn = createButton(def.downBtn, () => {
      if (!state.controlsEnabled || state.busy || part.locked) {
        return;
      }
      pressButton(part.downBtn);
      playSound(audio.arrow, 0.9);
      setPartFrame(name, (part.frame - 1 + FRAME_COUNT) % FRAME_COUNT);
    });

    part.upBtn.classList.add("hidden");
    part.downBtn.classList.add("hidden");

    parts[name] = part;
  });

  ui.playBtn = createButton(
    { pos: [288, 278], base: "playbutton.png", hover: "playbutton_h.png" },
    onPlayClick,
    audio.roundover
  );

  ui.matchBtn = createButton(
    { pos: [282, 361], base: "matchbutton.png", hover: "matchbutton_h.png" },
    onMatchClick,
    audio.roundover
  );

  ui.playBtn.classList.add("hidden");
  ui.matchBtn.classList.add("hidden");

  ui.scoreLabel = document.createElement("div");
  ui.scoreLabel.id = "scoreLabel";
  ui.scoreLabel.className = "hud-label";
  ui.scoreLabel.textContent = "\u0421\u0427\u0415\u0422";
  root.appendChild(ui.scoreLabel);

  ui.scoreLabelArt = document.createElement("img");
  ui.scoreLabelArt.id = "scoreLabelArt";
  ui.scoreLabelArt.className = "hidden";
  ui.scoreLabelArt.src = "./assets/art/ui/score_ru.png";
  ui.scoreLabelArt.alt = "";
  ui.scoreLabelArt.draggable = false;
  ui.scoreLabelArt.style.display = "none";
  ui.scoreLabelArt.addEventListener("load", () => {
    ui.scoreLabelArt.style.display = "block";
    ui.scoreLabel.classList.add("bitmap-score-fallback-hidden");
  }, { once: true });
  root.appendChild(ui.scoreLabelArt);

  ui.scoreValue = document.createElement("div");
  ui.scoreValue.id = "scoreValue";
  ui.scoreValue.className = "hud-label";
  ui.scoreValue.textContent = "0";
  root.appendChild(ui.scoreValue);

  ui.scoreBitmap = document.createElement("div");
  ui.scoreBitmap.id = "scoreValueBitmap";
  ui.scoreBitmap.className = "bitmap-score hidden";
  ui.scoreBitmap.style.display = "none";
  root.appendChild(ui.scoreBitmap);

  ui.currentScoreValue = document.createElement("div");
  ui.currentScoreValue.id = "currentScoreValue";
  ui.currentScoreValue.className = "hud-label";
  ui.currentScoreValue.textContent = "0";
  root.appendChild(ui.currentScoreValue);

  ui.currentScoreBitmap = document.createElement("div");
  ui.currentScoreBitmap.id = "currentScoreBitmap";
  ui.currentScoreBitmap.className = "bitmap-score hidden";
  ui.currentScoreBitmap.style.display = "none";
  root.appendChild(ui.currentScoreBitmap);

  // Center score shows the mode record, top-right shows the current attempt.
  ui.scoreRenderer = createBitmapScoreRenderer({
    container: ui.scoreBitmap,
    fallbackEl: ui.scoreValue,
  });
  ui.currentScoreRenderer = createBitmapScoreRenderer({
    container: ui.currentScoreBitmap,
    fallbackEl: ui.currentScoreValue,
  });

  ui.bookBtn = createBookButton(openPauseMenu);
  ui.bookBtn.classList.add("hidden");

  ui.missMeterBase = sprite("./assets/art/global/miss301.png", 526, 425, 100);
  ui.missMeterBase.classList.add("hidden");

  ui.missMeterFill = sprite("./assets/art/global/miss302.png", 526, 425, 101);
  ui.missMeterFill.classList.add("hidden");

  ui.missLabel = sprite("./assets/art/global/misstext.png", 533, 457, 100);
  ui.missLabel.classList.add("hidden");

  ui.life = [];
  [
    [10, 5],
    [45, 5],
  ].forEach(([x, y]) => {
    const life = sprite("./assets/art/global/life/spideyhead.png", x, y, 100, "life");
    ui.life.push(life);
  });

  ui.centerText = document.createElement("div");
  ui.centerText.className = "center-text hidden";
  root.appendChild(ui.centerText);

  hideGameplayElements();
}

async function startGame() {
  state.roundIndex = 0;
  state.badGuy = state.crooks[0];
  state.score = 0;
  state.bestScore = getModeScore(MODE_SCORE_KEY);
  state.lives = 3;
  state.misses = 0;
  state.prevPartMatch = 0;
  state.gameOver = false;
  state.busy = false;
  state.currentScene = null;
  state.sceneSkippable = false;
  state.forceSceneEnd = null;
  state.posterVisible = false;
  state.posterResolve = null;
  state.posterSkipArmed = false;
  state.paused = false;
  state.pauseMenuOpen = false;
  state.confirmExitOpen = false;
  state.pauseMediaSnapshot = [];

  pauseMenuOverlay.classList.add("hidden");
  pauseConfirmOverlay.classList.add("hidden");
  hidePauseMenuHighlights();
  hidePauseConfirmHighlights();

  clearCenterText();
  updateScore();
  updateLives();
  updateMisses();
  setHudVisible(false);
  setControls(false);

  if (shouldSkipIntroHelp) {
    sessionStorage.removeItem("chp_skip_mugshot_help");
    state.introShown = true;
    state.introScreenActive = false;
    introOverlay?.classList.add("hidden");
  } else {
    await showIntroScreen({ markIntroShown: true });
  }

  // Prevent accidental skip from the same click that closed the help screen.
  await delay(40);

  await playScene(sceneByBadGuy(state.badGuy), {
    randomizeOnEnd: true,
    skippable: true,
    playRoundVoice: true,
  });
}

function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  window.addEventListener("pointerdown", retryAmbientPlayback);
  window.addEventListener("keydown", retryAmbientPlayback);
  setupCursor();
  setupGlobalClickLogic();
  setupGlobalKeyLogic();
  initScene();
  bindPauseOverlayButtons();
  startGame().catch((err) => {
    console.error(err);
    showCenterText("\u041E\u0428\u0418\u0411\u041A\u0410", 0);
  });
}

boot();










