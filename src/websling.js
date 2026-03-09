import { createBitmapScoreRenderer } from "./bitmap-score.js";
import { getModeScore, recordModeScore } from "./score-store.js";

const BASE_W = 640;
const BASE_H = 480;
const MODE_KEY = "websling";
const SKIP_HELP_KEY = "chp_skip_mode_help";
const SKIP_HELP_VALUE = "websling";
const MAX_LIVES = 3;
const INTRO_FADE_MS = 380;
const CENTER_TEXT_MS = 1300;
const STAGE_INTRO_MS = 3000;
const BOOK_CLOSED_SRC = "./assets/art/ui/book.png";
const BOOK_OPEN_SRC = "./assets/art/ui/bookover.png";
const DECISION_ARM_DELAY_BY_CLIP_MS = Object.freeze({
  ST1_VA: 3100,
  ST1_VB: 3100,
  ST1_VC: 3100,
  ST2_VA: 3700,
  ST2_VB: 3700,
  ST2_VC: 3700,
});
const DECISION_ARM_EPSILON_SEC = 0.03;

const LINE_MOTION = {
  ST1_VA: { startX: 100, speed: 50 },
  ST1_VB: { startX: 400, speed: -12.5 },
  ST1_VC: { startX: 320, speed: 0 },
  ST2_VA: { startX: 480, speed: -12.5 },
  ST2_VB: { startX: 400, speed: -12.5 },
  ST2_VC: { startX: 320, speed: 0 },
};

const CLIP_FILES = {
  Noon: {
    LEFT: "Left_Noon.webm",
    RIGHT: "Right_Noon.webm",
    Fall: "Confuse_Noon.webm",
    Victory: "Victory_Noon.webm",
    ST1_VA: "ST1_VA_Noon.webm",
    ST1_VB: "ST1_VB_Noon.webm",
    ST1_VC: "ST1_VC_Noon.webm",
    ST2_VA: "ST2_VA_Noon.webm",
    ST2_VB: "ST2_VB_Noon.webm",
    ST2_VC: "ST2_VC_Noon.webm",
  },
  Evening: {
    LEFT: "Left_evening.webm",
    RIGHT: "Right_evening.webm",
    Fall: "Confuse_Evening.webm",
    Victory: "Victory_Evening.webm",
    ST1_VA: "ST1_VA_Evening.webm",
    ST1_VB: "ST1_VB_Evening.webm",
    ST1_VC: "ST1_VC_Evening.webm",
    ST2_VA: "ST2_VA_Evening.webm",
    ST2_VB: "ST2_VB_Evening.webm",
    ST2_VC: "ST2_VC_Evening.webm",
  },
  Night: {
    LEFT: "Left_Night.webm",
    RIGHT: "Right_Night.webm",
    Fall: "Confuse_Night.webm",
    Victory: "Victory_Night.webm",
    ST1_VA: "ST1_VA_Night.webm",
    ST1_VB: "ST1_VB_Night.webm",
    ST1_VC: "ST1_VC_Night.webm",
    ST2_VA: "ST2_VA_Night.webm",
    ST2_VB: "ST2_VB_Night.webm",
    ST2_VC: "ST2_VC_Night.webm",
  },
};

const PATHS = {
  1: {
    clips: ["ST1_VA", "RIGHT", "ST2_VA", "LEFT", "Victory"],
    expected: ["right", "left"],
  },
  2: {
    clips: ["ST1_VB", "LEFT", "ST2_VB", "RIGHT", "Victory"],
    expected: ["left", "right"],
  },
  3: {
    clips: ["ST1_VC", "LEFT", "ST2_VC", "RIGHT", "ST1_VC", "RIGHT", "Victory"],
    expected: ["left", "right", "right"],
  },
  4: {
    clips: ["ST2_VA", "LEFT", "ST1_VA", "LEFT", "ST2_VA", "RIGHT", "Victory"],
    expected: ["left", "left", "right"],
  },
  5: {
    clips: ["ST2_VB", "RIGHT", "ST1_VB", "RIGHT", "ST2_VB", "LEFT", "Victory"],
    expected: ["right", "right", "left"],
  },
  6: {
    clips: ["ST2_VC", "LEFT", "ST1_VC", "LEFT", "ST2_VC", "RIGHT", "ST1_VC", "LEFT", "Victory"],
    expected: ["left", "left", "right", "left"],
  },
  7: {
    clips: ["ST1_VA", "RIGHT", "ST2_VA", "RIGHT", "ST1_VA", "LEFT", "ST2_VA", "LEFT", "Victory"],
    expected: ["right", "right", "left", "left"],
  },
  8: {
    clips: ["ST1_VB", "LEFT", "ST2_VB", "RIGHT", "ST1_VB", "RIGHT", "ST2_VB", "LEFT", "Victory"],
    expected: ["left", "right", "right", "left"],
  },
  9: {
    clips: ["ST1_VC", "RIGHT", "ST2_VC", "LEFT", "ST1_VC", "RIGHT", "ST2_VC", "LEFT", "ST1_VC", "LEFT", "Victory"],
    expected: ["right", "left", "right", "left", "left"],
  },
};

const LEVELS = [
  {
    label: "УРОВЕНЬ 1",
    setKey: "Noon",
    music: "./assets/sounds/webslinger/wsloop001.wav",
    rounds: [
      { pathId: 1, stageMap: "./assets/video/webslinger/MAPS/Stage_1.webm" },
      { pathId: 2, stageMap: "./assets/video/webslinger/MAPS/stage_2.webm" },
      { pathId: 3, stageMap: "./assets/video/webslinger/MAPS/stage_3.webm" },
    ],
  },
  {
    label: "УРОВЕНЬ 2",
    setKey: "Evening",
    music: "./assets/sounds/webslinger/wsloop002.wav",
    rounds: [
      { pathId: 4, stageMap: "./assets/video/webslinger/MAPS/stage_4.webm" },
      { pathId: 5, stageMap: "./assets/video/webslinger/MAPS/stage_5.webm" },
      { pathId: 6, stageMap: "./assets/video/webslinger/MAPS/stage_6.webm" },
    ],
  },
  {
    label: "УРОВЕНЬ 3",
    setKey: "Night",
    music: "./assets/sounds/webslinger/wsloop003.wav",
    rounds: [
      { pathId: 7, stageMap: "./assets/video/webslinger/MAPS/stage_7.webm" },
      { pathId: 8, stageMap: "./assets/video/webslinger/MAPS/stage_8.webm" },
      { pathId: 9, stageMap: "./assets/video/webslinger/MAPS/stage_9.webm" },
    ],
  },
];

const ROUND_CALL_SOURCES = [
  "./assets/sounds/webslinger/wsdo001.wav",
  "./assets/sounds/webslinger/wsdo002.wav",
];

const CORRECT_CALL_SOURCES = [
  "./assets/sounds/webslinger/wssm012.wav",
  "./assets/sounds/webslinger/wssm013.wav",
  "./assets/sounds/webslinger/wssm014.wav",
  "./assets/sounds/webslinger/wssm015.wav",
  "./assets/sounds/webslinger/wssm016.wav",
];

const MISS_CALL_SOURCES = [
  "./assets/sounds/webslinger/wssm017.wav",
  "./assets/sounds/webslinger/wssm018.wav",
  "./assets/sounds/webslinger/wssm019.wav",
];

const root = document.getElementById("root");
const wrap = document.getElementById("gameWrap");
const cursor = document.getElementById("cursor");
const mainVideo = document.getElementById("mainVideo");
const stageVideo = document.getElementById("stageVideo");
const decisionLine = document.getElementById("decisionLine");
const scoreLabelFallback = document.getElementById("scoreLabelFallback");
const scoreLabelArt = document.getElementById("scoreLabelArt");
const bestScoreValue = document.getElementById("bestScoreValue");
const bestScoreBitmap = document.getElementById("bestScoreBitmap");
const currentScoreValue = document.getElementById("currentScoreValue");
const currentScoreBitmap = document.getElementById("currentScoreBitmap");
const roundLabel = document.getElementById("roundLabel");
const centerText = document.getElementById("centerText");
const stageIntroText = document.getElementById("stageIntroText");
const livesEl = document.getElementById("lives");
const introOverlay = document.getElementById("introOverlay");
const introImage = document.getElementById("introImage");
const introContinue = document.getElementById("introContinue");
const pauseBookBtn = document.getElementById("pauseBookBtn");
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
const tryAgainOverlay = document.getElementById("tryAgainOverlay");
const tryAgainYesOverlay = document.getElementById("tryAgainYesOverlay");
const tryAgainYesHit = document.getElementById("tryAgainYesHit");
const tryAgainNoOverlay = document.getElementById("tryAgainNoOverlay");
const tryAgainNoHit = document.getElementById("tryAgainNoHit");
const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultBody = document.getElementById("resultBody");
const resultRestart = document.getElementById("resultRestart");
const resultMenu = document.getElementById("resultMenu");

const audio = {
  hover: new Audio("./assets/sounds/moclick001.wav"),
  click: new Audio("./assets/sounds/click001.wav"),
  leftClick: new Audio("./assets/sounds/webslinger/leftclick.wav"),
  rightClick: new Audio("./assets/sounds/webslinger/rightclick.wav"),
  miss: new Audio("./assets/sounds/webslinger/miss.wav"),
  intro: new Audio("./assets/sounds/webslinger/wssmintro.wav"),
  ambient: new Audio("./assets/sounds/webslinger/wsamb.wav"),
  music: new Audio(),
  win: new Audio("./assets/sounds/webslinger/wssmwin.wav"),
  lose: new Audio("./assets/sounds/webslinger/wssmlose.wav"),
};

audio.ambient.loop = true;
audio.ambient.volume = 0.34;
audio.music.loop = true;
audio.music.volume = 0.38;

const bestScoreRenderer = createBitmapScoreRenderer({
  container: bestScoreBitmap,
  fallbackEl: bestScoreValue,
});

const currentScoreRenderer = createBitmapScoreRenderer({
  container: currentScoreBitmap,
  fallbackEl: currentScoreValue,
});

const state = {
  scale: 1,
  score: 0,
  bestScore: getModeScore(MODE_KEY),
  lives: MAX_LIVES,
  levelIndex: 0,
  roundIndex: 0,
  pointsToAdd: 50,
  pathDef: null,
  clipIndex: 0,
  decisionIndex: 0,
  currentClip: null,
  awaitingDecision: false,
  decisionResolved: false,
  expectedDirection: null,
  missInProgress: false,
  roundActive: false,
  introOpen: false,
  pauseMenuOpen: false,
  confirmOpen: false,
  tryAgainOpen: false,
  resultOpen: false,
  gameOver: false,
  paused: false,
  startedAmbient: false,
  lineX: 320,
  lineSpeed: 0,
  decisionArmAtSec: 0,
  lastTickTs: 0,
  centerTextTimer: null,
  stageIntroTimer: null,
  resumeAmbient: false,
  resumeMusic: false,
  resumeMainVideo: false,
  resumeStageVideo: false,
};

const lifeSprites = [];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
}

function randomFrom(list) {
  if (!Array.isArray(list) || !list.length) {
    return null;
  }

  return list[Math.floor(Math.random() * list.length)] || null;
}

function playShared(audioEl, volume = 1) {
  if (!audioEl) {
    return;
  }

  audioEl.pause();
  try {
    audioEl.currentTime = 0;
  } catch {}
  audioEl.volume = volume;
  audioEl.play().catch(() => {});
}

function stopShared(audioEl) {
  if (!audioEl) {
    return;
  }

  audioEl.pause();
  try {
    audioEl.currentTime = 0;
  } catch {}
}

function playOneShot(src, volume = 1) {
  if (!src) {
    return;
  }

  const fx = new Audio(src);
  fx.volume = volume;
  fx.play().catch(() => {});
}

function ensureScale() {
  state.scale = Math.min(wrap.clientWidth / BASE_W, wrap.clientHeight / BASE_H);
  root.style.transform = `scale(${state.scale})`;
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

function ensureMusicTrack() {
  const level = LEVELS[state.levelIndex];
  if (!level) {
    return;
  }

  if (audio.music.dataset.src !== level.music) {
    audio.music.src = level.music;
    audio.music.dataset.src = level.music;
  }

  if (state.startedAmbient && !state.paused && !state.resultOpen && !state.introOpen) {
    audio.music.play().catch(() => {});
  }
}

function tryStartAmbient() {
  if (!state.startedAmbient) {
    state.startedAmbient = true;
  }

  if (state.paused || state.resultOpen || state.introOpen) {
    return;
  }

  audio.ambient.play().catch(() => {});
  ensureMusicTrack();
}

function getRoundInfo() {
  const level = LEVELS[state.levelIndex];
  const round = level?.rounds?.[state.roundIndex] ?? null;
  return {
    level,
    round,
  };
}

function getRoundLabelText() {
  const { level } = getRoundInfo();
  const levelText = level?.label ?? "УРОВЕНЬ ?";
  return `${levelText} • РАУНД ${state.roundIndex + 1}`;
}

function updateRoundLabel() {
  roundLabel.textContent = getRoundLabelText();
}

function updateScoreHud() {
  bestScoreValue.textContent = String(state.bestScore);
  bestScoreRenderer.setValue(state.bestScore);
  currentScoreValue.textContent = String(state.score);
  currentScoreRenderer.setValue(state.score);
}

function updateLivesHud() {
  for (let index = 0; index < lifeSprites.length; index += 1) {
    const lifeEl = lifeSprites[index];
    lifeEl.classList.toggle("is-empty", index >= state.lives);
  }
}

function showCenterText(text, durationMs = CENTER_TEXT_MS) {
  window.clearTimeout(state.centerTextTimer);
  centerText.textContent = text;
  setHidden(centerText, false);

  if (durationMs > 0) {
    state.centerTextTimer = window.setTimeout(() => {
      setHidden(centerText, true);
    }, durationMs);
  }
}

function clearCenterText() {
  window.clearTimeout(state.centerTextTimer);
  setHidden(centerText, true);
}

function hideStageIntroText() {
  window.clearTimeout(state.stageIntroTimer);
  stageIntroText.classList.remove("is-animating");
  setHidden(stageIntroText, true);
}

function showStageIntro() {
  const { level } = getRoundInfo();
  const levelText = level?.label ?? "РЈР РћР’Р•РќР¬ ?";
  const roundText = `Р­РўРђРџ ${state.roundIndex + 1}`;

  const levelEl = document.createElement("div");
  levelEl.className = "stage-intro-level";
  levelEl.textContent = levelText;

  const roundEl = document.createElement("div");
  roundEl.className = "stage-intro-round";
  roundEl.textContent = roundText;

  stageIntroText.replaceChildren(levelEl, roundEl);
  stageIntroText.classList.remove("is-animating");
  setHidden(stageIntroText, false);
  void stageIntroText.offsetWidth;
  stageIntroText.classList.add("is-animating");

  window.clearTimeout(state.stageIntroTimer);
  state.stageIntroTimer = window.setTimeout(() => {
    stageIntroText.classList.remove("is-animating");
    setHidden(stageIntroText, true);
  }, STAGE_INTRO_MS);
}

function resetLine() {
  state.awaitingDecision = false;
  state.decisionResolved = false;
  state.expectedDirection = null;
  state.lineSpeed = 0;
  state.decisionArmAtSec = 0;
  setHidden(decisionLine, true);
}

function applyLinePosition() {
  decisionLine.style.left = `${Math.round(state.lineX)}px`;
}

function getDecisionArmDelayMs(clipName) {
  if (typeof clipName !== "string") {
    return 0;
  }

  return DECISION_ARM_DELAY_BY_CLIP_MS[clipName] ?? 0;
}

function isDecisionArmed() {
  if (!state.awaitingDecision) {
    return false;
  }

  return mainVideo.currentTime + DECISION_ARM_EPSILON_SEC >= state.decisionArmAtSec;
}

function beginDecision(clipName) {
  const motion = LINE_MOTION[clipName] || { startX: 320, speed: 0 };
  const expectedDirection = state.pathDef?.expected?.[state.decisionIndex] ?? null;

  if (!expectedDirection) {
    resetLine();
    return;
  }

  state.awaitingDecision = true;
  state.decisionResolved = false;
  state.expectedDirection = expectedDirection;
  const armDelayMs = getDecisionArmDelayMs(clipName);
  state.lineX = motion.startX;
  state.lineSpeed = motion.speed;
  state.decisionArmAtSec = armDelayMs / 1000;
  applyLinePosition();
  setHidden(decisionLine, true);
}

function getSetClipUrl(setKey, clipName) {
  const setMap = CLIP_FILES[setKey] || null;
  const fileName = setMap?.[clipName] || null;
  if (!fileName) {
    return null;
  }

  return `./assets/video/webslinger/${setKey}/${fileName}`;
}

function setVideoSource(videoEl, src) {
  if (videoEl.dataset.src !== src) {
    videoEl.src = src;
    videoEl.dataset.src = src;
  }

  videoEl.currentTime = 0;
}

function playVideo(videoEl, src) {
  if (!src) {
    return;
  }

  setVideoSource(videoEl, src);
  videoEl.play().catch(() => {});
}

function isInputBlocked() {
  return (
    state.paused
    || state.introOpen
    || state.pauseMenuOpen
    || state.confirmOpen
    || state.tryAgainOpen
    || state.resultOpen
    || state.gameOver
  );
}

function addScore(points) {
  state.score += Math.max(0, Math.trunc(points));
  updateScoreHud();
}

function evaluateDecision(direction) {
  if (!state.roundActive || !state.awaitingDecision || state.decisionResolved || isInputBlocked() || state.missInProgress) {
    return;
  }

  state.decisionResolved = true;

  if (direction === state.expectedDirection) {
    addScore(state.pointsToAdd);
    state.pointsToAdd += 120;
    playOneShot(randomFrom(CORRECT_CALL_SOURCES), 0.95);
    showCenterText("ВЕРНО", 500);
    return;
  }

  triggerMiss("ПРОМАХ");
}

function commitDecision(direction) {
  if (!state.roundActive || !state.awaitingDecision || state.decisionResolved || isInputBlocked() || state.missInProgress) {
    return;
  }

  const normalized = direction === "left" ? "left" : "right";

  if (!isDecisionArmed()) {
    return;
  }

  if (normalized === "left") {
    playShared(audio.leftClick, 0.95);
  } else {
    playShared(audio.rightClick, 0.95);
  }

  evaluateDecision(normalized);
}

function triggerMiss(message = "ПРОМАХ") {
  if (state.missInProgress || state.gameOver) {
    return;
  }

  state.missInProgress = true;
  resetLine();
  state.pointsToAdd = 50;
  showCenterText(message, 900);
  playShared(audio.miss, 1);
  playOneShot(randomFrom(MISS_CALL_SOURCES), 0.9);

  const { level } = getRoundInfo();
  const fallSrc = getSetClipUrl(level?.setKey, "Fall");
  state.currentClip = "Fall";
  playVideo(mainVideo, fallSrc);
}

function startClip() {
  if (!state.pathDef || state.clipIndex >= state.pathDef.clips.length || state.gameOver) {
    return;
  }

  const clipName = state.pathDef.clips[state.clipIndex];
  state.currentClip = clipName;

  const { level } = getRoundInfo();
  const src = getSetClipUrl(level?.setKey, clipName);
  if (!src) {
    triggerMiss("ОШИБКА КЛИПА");
    return;
  }

  if (clipName.startsWith("ST")) {
    beginDecision(clipName);
  } else {
    resetLine();
  }

  playVideo(mainVideo, src);
}

function onRoundVictory() {
  resetLine();
  state.roundActive = false;
  state.missInProgress = false;
  showCenterText("ОТЛИЧНО", 900);

  const { level } = getRoundInfo();
  if (!level) {
    endGame("lose");
    return;
  }

  if (state.roundIndex < level.rounds.length - 1) {
    state.roundIndex += 1;
    window.setTimeout(() => {
      if (!state.gameOver) {
        startRound();
      }
    }, 700);
    return;
  }

  if (state.levelIndex < LEVELS.length - 1) {
    state.levelIndex += 1;
    state.roundIndex = 0;
    state.pointsToAdd = 75;

    window.setTimeout(() => {
      if (!state.gameOver) {
        startRound();
      }
    }, 900);
    return;
  }

  endGame("win");
}

function onFallEnded() {
  state.missInProgress = false;
  state.roundActive = false;
  state.lives = Math.max(0, state.lives - 1);
  updateLivesHud();

  if (state.lives <= 0) {
    endGame("lose");
    return;
  }

  showCenterText("ПОПРОБУЙ ЕЩЕ", 1000);
  window.setTimeout(() => {
    if (!state.gameOver) {
      startRound();
    }
  }, 850);
}

function handleMainVideoEnded() {
  if (state.paused || state.introOpen || state.resultOpen) {
    return;
  }

  const clipName = state.currentClip;
  if (!clipName) {
    return;
  }

  if (clipName === "Fall") {
    onFallEnded();
    return;
  }

  if (clipName === "Victory") {
    onRoundVictory();
    return;
  }

  if (clipName.startsWith("ST")) {
    if (!state.decisionResolved) {
      triggerMiss("СЛИШКОМ ПОЗДНО");
      return;
    }

    resetLine();
    state.decisionIndex += 1;
    state.clipIndex += 1;
    startClip();
    return;
  }

  state.clipIndex += 1;
  startClip();
}

function handleMainVideoError() {
  if (state.currentClip === "Fall") {
    onFallEnded();
    return;
  }

  if (state.currentClip === "Victory") {
    onRoundVictory();
    return;
  }

  triggerMiss("ОШИБКА ВИДЕО");
}

function startSlingingRound() {
  setHidden(stageVideo, true);
  state.roundActive = true;
  state.missInProgress = false;
  state.clipIndex = 0;
  state.decisionIndex = 0;

  const { round } = getRoundInfo();
  state.pathDef = PATHS[round?.pathId] || null;
  if (!state.pathDef) {
    endGame("lose");
    return;
  }

  startClip();
}

function handleStageVideoEnded() {
  if (state.paused || state.introOpen || state.resultOpen || state.gameOver) {
    return;
  }

  startSlingingRound();
}

function handleStageVideoError() {
  if (state.gameOver) {
    return;
  }

  startSlingingRound();
}

function startRound() {
  if (state.gameOver) {
    return;
  }

  const { level, round } = getRoundInfo();
  if (!level || !round) {
    endGame("lose");
    return;
  }

  state.roundActive = false;
  state.pathDef = null;
  state.clipIndex = 0;
  state.decisionIndex = 0;
  state.currentClip = null;
  state.missInProgress = false;
  resetLine();
  updateRoundLabel();
  ensureMusicTrack();
  playOneShot(randomFrom(ROUND_CALL_SOURCES), 0.9);
  showCenterText(`${level.label} • РАУНД ${state.roundIndex + 1}`, 1600);
  showStageIntro();

  setHidden(stageVideo, false);
  playVideo(stageVideo, round.stageMap);
}

function openResult(title, body) {
  state.resultOpen = true;
  resultTitle.textContent = title;
  resultBody.textContent = body;
  setHidden(resultOverlay, false);
}

function endGame(result) {
  state.gameOver = true;
  state.roundActive = false;
  resetLine();
  hideStageIntroText();
  mainVideo.pause();
  stageVideo.pause();

  if (result === "win") {
    playShared(audio.win, 1);
  } else {
    playShared(audio.lose, 1);
  }

  state.bestScore = recordModeScore(MODE_KEY, state.score);
  updateScoreHud();

  if (result === "win") {
    openResult("ПОБЕДА", `Ты завершил Web Slinger. Счет: ${state.score}.`);
    return;
  }

  openTryAgainOverlay();
}

function resetRun() {
  state.score = 0;
  state.lives = MAX_LIVES;
  state.levelIndex = 0;
  state.roundIndex = 0;
  state.pointsToAdd = 50;
  state.pathDef = null;
  state.clipIndex = 0;
  state.decisionIndex = 0;
  state.currentClip = null;
  state.awaitingDecision = false;
  state.decisionResolved = false;
  state.expectedDirection = null;
  state.missInProgress = false;
  state.roundActive = false;
  state.pauseMenuOpen = false;
  state.confirmOpen = false;
  state.tryAgainOpen = false;
  state.resultOpen = false;
  state.gameOver = false;
  state.paused = false;
  state.resumeAmbient = false;
  state.resumeMusic = false;
  state.resumeMainVideo = false;
  state.resumeStageVideo = false;

  setHidden(resultOverlay, true);
  setHidden(pauseMenuOverlay, true);
  setHidden(pauseConfirmOverlay, true);
  setHidden(tryAgainOverlay, true);
  hideTryAgainHighlights();
  resetLine();
  clearCenterText();
  hideStageIntroText();
  setBookButtonOpen(false);
  updateScoreHud();
  updateLivesHud();
  updateRoundLabel();
}

function restartRun() {
  resetRun();
  startRound();
  tryStartAmbient();
}

function setPaused(paused) {
  if (state.paused === paused) {
    return;
  }

  state.paused = paused;

  if (paused) {
    state.resumeAmbient = !audio.ambient.paused;
    state.resumeMusic = !audio.music.paused;
    state.resumeMainVideo = !mainVideo.paused;
    state.resumeStageVideo = !stageVideo.paused;

    audio.ambient.pause();
    audio.music.pause();
    mainVideo.pause();
    stageVideo.pause();
    return;
  }

  if (state.resumeAmbient) {
    audio.ambient.play().catch(() => {});
  }

  if (state.resumeMusic) {
    audio.music.play().catch(() => {});
  }

  if (state.resumeMainVideo && !state.resultOpen && !state.introOpen) {
    mainVideo.play().catch(() => {});
  }

  if (state.resumeStageVideo && !state.resultOpen && !state.tryAgainOpen && !state.introOpen) {
    stageVideo.play().catch(() => {});
  }

  state.resumeAmbient = false;
  state.resumeMusic = false;
  state.resumeMainVideo = false;
  state.resumeStageVideo = false;
}

function hidePauseMenuHighlights() {
  pauseResumeOverlay.classList.add("hidden");
  pauseRestartOverlay.classList.add("hidden");
  pauseHelpOverlay.classList.add("hidden");
  pauseMainMenuOverlay.classList.add("hidden");
}

function hideConfirmHighlights() {
  pauseConfirmYesOverlay.classList.add("hidden");
  pauseConfirmNoOverlay.classList.add("hidden");
}

function hideTryAgainHighlights() {
  tryAgainYesOverlay.classList.add("hidden");
  tryAgainNoOverlay.classList.add("hidden");
}

function closeTryAgainOverlay() {
  hideTryAgainHighlights();
  setHidden(tryAgainOverlay, true);
  state.tryAgainOpen = false;
}

function openTryAgainOverlay() {
  hideTryAgainHighlights();
  setHidden(tryAgainOverlay, false);
  state.tryAgainOpen = true;
}

function closePauseMenu({ resumeGameplay = true } = {}) {
  hidePauseMenuHighlights();
  setHidden(pauseMenuOverlay, true);
  state.pauseMenuOpen = false;
  setBookButtonOpen(false);
  if (resumeGameplay) {
    setPaused(false);
  }
}

function closeConfirmOverlay({ resumeGameplay = true } = {}) {
  hideConfirmHighlights();
  setHidden(pauseConfirmOverlay, true);
  state.confirmOpen = false;
  if (resumeGameplay) {
    setPaused(false);
  }
}

function openPauseMenu() {
  if (state.introOpen || state.pauseMenuOpen || state.confirmOpen || state.tryAgainOpen || state.resultOpen || state.gameOver) {
    return;
  }

  setPaused(true);
  hidePauseMenuHighlights();
  setBookButtonOpen(false);
  setHidden(pauseMenuOverlay, false);
  state.pauseMenuOpen = true;
  playShared(audio.click, 0.9);
}

function openConfirmOverlay() {
  if (!state.pauseMenuOpen) {
    return;
  }

  playShared(audio.click, 0.9);
  closePauseMenu({ resumeGameplay: false });
  hideConfirmHighlights();
  setHidden(pauseConfirmOverlay, false);
  state.confirmOpen = true;
}

function bindOverlayButton(hitEl, overlayEl, isActive, onClick) {
  const show = () => {
    if (!isActive()) {
      return;
    }

    overlayEl.classList.remove("hidden");
    playShared(audio.hover, 0.6);
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
  [pauseMenuOverlay, pauseConfirmOverlay, tryAgainOverlay].forEach((layer) => {
    layer.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
    });

    layer.addEventListener("click", (ev) => {
      ev.stopPropagation();
    });
  });

  bindOverlayButton(pauseResumeHit, pauseResumeOverlay, () => state.pauseMenuOpen, () => {
    playShared(audio.click, 0.9);
    closePauseMenu({ resumeGameplay: true });
  });

  bindOverlayButton(pauseRestartHit, pauseRestartOverlay, () => state.pauseMenuOpen, () => {
    playShared(audio.click, 0.9);
    closePauseMenu({ resumeGameplay: false });
    restartRun();
  });

  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseMenuOpen, async () => {
    playShared(audio.click, 0.9);
    closePauseMenu({ resumeGameplay: false });
    await showIntroScreen({ playCloseClick: true, allowEscape: false });
    if (!state.resultOpen && !state.gameOver) {
      setPaused(false);
    }
  });

  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseMenuOpen, openConfirmOverlay);

  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmOpen, () => {
    playShared(audio.click, 0.9);
    window.location.href = "./index.html";
  });

  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmOpen, () => {
    playShared(audio.click, 0.9);
    closeConfirmOverlay({ resumeGameplay: true });
  });
}

function bindTryAgainOverlayButtons() {
  bindOverlayButton(tryAgainYesHit, tryAgainYesOverlay, () => state.tryAgainOpen, () => {
    playShared(audio.click, 0.9);
    closeTryAgainOverlay();
    restartRun();
  });

  bindOverlayButton(tryAgainNoHit, tryAgainNoOverlay, () => state.tryAgainOpen, () => {
    playShared(audio.click, 0.9);
    window.location.href = "./index.html";
  });
}

function canUsePauseBook() {
  return !state.introOpen && !state.pauseMenuOpen && !state.confirmOpen && !state.tryAgainOpen && !state.resultOpen && !state.gameOver;
}

function setBookButtonOpen(isOpen) {
  pauseBookBtn.src = isOpen ? BOOK_OPEN_SRC : BOOK_CLOSED_SRC;
}

function bindPauseBookButton() {
  pauseBookBtn.addEventListener("pointerdown", (ev) => {
    ev.stopPropagation();
  });

  pauseBookBtn.addEventListener("pointerenter", () => {
    if (!canUsePauseBook()) {
      setBookButtonOpen(false);
      return;
    }
    setBookButtonOpen(true);
    playShared(audio.hover, 0.6);
  });

  pauseBookBtn.addEventListener("pointerleave", () => {
    setBookButtonOpen(false);
  });

  pauseBookBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!canUsePauseBook()) {
      setBookButtonOpen(false);
      return;
    }
    setBookButtonOpen(false);
    openPauseMenu();
  });
}

async function showIntroScreen(options = {}) {
  const { playCloseClick = false, allowEscape = true } = options;

  if (state.introOpen) {
    return;
  }

  state.introOpen = true;
  setPaused(true);

  introImage.src = "./assets/art/ui/help/help6WebSling.bmp";
  setHidden(introOverlay, false);
  introOverlay.classList.remove("fade-out");

  playShared(audio.intro, 1);

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
      stopShared(audio.intro);
      if (playCloseClick) {
        playShared(audio.click, 0.9);
      }

      introOverlay.classList.add("fade-out");
      window.setTimeout(() => {
        setHidden(introOverlay, true);
        introOverlay.classList.remove("fade-out");
        state.introOpen = false;
        resolve();
      }, INTRO_FADE_MS);
    };

    const onKeyDown = (ev) => {
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
      window.removeEventListener("keydown", onKeyDown);
    };

    introContinue.addEventListener("click", finish);
    introOverlay.addEventListener("click", finish);
    window.addEventListener("keydown", onKeyDown);
  });
}

function resolvePointerDirection(x) {
  const threshold = clamp(state.lineX, 0, BASE_W);
  return x < threshold ? "left" : "right";
}

function setupGlobalInput() {
  wrap.addEventListener("pointerdown", (ev) => {
    tryStartAmbient();

    if (!state.awaitingDecision || isInputBlocked() || state.missInProgress) {
      return;
    }

    const rect = wrap.getBoundingClientRect();
    const x = (ev.clientX - rect.left) / state.scale;
    commitDecision(resolvePointerDirection(x));
  });

  window.addEventListener("keydown", (ev) => {
    tryStartAmbient();

    if (ev.key === "Escape") {
      ev.preventDefault();

      if (state.introOpen) {
        return;
      }

      if (state.confirmOpen) {
        closeConfirmOverlay({ resumeGameplay: true });
        return;
      }

      if (state.tryAgainOpen) {
        return;
      }

      if (state.pauseMenuOpen) {
        closePauseMenu({ resumeGameplay: true });
        return;
      }

      if (!state.resultOpen && !state.gameOver) {
        openPauseMenu();
      }
      return;
    }

    if (ev.key === "Enter" && state.tryAgainOpen) {
      ev.preventDefault();
      closeTryAgainOverlay();
      restartRun();
      return;
    }

    if (ev.key === "Enter" && state.resultOpen) {
      ev.preventDefault();
      restartRun();
      return;
    }

    if (ev.code === "ArrowLeft" || ev.code === "KeyA") {
      ev.preventDefault();
      commitDecision("left");
      return;
    }

    if (ev.code === "ArrowRight" || ev.code === "KeyD") {
      ev.preventDefault();
      commitDecision("right");
    }
  });
}

function bindResultOverlay() {
  resultRestart.addEventListener("click", () => {
    playShared(audio.click, 0.9);
    restartRun();
  });

  resultMenu.addEventListener("click", () => {
    playShared(audio.click, 0.9);
    window.location.href = "./index.html";
  });
}

function buildLivesHud() {
  livesEl.replaceChildren();
  lifeSprites.length = 0;

  for (let index = 0; index < MAX_LIVES; index += 1) {
    const life = document.createElement("img");
    life.className = "life";
    life.src = "./assets/art/global/life/spideyhead.png";
    life.alt = "";
    life.draggable = false;
    livesEl.appendChild(life);
    lifeSprites.push(life);
  }

  updateLivesHud();
}

function tick(timestamp) {
  if (!state.lastTickTs) {
    state.lastTickTs = timestamp;
  }

  const deltaSeconds = Math.max(0, (timestamp - state.lastTickTs) / 1000);
  state.lastTickTs = timestamp;

  if (!state.paused && state.awaitingDecision && !state.decisionResolved && !state.missInProgress) {
    const decisionArmed = isDecisionArmed();
    if (decisionArmed) {
      if (state.lineSpeed !== 0) {
        state.lineX = clamp(state.lineX + state.lineSpeed * deltaSeconds, 0, BASE_W);
        applyLinePosition();
      }
    }
  }

  window.requestAnimationFrame(tick);
}

async function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCursor();
  setBookButtonOpen(false);
  bindPauseBookButton();
  bindPauseOverlayButtons();
  bindTryAgainOverlayButtons();
  bindResultOverlay();
  setupGlobalInput();
  buildLivesHud();
  updateScoreHud();
  updateRoundLabel();

  mainVideo.addEventListener("ended", handleMainVideoEnded);
  mainVideo.addEventListener("error", handleMainVideoError);
  stageVideo.addEventListener("ended", handleStageVideoEnded);
  stageVideo.addEventListener("error", handleStageVideoError);

  scoreLabelArt.addEventListener(
    "load",
    () => {
      scoreLabelFallback.classList.add("bitmap-score-fallback-hidden");
    },
    { once: true }
  );

  window.requestAnimationFrame(tick);

  const shouldSkipIntroHelp = sessionStorage.getItem(SKIP_HELP_KEY) === SKIP_HELP_VALUE;
  if (shouldSkipIntroHelp) {
    sessionStorage.removeItem(SKIP_HELP_KEY);
  } else {
    await showIntroScreen({ playCloseClick: false, allowEscape: true });
  }

  setPaused(false);
  resetRun();
  startRound();
}

boot().catch((error) => {
  console.error(error);
  showCenterText("ОШИБКА ЗАПУСКА", 0);
});






