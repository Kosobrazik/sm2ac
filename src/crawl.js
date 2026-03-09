import { createBitmapScoreRenderer } from "./bitmap-score.js";
import { getModeScore, recordModeScore } from "./score-store.js";

const BASE_W = 640;
const BASE_H = 480;
const WORLD_H = 2400;
const STEP = 75;
const STEP_FALLBACKS = [60, 45, 30, 15];
const PLAYER_SPEED = 75;
const PLAYER_HITBOX = { ox: 32, oy: 32, w: 41, h: 41 };
const PLAYER_COLLISION_RADIUS = 20;
const MODE_SCORE_KEY = "crawl";
const MAX_MISSES = 3;
const TOP_GOAL_Y = 440;
const CAMERA_LEAD = 250;
const PICKUP_SCORE = 1000;
const CLIMB_SCORE = 1000;
const PICKUP_COLLISION_INSET = 6;
const SKIP_HELP_KEY = "chp_skip_mode_help";
const BOOK_BUTTON_SRC = "./assets/art/ui/book.png";
const BOOK_BUTTON_HOVER_SRC = "./assets/art/ui/bookover.png";
const MISS_FILL_SOURCES = [
  "",
  "./assets/art/global/miss302.png",
  "./assets/art/global/miss303.png",
  "./assets/art/global/miss304.png",
];
const HELP_IMAGE = "./assets/art/ui/help/help1crawl.bmp";
const INTRO_AUDIO = "./assets/sounds/crawl/wcsmintro.wav";
const PICKUP_IMAGE = "./assets/art/crawl/shared/pkup01.png";
const DEBRIS_SOURCES = [
  "./assets/art/crawl/shared/brick1_01.png",
  "./assets/art/crawl/shared/shard2_01.png",
  "./assets/art/crawl/shared/brd1_01.png",
];
const CENTER_TEXT_MS = 2200;
const HIT_RECOVERY_MIN_MS = 7000;
const HIT_RECOVERY_MAX_MS = 9000;
const AUTO_MOVE_SWIPE_THRESHOLD = 26;
const AUTO_MOVE_SWIPE_AXIS_LOCK = 1.25;

const LEVEL_META = [
  {
    index: 0,
    label: "УРОВЕНЬ 1",
    background: "./assets/art/crawl/bldA.png",
    scriptPath: "./legacy/scripts/crawl1.txt",
    start: { x: 268, y: 2054 },
    dropIntervalMs: 1000,
    fallSpeedRange: [260, 390],
    ambient: "./legacy/sounds/crawl/amb01.wav",
    music: "./legacy/sounds/crawl/crawlloop001.wav",
    transitionVideo: "./assets/video/crawl/Trans1.webm",
  },
  {
    index: 1,
    label: "УРОВЕНЬ 2",
    background: "./assets/art/crawl/bldB.png",
    scriptPath: "./legacy/scripts/crawl2.txt",
    start: { x: 263, y: 2101 },
    dropIntervalMs: 950,
    fallSpeedRange: [340, 500],
    ambient: "./legacy/sounds/crawl/amb02.wav",
    music: "./legacy/sounds/crawl/crawlloop002.wav",
    transitionVideo: "./assets/video/crawl/Trans2.webm",
  },
  {
    index: 2,
    label: "УРОВЕНЬ 3",
    background: "./assets/art/crawl/BldC.png",
    scriptPath: "./legacy/scripts/crawl3.txt",
    start: { x: 260, y: 2320 },
    dropIntervalMs: 900,
    fallSpeedRange: [430, 640],
    ambient: "./legacy/sounds/crawl/amb02.wav",
    music: "./legacy/sounds/crawl/crawlloop003.wav",
    transitionVideo: null,
  },
];

const root = document.getElementById("root");
const wrap = document.getElementById("gameWrap");
const world = document.getElementById("world");
const worldViewport = document.getElementById("worldViewport");
const backgroundImage = document.getElementById("backgroundImage");
const decorLayer = document.getElementById("decorLayer");
const pickupLayer = document.getElementById("pickupLayer");
const debrisLayer = document.getElementById("debrisLayer");
const playerEl = document.getElementById("player");
const cursor = document.getElementById("cursor");
const introOverlay = document.getElementById("introOverlay");
const introImage = document.getElementById("introImage");
const introContinue = document.getElementById("introContinue");
const transitionOverlay = document.getElementById("transitionOverlay");
const transitionVideo = document.getElementById("transitionVideo");
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
const scoreLabelFallback = document.getElementById("scoreLabelFallback");
const scoreLabelArt = document.getElementById("scoreLabelArt");
const bestScoreValue = document.getElementById("bestScoreValue");
const bestScoreBitmap = document.getElementById("bestScoreBitmap");
const currentScoreValue = document.getElementById("currentScoreValue");
const currentScoreBitmap = document.getElementById("currentScoreBitmap");
const levelIndicator = document.getElementById("levelIndicator");
const centerText = document.getElementById("centerText");

const audio = {
  hover: new Audio("./assets/sounds/moclick001.wav"),
  uiClick: new Audio("./assets/sounds/click001.wav"),
  intro: new Audio(INTRO_AUDIO),
  move: new Audio("./legacy/sounds/crawl/smcrawl.wav"),
  pickup: new Audio("./legacy/sounds/global/pickup1.wav"),
  start: new Audio("./legacy/sounds/crawl/wcsm001.wav"),
  hurtA: new Audio("./legacy/sounds/crawl/wcsm002.wav"),
  hurtB: new Audio("./legacy/sounds/crawl/wcsm005.wav"),
  win: new Audio("./legacy/sounds/crawl/wcsmwin.wav"),
  lose: new Audio("./legacy/sounds/crawl/wcsmlose.wav"),
  birdHit1: new Audio("./legacy/sounds/crawl/birdhit1.wav"),
  birdHit2: new Audio("./legacy/sounds/crawl/birdhit2.wav"),
  wire1: new Audio("./legacy/sounds/crawl/wirezap1.wav"),
  wire2: new Audio("./legacy/sounds/crawl/wirezap2.wav"),
  octHit1: new Audio("./legacy/sounds/crawl/wcdo002.wav"),
  octHit2: new Audio("./legacy/sounds/crawl/wcdo004.wav"),
  octHit3: new Audio("./legacy/sounds/crawl/wcdo009.wav"),
  loseLife: new Audio("./legacy/sounds/global/loselife.wav"),
};
audio.move.loop = true;

const ui = {
  scoreRenderer: createBitmapScoreRenderer({
    container: bestScoreBitmap,
    fallbackEl: bestScoreValue,
  }),
  currentScoreRenderer: createBitmapScoreRenderer({
    container: currentScoreBitmap,
    fallbackEl: currentScoreValue,
  }),
  life: [],
  bookBtn: null,
  missMeterBase: null,
  missMeterFill: null,
  missLabel: null,
};

const state = {
  score: 0,
  bestScore: getModeScore(MODE_SCORE_KEY),
  lives: 3,
  misses: 0,
  levelIndex: 0,
  currentLevel: null,
  controlsEnabled: false,
  introScreenActive: false,
  pauseMenuOpen: false,
  confirmExitOpen: false,
  paused: false,
  levelTransitionActive: false,
  gameOver: false,
  worldY: 0,
  lastFrameAt: 0,
  rafId: 0,
  timers: new Set(),
  debris: [],
  collectedPickups: new Set(),
  nextDebrisAt: LEVEL_META[0].dropIntervalMs,
  centerTextTimer: null,
  player: {
    x: LEVEL_META[0].start.x,
    y: LEVEL_META[0].start.y,
    dir: "up",
    moving: false,
    targetX: LEVEL_META[0].start.x,
    targetY: LEVEL_META[0].start.y,
    frameIndex: 0,
    frameClock: 0,
    moveScoreGranted: false,
  },
  ambient: {
    music: null,
    ambience: null,
  },
  pauseMediaSnapshot: [],
  moveLoopActive: false,
  hitRecoveryActive: false,
  hitRecoveryTask: null,
  autoMoveDirection: null,
  autoMoveSource: null,
  heldDirections: new Set(),
  swipe: {
    pointerId: null,
    startX: 0,
    startY: 0,
    triggered: false,
  },
};

const animations = {
  up: buildFrameSequence("./assets/art/crawl/CrawlUP/crawlUP", 12),
  down: buildFrameSequence("./assets/art/crawl/CrawlDown/crawlDown", 12),
  left: buildFrameSequence("./assets/art/crawl/CRAWLLEFT/crawlLEFT", 12),
  right: buildFrameSequence("./assets/art/crawl/CRAWLRIGHT/crawlRight", 12),
};

const DIRECTIONS = {
  up: { x: 0, y: -1, anim: "up" },
  right: { x: 1, y: 0, anim: "right" },
  down: { x: 0, y: 1, anim: "down" },
  left: { x: -1, y: 0, anim: "left" },
};

const DIRECTION_KEYS = new Map([
  ["ArrowUp", "up"],
  ["KeyW", "up"],
  ["ArrowRight", "right"],
  ["KeyD", "right"],
  ["ArrowDown", "down"],
  ["KeyS", "down"],
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
]);

function buildFrameSequence(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index).padStart(4, "0")}.png`);
}

function playSound(aud, volume = 1) {
  if (!aud) {
    return;
  }
  aud.pause();
  try {
    aud.currentTime = 0;
  } catch {}
  aud.volume = volume;
  aud.play().catch(() => {});
}

function stopSound(aud) {
  if (!aud) {
    return;
  }
  aud.pause();
  try {
    aud.currentTime = 0;
  } catch {}
}

function randomRangeInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function setPlayerVisible(visible) {
  playerEl.classList.toggle("hidden", !visible);
}

function playOctaviusHitLine() {
  const taunts = [audio.octHit1, audio.octHit2, audio.octHit3];
  const taunt = taunts[Math.floor(Math.random() * taunts.length)];
  playSound(taunt, 0.95);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
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

function canAcceptMovementInput() {
  return !state.paused && !state.levelTransitionActive && !state.introScreenActive && !state.gameOver && !state.pauseMenuOpen && !state.confirmExitOpen && !state.hitRecoveryActive && state.controlsEnabled;
}

function stopAutoMove(source = null) {
  if (source && state.autoMoveSource !== source) {
    return;
  }
  state.autoMoveDirection = null;
  state.autoMoveSource = null;
}

function clearDirectionalInputs() {
  stopAutoMove();
  state.heldDirections.clear();
  state.swipe.pointerId = null;
  state.swipe.startX = 0;
  state.swipe.startY = 0;
  state.swipe.triggered = false;
}

function startAutoMove(direction, source) {
  if (!direction || !DIRECTIONS[direction]) {
    return;
  }
  state.autoMoveDirection = direction;
  state.autoMoveSource = source;
  if (!state.player.moving) {
    tryStartMove(direction);
  }
}

function resolveSwipeDirection(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX === 0 && absY === 0) {
    return null;
  }

  if (absX > absY * AUTO_MOVE_SWIPE_AXIS_LOCK) {
    return dx > 0 ? "right" : "left";
  }
  if (absY > absX * AUTO_MOVE_SWIPE_AXIS_LOCK) {
    return dy > 0 ? "down" : "up";
  }

  return absX >= absY ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
}

function bindSwipeControls() {
  if (!worldViewport) {
    return;
  }

  const resetSwipe = () => {
    state.swipe.pointerId = null;
    state.swipe.startX = 0;
    state.swipe.startY = 0;
    state.swipe.triggered = false;
  };

  worldViewport.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0 || !ev.isPrimary || !canAcceptMovementInput()) {
      return;
    }

    state.swipe.pointerId = ev.pointerId;
    state.swipe.startX = ev.clientX;
    state.swipe.startY = ev.clientY;
    state.swipe.triggered = false;

    try {
      worldViewport.setPointerCapture(ev.pointerId);
    } catch {}
  });

  worldViewport.addEventListener("pointermove", (ev) => {
    if (state.swipe.pointerId !== ev.pointerId || state.swipe.triggered || !canAcceptMovementInput()) {
      return;
    }

    const dx = ev.clientX - state.swipe.startX;
    const dy = ev.clientY - state.swipe.startY;
    if (Math.hypot(dx, dy) < AUTO_MOVE_SWIPE_THRESHOLD) {
      return;
    }

    const direction = resolveSwipeDirection(dx, dy);
    if (!direction) {
      return;
    }

    state.swipe.triggered = true;
    startAutoMove(direction, "mouse");
  });

  const finishSwipe = (ev) => {
    if (state.swipe.pointerId !== ev.pointerId) {
      return;
    }
    resetSwipe();
  };

  worldViewport.addEventListener("pointerup", finishSwipe);
  worldViewport.addEventListener("pointercancel", finishSwipe);
  worldViewport.addEventListener("lostpointercapture", finishSwipe);
}

function scheduleTimeout(callback, delayMs) {
  const task = {
    callback,
    remainingMs: Math.max(0, delayMs),
    active: true,
  };
  state.timers.add(task);
  return task;
}

function clearScheduledTask(task) {
  if (!task) {
    return;
  }
  task.active = false;
  state.timers.delete(task);
}

function updateTimers(deltaMs) {
  [...state.timers].forEach((task) => {
    if (!task.active) {
      state.timers.delete(task);
      return;
    }
    task.remainingMs -= deltaMs;
    if (task.remainingMs > 0) {
      return;
    }
    task.active = false;
    state.timers.delete(task);
    task.callback();
  });
}

function showCenterText(text, durationMs = CENTER_TEXT_MS) {
  clearScheduledTask(state.centerTextTimer);
  centerText.textContent = text;
  centerText.classList.remove("hidden");
  if (durationMs > 0) {
    state.centerTextTimer = scheduleTimeout(() => {
      centerText.textContent = "";
      centerText.classList.add("hidden");
      state.centerTextTimer = null;
    }, durationMs);
  }
}

function clearCenterText() {
  clearScheduledTask(state.centerTextTimer);
  state.centerTextTimer = null;
  centerText.textContent = "";
  centerText.classList.add("hidden");
}

function sprite(src, left, top, zIndex = 1, className = "") {
  const el = document.createElement("img");
  el.src = src;
  el.alt = "";
  el.draggable = false;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.zIndex = String(zIndex);
  if (className) {
    el.className = className;
  }
  return el;
}

function createHudSprites() {
  scoreLabelArt.addEventListener("load", () => {
    scoreLabelFallback.classList.add("bitmap-score-fallback-hidden");
  }, { once: true });

  ui.missMeterBase = sprite("./assets/art/global/miss301.png", 526, 425, 112, "");
  ui.missMeterFill = sprite("./assets/art/global/miss302.png", 526, 425, 113, "");
  ui.missLabel = sprite("./assets/art/global/misstext.png", 533, 457, 113, "");
  ui.missMeterBase.id = "missMeterBase";
  ui.missMeterFill.id = "missMeterFill";
  ui.missLabel.id = "missLabel";
  root.appendChild(ui.missMeterBase);
  root.appendChild(ui.missMeterFill);
  root.appendChild(ui.missLabel);

  [[10, 5], [45, 5], [80, 5]].forEach(([x, y]) => {
    const life = sprite("./assets/art/global/life/spideyhead.png", x, y, 112, "life");
    ui.life.push(life);
    root.appendChild(life);
  });

  ui.bookBtn = sprite(BOOK_BUTTON_SRC, 5, 414, 113, "book-btn");
  ui.bookBtn.dataset.base = BOOK_BUTTON_SRC;
  ui.bookBtn.dataset.hover = BOOK_BUTTON_HOVER_SRC;
  ui.bookBtn.addEventListener("pointerenter", () => {
    if (state.introScreenActive || state.pauseMenuOpen || state.confirmExitOpen) {
      return;
    }
    ui.bookBtn.src = ui.bookBtn.dataset.hover;
    playSound(audio.hover, 0.6);
  });
  ui.bookBtn.addEventListener("pointerleave", () => {
    ui.bookBtn.src = ui.bookBtn.dataset.base;
  });
  ui.bookBtn.addEventListener("click", () => {
    if (!state.introScreenActive && !state.pauseMenuOpen && !state.confirmExitOpen) {
      openPauseMenu();
    }
  });
  root.appendChild(ui.bookBtn);
}

function resolveWallcrawlAssetPath(scriptPath) {
  if (!scriptPath) {
    return null;
  }
  const normalized = scriptPath.replace(/\\/g, "/").replace(/^\.\//, "");
  const withoutArt = normalized.replace(/^art\//i, "");
  const withoutWallcrawl = withoutArt.replace(/^wallcrawl\//i, "");

  if (/\.bmp$/i.test(normalized)) {
    return `./assets/art/crawl/${withoutWallcrawl.replace(/\.bmp$/i, ".png")}`;
  }
  if (/\.bik$/i.test(normalized)) {
    return `./assets/video/crawl/${withoutWallcrawl.replace(/\.bik$/i, ".webm")}`;
  }
  return null;
}

function parseLevelScript(text) {
  const lines = text.split(/\r?\n/);
  const level = {
    blockers: [],
    media: [],
    pickups: [],
  };

  const mediaByName = new Map();
  const hotspotByName = new Map();
  const hazardTypeByName = new Map();
  const pendingSprites = new Map();
  const keyName = (value) => String(value ?? "").toLowerCase();
  let currentSpriteName = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("*")) {
      continue;
    }

    let match = line.match(/^EXECUTE game CreateBlocker (\S+) (-?\d+) (-?\d+) (\d+) (\d+)/i);
    if (match) {
      level.blockers.push({
        name: match[1],
        x: Number(match[2]),
        y: Number(match[3]),
        w: Number(match[4]),
        h: Number(match[5]),
        harmfulType: 0,
      });
      continue;
    }

    match = line.match(/^EXECUTE game CreateFrameBlocker (\S+) (-?\d+) (-?\d+) (.+?\.bmp) (\S+)/i);
    if (match) {
      const media = {
        name: match[1],
        kind: "image",
        x: Number(match[2]),
        y: Number(match[3]),
        src: resolveWallcrawlAssetPath(match[4]),
        solid: false,
        harmfulType: 0,
        hotspot: null,
      };
      level.media.push(media);
      mediaByName.set(keyName(media.name), media);
      continue;
    }

    match = line.match(/^EXECUTE game CreateBinkBlocker (\S+) (-?\d+) (-?\d+) (.+?\.bik) (\S+)/i);
    if (match) {
      const media = {
        name: match[1],
        kind: "video",
        x: Number(match[2]),
        y: Number(match[3]),
        src: resolveWallcrawlAssetPath(match[4]),
        solid: false,
        harmfulType: 0,
        hotspot: null,
      };
      level.media.push(media);
      mediaByName.set(keyName(media.name), media);
      continue;
    }

    match = line.match(/^EXECUTE game CreateBinkSprite (\S+) (-?\d+) (-?\d+) (.+?\.bik) (\S+)/i);
    if (match) {
      const media = {
        name: match[1],
        kind: "video",
        x: Number(match[2]),
        y: Number(match[3]),
        src: resolveWallcrawlAssetPath(match[4]),
        solid: false,
        harmfulType: 0,
        hotspot: null,
      };
      level.media.push(media);
      mediaByName.set(keyName(media.name), media);
      continue;
    }

    match = line.match(/^HOTSPOTAREA (\S+) (-?\d+) (-?\d+) (\d+) (\d+)/i);
    if (match) {
      hotspotByName.set(keyName(match[1]), {
        ox: Number(match[2]),
        oy: Number(match[3]),
        w: Number(match[4]),
        h: Number(match[5]),
      });
      continue;
    }

    match = line.match(/^STORE (\S+) TOUCH EXECUTE Spidey DebrisHit (\d+)/i);
    if (match) {
      hazardTypeByName.set(keyName(match[1]), Number(match[2]));
      continue;
    }

    match = line.match(/^SPRITENAME (\S+)/i);
    if (match) {
      currentSpriteName = match[1];
      const spriteKey = keyName(currentSpriteName);
      if (!pendingSprites.has(spriteKey)) {
        pendingSprites.set(spriteKey, { name: currentSpriteName, src: null, x: null, y: null, show: false });
      }
      continue;
    }

    match = line.match(/^ADDFRAME (\S+) (.+?\.bmp) (\S+)/i);
    if (match && match[1].toLowerCase() === currentSpriteName?.toLowerCase()) {
      const spriteDef = pendingSprites.get(keyName(match[1]));
      if (spriteDef) {
        spriteDef.src = resolveWallcrawlAssetPath(match[2]);
      }
      continue;
    }

    match = line.match(/^SETPOSITION (\S+) (-?\d+) (-?\d+) 0/i);
    if (match) {
      const spriteDef = pendingSprites.get(keyName(match[1]));
      if (spriteDef) {
        spriteDef.x = Number(match[2]);
        spriteDef.y = Number(match[3]);
      }
      if (/^Pickup\d+/i.test(match[1])) {
        level.pickups.push({ id: match[1], x: Number(match[2]), y: Number(match[3]) });
      }
      continue;
    }

    match = line.match(/^SHOW (\S+)/i);
    if (match) {
      const spriteDef = pendingSprites.get(keyName(match[1]));
      if (spriteDef) {
        spriteDef.show = true;
      }
    }
  }

  hotspotByName.forEach((hotspot, name) => {
    const media = mediaByName.get(keyName(name));
    if (media) {
      media.hotspot = hotspot;
    }
  });

  hazardTypeByName.forEach((harmfulType, name) => {
    const media = mediaByName.get(keyName(name));
    if (media) {
      media.harmfulType = harmfulType;
    }
    const blocker = level.blockers.find((item) => keyName(item.name) === keyName(name));
    if (blocker) {
      blocker.harmfulType = harmfulType;
    }
  });

  pendingSprites.forEach((spriteDef) => {
    if (!spriteDef.show || !spriteDef.src || spriteDef.x === null || spriteDef.y === null || mediaByName.has(keyName(spriteDef.name))) {
      return;
    }

    const hotspot = hotspotByName.get(keyName(spriteDef.name)) || null;
    const harmfulType = hazardTypeByName.get(keyName(spriteDef.name)) || 0;

    level.media.push({
      name: spriteDef.name,
      kind: "image",
      x: spriteDef.x,
      y: spriteDef.y,
      src: spriteDef.src,
      solid: Boolean(hotspot) || harmfulType > 0,
      harmfulType,
      hotspot,
    });
  });

  level.media.forEach((media) => {
    media.solid = Boolean(media.hotspot) || media.harmfulType > 0;
  });

  return level;
}
function getPlayerRectAt(x, y) {
  return {
    x: x + PLAYER_HITBOX.ox,
    y: y + PLAYER_HITBOX.oy,
    w: PLAYER_HITBOX.w,
    h: PLAYER_HITBOX.h,
  };
}

function updateHud() {
  const bestText = String(state.bestScore);
  bestScoreValue.textContent = bestText;
  ui.scoreRenderer.setValue(bestText);

  const currentText = String(state.score);
  currentScoreValue.textContent = currentText;
  ui.currentScoreRenderer.setValue(currentText);

  levelIndicator.textContent = LEVEL_META[state.levelIndex]?.label ?? "УРОВЕНЬ";
  updateLives();
  updateMisses();
}

function updateLives() {
  ui.life.forEach((el, index) => {
    el.classList.toggle("hidden", index >= state.lives);
  });
}

function updateMisses() {
  const visible = state.controlsEnabled || state.pauseMenuOpen || state.confirmExitOpen || state.gameOver;
  ui.missMeterBase.classList.toggle("hidden", !visible);
  ui.missLabel.classList.toggle("hidden", !visible);

  if (!visible || state.misses <= 0) {
    ui.missMeterFill.classList.add("hidden");
    return;
  }

  ui.missMeterFill.src = MISS_FILL_SOURCES[Math.min(MAX_MISSES, state.misses)] || MISS_FILL_SOURCES[1];
  ui.missMeterFill.classList.remove("hidden");
}

function addScore(value) {
  state.score = Math.max(0, state.score + value);
  state.bestScore = recordModeScore(MODE_SCORE_KEY, state.score);
  updateHud();
}

function setPlayerFrame(src) {
  playerEl.src = src;
}

function getIdleFrame() {
  switch (state.player.dir) {
    case "left":
      return animations.left[0];
    case "right":
      return animations.right[0];
    case "down":
      return animations.down[0];
    case "up":
    default:
      return animations.up[0];
  }
}

function updatePlayerVisual() {
  playerEl.style.left = `${Math.round(state.player.x)}px`;
  playerEl.style.top = `${Math.round(state.player.y)}px`;
}

function updatePlayerAnimation(deltaMs) {
  if (!state.player.moving) {
    setPlayerFrame(getIdleFrame());
    return;
  }

  const frames = animations[DIRECTIONS[state.player.dir].anim];
  state.player.frameClock += deltaMs;
  if (state.player.frameClock >= 75) {
    state.player.frameClock = 0;
    state.player.frameIndex = (state.player.frameIndex + 1) % frames.length;
  }
  setPlayerFrame(frames[state.player.frameIndex]);
}

function startMoveLoop() {
  if (state.moveLoopActive || state.paused || !state.controlsEnabled) {
    return;
  }

  state.moveLoopActive = true;
  audio.move.volume = 0.58;
  audio.move.play().catch(() => {
    state.moveLoopActive = false;
  });
}

function stopMoveLoop() {
  if (!state.moveLoopActive) {
    return;
  }

  state.moveLoopActive = false;
  stopSound(audio.move);
}

function getCollisionRect(item) {
  if (item.hotspot) {
    return {
      x: item.x + item.hotspot.ox,
      y: item.y + item.hotspot.oy,
      w: item.hotspot.w,
      h: item.hotspot.h,
    };
  }

  if (item.contentBounds) {
    return {
      x: item.x + item.contentBounds.ox,
      y: item.y + item.contentBounds.oy,
      w: item.contentBounds.w,
      h: item.contentBounds.h,
    };
  }

  if (item.w && item.h) {
    return { x: item.x, y: item.y, w: item.w, h: item.h };
  }

  return {
    x: item.x,
    y: item.y,
    w: item.renderWidth || 64,
    h: item.renderHeight || 64,
  };
}

function extractOpaqueBounds(imageEl) {
  const width = imageEl.naturalWidth || 0;
  const height = imageEl.naturalHeight || 0;
  if (!width || !height) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  context.drawImage(imageEl, 0, 0);
  const data = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 8) {
        continue;
      }
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    ox: minX,
    oy: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

function getPlayerCollisionCircleAt(x, y) {
  const rect = getPlayerRectAt(x, y);
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
    r: PLAYER_COLLISION_RADIUS,
  };
}

function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function findBlockingCollisionAt(x, y) {
  const playerCircle = getPlayerCollisionCircleAt(x, y);

  for (const blocker of state.currentLevel.blockers) {
    if (circleIntersectsRect(playerCircle, getCollisionRect(blocker))) {
      return blocker;
    }
  }

  for (const media of state.currentLevel.media) {
    if (!media.solid) {
      continue;
    }
    if (circleIntersectsRect(playerCircle, getCollisionRect(media))) {
      return media;
    }
  }

  return null;
}
function findPartialMoveTarget(fromX, fromY, toX, toY) {
  const steps = Math.ceil(Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY)));
  if (steps <= 1) {
    return null;
  }

  let bestX = fromX;
  let bestY = fromY;

  for (let index = 1; index <= steps; index += 1) {
    const ratio = index / steps;
    const sampleX = fromX + (toX - fromX) * ratio;
    const sampleY = fromY + (toY - fromY) * ratio;
    const collision = findBlockingCollisionAt(sampleX, sampleY);
    if (collision) {
      break;
    }
    bestX = sampleX;
    bestY = sampleY;
  }

  const moved = Math.hypot(bestX - fromX, bestY - fromY);
  if (moved < 6) {
    return null;
  }

  return { x: bestX, y: bestY };
}

function registerMiss(harmfulType = 0) {
  state.misses = Math.min(MAX_MISSES, state.misses + 1);
  updateMisses();

  if (harmfulType === 2) {
    playSound(Math.random() < 0.5 ? audio.wire1 : audio.wire2, 0.75);
  } else if (harmfulType === 1) {
    playSound(Math.random() < 0.5 ? audio.birdHit1 : audio.birdHit2, 0.75);
  }

  playSound(Math.random() < 0.5 ? audio.hurtA : audio.hurtB, 0.9);

  const lostLife = state.misses >= MAX_MISSES;
  if (!lostLife) {
    return { lostLife: false, lostAllLives: false };
  }

  state.lives = Math.max(0, state.lives - 1);
  state.misses = 0;
  updateHud();
  playSound(audio.loseLife, 0.9);

  return {
    lostLife: true,
    lostAllLives: state.lives <= 0,
  };
}

function resetPlayerToStart() {
  const start = LEVEL_META[state.levelIndex].start;
  state.player.x = start.x;
  state.player.y = start.y;
  state.player.targetX = start.x;
  state.player.targetY = start.y;
  state.player.moving = false;
  state.player.frameIndex = 0;
  state.player.frameClock = 0;
  updatePlayerVisual();
  updateCamera();
  stopMoveLoop();
}

function handlePlayerHit(harmfulType = 0) {
  if (state.levelTransitionActive || state.gameOver || state.paused || state.hitRecoveryActive) {
    return;
  }

  state.controlsEnabled = false;
  state.hitRecoveryActive = true;
  clearDirectionalInputs();
  stopMoveLoop();
  state.player.moving = false;
  state.debris.forEach((debris) => debris.el.remove());
  state.debris = [];

  const missResult = registerMiss(harmfulType);
  if (missResult.lostAllLives) {
    state.hitRecoveryActive = false;
    endGame("lose");
    return;
  }

  if (missResult.lostLife) {
    showCenterText("ПОТЕРЯ ЖИЗНИ", 1500);
    clearScheduledTask(state.hitRecoveryTask);
    state.hitRecoveryTask = scheduleTimeout(() => {
      resetPlayerToStart();
      setPlayerVisible(true);
      state.controlsEnabled = true;
      state.hitRecoveryActive = false;
      state.hitRecoveryTask = null;
    }, 1300);
    return;
  }

  const recoveryMs = randomRangeInt(HIT_RECOVERY_MIN_MS, HIT_RECOVERY_MAX_MS);
  playOctaviusHitLine();
  setPlayerVisible(false);
  showCenterText("ПРОМАХ", 1200);

  clearScheduledTask(state.hitRecoveryTask);
  state.hitRecoveryTask = scheduleTimeout(() => {
    setPlayerVisible(true);
    if (!state.gameOver) {
      state.controlsEnabled = true;
    }
    state.hitRecoveryActive = false;
    state.hitRecoveryTask = null;
  }, recoveryMs);
}

function stopPlayerMovement() {
  if (!state.player.moving) {
    return;
  }

  state.player.targetX = state.player.x;
  state.player.targetY = state.player.y;
  state.player.moving = false;
  updatePlayerVisual();
  stopMoveLoop();
}

function tryStartMove(direction) {
  if (!direction || !DIRECTIONS[direction]) {
    return false;
  }

  if (state.paused || state.levelTransitionActive || state.introScreenActive || state.gameOver || !state.controlsEnabled) {
    return false;
  }

  if (state.player.moving) {
    return false;
  }

  const delta = DIRECTIONS[direction];
  const minX = 0;
  const maxX = BASE_W - (PLAYER_HITBOX.ox + PLAYER_HITBOX.w);
  const minY = 0;
  const maxY = WORLD_H - (PLAYER_HITBOX.oy + PLAYER_HITBOX.h);
  const stepCandidates = [STEP, ...STEP_FALLBACKS];
  let chosen = null;
  let harmfulCollision = null;

  state.player.dir = direction;
  state.player.frameIndex = 0;
  state.player.frameClock = 0;

  for (const distance of stepCandidates) {
    const nextX = clamp(state.player.x + delta.x * distance, minX, maxX);
    const nextY = clamp(state.player.y + delta.y * distance, minY, maxY);
    if (nextX === state.player.x && nextY === state.player.y) {
      continue;
    }

    const collision = findBlockingCollisionAt(nextX, nextY);
    if (!collision) {
      chosen = { x: nextX, y: nextY };
      break;
    }

    if (collision.harmfulType > 0) {
      if (!harmfulCollision) {
        harmfulCollision = collision;
      }
      continue;
    }

    const partial = findPartialMoveTarget(state.player.x, state.player.y, nextX, nextY);
    if (partial) {
      chosen = partial;
      break;
    }
  }

  if (!chosen) {
    if (harmfulCollision) {
      handlePlayerHit(harmfulCollision.harmfulType);
    }
    updatePlayerAnimation(0);
    return false;
  }

  state.player.targetX = chosen.x;
  state.player.targetY = chosen.y;
  state.player.moving = true;
  state.player.moveScoreGranted = false;
  startMoveLoop();
  return true;
}

function continueAutoMove() {
  if (!state.autoMoveDirection || state.player.moving) {
    return;
  }
  if (!canAcceptMovementInput()) {
    return;
  }

  const moved = tryStartMove(state.autoMoveDirection);
  if (!moved && !state.hitRecoveryActive) {
    stopAutoMove();
  }
}

function updatePlayerMovement(deltaSec) {
  if (!state.player.moving) {
    return;
  }

  const distance = PLAYER_SPEED * deltaSec;
  const dx = state.player.targetX - state.player.x;
  const dy = state.player.targetY - state.player.y;
  const remaining = Math.hypot(dx, dy);

  if (remaining <= distance) {
    const movedUp = state.player.targetY < state.player.y;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;
    state.player.moving = false;
    updatePlayerVisual();
    stopMoveLoop();

    if (movedUp && !state.player.moveScoreGranted) {
      addScore(CLIMB_SCORE);
    }

    checkPickups();
    maybeCompleteLevel();
    return;
  }

  if (dy < 0 && !state.player.moveScoreGranted) {
    state.player.moveScoreGranted = true;
    addScore(CLIMB_SCORE);
  }

  const ratio = distance / remaining;
  state.player.x += dx * ratio;
  state.player.y += dy * ratio;
  updatePlayerVisual();
  checkPickups();
}

function createMediaElement(media) {
  const el = media.kind === "video" ? document.createElement("video") : document.createElement("img");
  el.className = "world-media" + (media.kind === "video" ? " video" : "");
  el.style.left = `${media.x}px`;
  el.style.top = `${media.y}px`;
  el.style.zIndex = media.solid ? "36" : "30";
  media.el = el;

  if (media.kind === "video") {
    el.src = media.src;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = "auto";
    el.addEventListener("loadedmetadata", () => {
      media.renderWidth = el.videoWidth || 64;
      media.renderHeight = el.videoHeight || 64;
    });
    el.play().catch(() => {});
  } else {
    el.src = media.src;
    el.alt = "";
    el.addEventListener("load", () => {
      media.renderWidth = el.naturalWidth || 64;
      media.renderHeight = el.naturalHeight || 64;
      if (media.solid && !media.hotspot) {
        media.contentBounds = extractOpaqueBounds(el);
      }
    });
  }

  decorLayer.appendChild(el);
}

function createPickupElement(pickup) {
  const el = document.createElement("img");
  el.className = "pickup";
  el.src = PICKUP_IMAGE;
  el.alt = "";
  el.draggable = false;
  el.style.left = `${pickup.x}px`;
  el.style.top = `${pickup.y}px`;
  el.addEventListener("load", () => {
    pickup.renderWidth = el.naturalWidth || 38;
    pickup.renderHeight = el.naturalHeight || 38;
    pickup.contentBounds = extractOpaqueBounds(el);
  });
  pickup.el = el;
  pickupLayer.appendChild(el);
}

function renderLevel(level) {
  state.currentLevel = level;
  state.collectedPickups = new Set();
  decorLayer.replaceChildren();
  pickupLayer.replaceChildren();
  debrisLayer.replaceChildren();
  state.debris = [];
  backgroundImage.src = LEVEL_META[state.levelIndex].background;

  level.media.forEach((media) => createMediaElement(media));
  level.pickups.forEach((pickup) => createPickupElement(pickup));

  playerEl.classList.remove("hidden");
  setPlayerFrame(getIdleFrame());
  updatePlayerVisual();
  updateCamera();
}

function getPickupCollisionRect(pickup) {
  const bounds = pickup.contentBounds
    ? pickup.contentBounds
    : {
        ox: 0,
        oy: 0,
        w: pickup.renderWidth || 38,
        h: pickup.renderHeight || 38,
      };

  const insetX = Math.min(PICKUP_COLLISION_INSET, Math.floor(bounds.w / 4));
  const insetY = Math.min(PICKUP_COLLISION_INSET, Math.floor(bounds.h / 4));

  return {
    x: pickup.x + bounds.ox + insetX,
    y: pickup.y + bounds.oy + insetY,
    w: Math.max(8, bounds.w - insetX * 2),
    h: Math.max(8, bounds.h - insetY * 2),
  };
}

function checkPickups() {
  const playerRect = getPlayerRectAt(state.player.x, state.player.y);

  state.currentLevel.pickups.forEach((pickup) => {
    if (state.collectedPickups.has(pickup.id)) {
      return;
    }
    if (!rectsIntersect(playerRect, getPickupCollisionRect(pickup))) {
      return;
    }

    state.collectedPickups.add(pickup.id);
    pickup.el?.remove();
    addScore(PICKUP_SCORE);
    playSound(audio.pickup, 0.8);
    showCenterText("БОНУС", 1000);
  });
}

function spawnDebris() {
  if (state.paused || state.levelTransitionActive || state.gameOver || !state.controlsEnabled) {
    return;
  }

  const [minSpeed, maxSpeed] = LEVEL_META[state.levelIndex].fallSpeedRange;
  const debris = {
    x: Math.random() * (BASE_W - 50),
    y: Math.max(0, state.player.y - 300),
    speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
    spin: (Math.random() * 180 + 90) * (Math.random() > 0.5 ? 1 : -1),
    angle: Math.random() * 360,
    w: 28,
    h: 28,
  };

  debris.el = document.createElement("img");
  debris.el.className = "debris";
  debris.el.src = DEBRIS_SOURCES[Math.floor(Math.random() * DEBRIS_SOURCES.length)];
  debris.el.alt = "";
  debris.el.draggable = false;
  debrisLayer.appendChild(debris.el);
  state.debris.push(debris);
}

function getDebrisRect(debris) {
  return { x: debris.x + 4, y: debris.y + 4, w: debris.w, h: debris.h };
}

function updateDebris(deltaSec) {
  const playerRect = getPlayerRectAt(state.player.x, state.player.y);

  state.debris = state.debris.filter((debris) => {
    debris.y += debris.speed * deltaSec;
    debris.angle += debris.spin * deltaSec;
    debris.el.style.left = `${Math.round(debris.x)}px`;
    debris.el.style.top = `${Math.round(debris.y)}px`;
    debris.el.style.transform = `rotate(${Math.round(debris.angle)}deg)`;

    if (rectsIntersect(playerRect, getDebrisRect(debris))) {
      debris.el.remove();
      handlePlayerHit(0);
      return false;
    }

    if (debris.y > WORLD_H + 120) {
      debris.el.remove();
      return false;
    }

    return true;
  });
}

function updateCamera() {
  state.worldY = clamp(state.player.y - CAMERA_LEAD, 0, WORLD_H - BASE_H);
  world.style.transform = `translateY(${-Math.round(state.worldY)}px)`;
}

function stopAmbientAudio() {
  stopSound(state.ambient.music);
  stopSound(state.ambient.ambience);
  state.ambient.music = null;
  state.ambient.ambience = null;
}

function startAmbientAudio() {
  stopAmbientAudio();
  const meta = LEVEL_META[state.levelIndex];
  state.ambient.music = new Audio(meta.music);
  state.ambient.ambience = new Audio(meta.ambient);
  state.ambient.music.loop = true;
  state.ambient.ambience.loop = true;
  state.ambient.music.volume = 0.28;
  state.ambient.ambience.volume = 0.45;
  state.ambient.music.play().catch(() => {});
  state.ambient.ambience.play().catch(() => {});
}
function maybeCompleteLevel() {
  if (state.levelTransitionActive || state.gameOver) {
    return;
  }
  if (state.player.y > TOP_GOAL_Y) {
    return;
  }
  completeLevel().catch((err) => {
    console.error(err);
    endGame("win");
  });
}

function playTransitionVideo(src) {
  if (!src) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    let timeoutTask = null;

    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      clearScheduledTask(timeoutTask);
      transitionVideo.pause();
      transitionOverlay.classList.add("hidden");
      transitionVideo.removeEventListener("ended", finish);
      transitionVideo.removeEventListener("error", finish);
      resolve();
    };

    transitionOverlay.classList.remove("hidden");
    transitionVideo.src = src;
    transitionVideo.currentTime = 0;
    transitionVideo.addEventListener("ended", finish);
    transitionVideo.addEventListener("error", finish);
    timeoutTask = scheduleTimeout(finish, 6500);
    transitionVideo.play().catch(() => finish());
  });
}

async function completeLevel() {
  state.levelTransitionActive = true;
  state.controlsEnabled = false;
  clearDirectionalInputs();
  stopMoveLoop();
  stopAmbientAudio();
  state.debris.forEach((debris) => debris.el.remove());
  state.debris = [];

  const currentMeta = LEVEL_META[state.levelIndex];
  const isLastLevel = state.levelIndex >= LEVEL_META.length - 1;

  if (isLastLevel) {
    endGame("win");
    return;
  }

  playSound(audio.win, 0.85);
  showCenterText(`${currentMeta.label} ПРОЙДЕН`, 1800);
  await playTransitionVideo(currentMeta.transitionVideo);

  state.levelIndex += 1;
  await loadLevel(state.levelIndex);
  state.levelTransitionActive = false;
}

function setGameplayPaused(paused) {
  if (state.paused === paused) {
    return;
  }

  state.paused = paused;
  if (paused) {
    stopMoveLoop();
    const media = [state.ambient.music, state.ambient.ambience, transitionVideo, ...decorLayer.querySelectorAll("video")];
    state.pauseMediaSnapshot = media
      .filter((el) => el && !el.paused && !el.ended)
      .map((el) => ({ el, time: Number.isFinite(el.currentTime) ? el.currentTime : 0 }));
    state.pauseMediaSnapshot.forEach(({ el }) => el.pause());
    return;
  }

  const snapshot = state.pauseMediaSnapshot;
  state.pauseMediaSnapshot = [];
  snapshot.forEach(({ el, time }) => {
    try {
      el.currentTime = time;
    } catch {}
    el.play().catch(() => {});
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

function closePauseOverlays() {
  pauseMenuOverlay.classList.add("hidden");
  pauseConfirmOverlay.classList.add("hidden");
  state.pauseMenuOpen = false;
  state.confirmExitOpen = false;
  hidePauseMenuHighlights();
  hidePauseConfirmHighlights();
}

function openPauseMenu() {
  if (state.introScreenActive || state.pauseMenuOpen || state.confirmExitOpen || state.levelTransitionActive) {
    return;
  }

  clearDirectionalInputs();
  setGameplayPaused(true);
  closePauseOverlays();
  pauseMenuOverlay.classList.remove("hidden");
  state.pauseMenuOpen = true;
  playSound(audio.uiClick, 0.85);
}

function resumeFromPauseMenu() {
  playSound(audio.uiClick, 0.85);
  closePauseOverlays();
  setGameplayPaused(false);
}

function openPauseConfirm() {
  playSound(audio.uiClick, 0.85);
  pauseMenuOverlay.classList.add("hidden");
  pauseConfirmOverlay.classList.remove("hidden");
  state.pauseMenuOpen = false;
  state.confirmExitOpen = true;
}

function closePauseConfirmAndResume() {
  playSound(audio.uiClick, 0.85);
  closePauseOverlays();
  setGameplayPaused(false);
}

function restartGame() {
  playSound(audio.uiClick, 0.85);
  sessionStorage.removeItem(SKIP_HELP_KEY);
  window.location.href = "./crawl.html";
}

function exitToMainMenu() {
  playSound(audio.uiClick, 0.85);
  sessionStorage.removeItem(SKIP_HELP_KEY);
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
    if (isActive()) {
      onClick();
    }
  });
}

function bindPauseOverlayButtons() {
  [pauseMenuOverlay, pauseConfirmOverlay].forEach((el) => {
    el.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    el.addEventListener("click", (ev) => ev.stopPropagation());
  });

  bindOverlayButton(pauseResumeHit, pauseResumeOverlay, () => state.pauseMenuOpen, resumeFromPauseMenu);
  bindOverlayButton(pauseRestartHit, pauseRestartOverlay, () => state.pauseMenuOpen, restartGame);
  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseMenuOpen, () => {
    playSound(audio.uiClick, 0.85);
    pauseMenuOverlay.classList.add("hidden");
    state.pauseMenuOpen = false;
    showIntroScreen({ resumeAfterClose: true, playCloseClick: true, allowEscape: false }).catch(() => {});
  });
  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseMenuOpen, openPauseConfirm);
  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmExitOpen, exitToMainMenu);
  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmExitOpen, closePauseConfirmAndResume);
}

async function showIntroScreen(options = {}) {
  const { resumeAfterClose = false, playCloseClick = false, allowEscape = true } = options;
  if (state.introScreenActive) {
    return;
  }

  state.introScreenActive = true;
  introImage.src = HELP_IMAGE;
  introOverlay.classList.remove("hidden");
  introOverlay.classList.remove("fade-out");
  playSound(audio.intro, 0.95);

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
      stopSound(audio.intro);
      if (playCloseClick) {
        playSound(audio.uiClick, 0.85);
      }
      cleanup();
      introOverlay.classList.add("fade-out");
      scheduleTimeout(() => {
        introOverlay.classList.add("hidden");
        introOverlay.classList.remove("fade-out");
        state.introScreenActive = false;
        if (resumeAfterClose) {
          setGameplayPaused(false);
        }
        resolve();
      }, 380);
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

async function loadLevel(levelIndex) {
  state.levelIndex = levelIndex;
  const meta = LEVEL_META[levelIndex];
  const res = await fetch(meta.scriptPath);
  if (!res.ok) {
    throw new Error(`Failed to load crawl script: ${meta.scriptPath}`);
  }

  const level = parseLevelScript(await res.text());
  renderLevel(level);
  resetPlayerToStart();
  startAmbientAudio();
  updateHud();
  state.controlsEnabled = false;
  state.nextDebrisAt = LEVEL_META[levelIndex].dropIntervalMs;
  showCenterText(meta.label, 1500);
  scheduleTimeout(() => {
    playSound(audio.start, 0.9);
    state.controlsEnabled = true;
  }, 1100);
}

function endGame(result) {
  state.gameOver = true;
  state.controlsEnabled = false;
  state.levelTransitionActive = false;
  state.hitRecoveryActive = false;
  clearScheduledTask(state.hitRecoveryTask);
  state.hitRecoveryTask = null;
  clearDirectionalInputs();
  setPlayerVisible(true);
  stopMoveLoop();
  stopAmbientAudio();

  if (result === "win") {
    playSound(audio.win, 0.95);
    showCenterText("ПОБЕДА", 0);
  } else {
    playSound(audio.lose, 0.95);
    showCenterText("ПРОВАЛ", 0);
  }

  state.bestScore = recordModeScore(MODE_SCORE_KEY, state.score);
  updateHud();
}

function handleKeyDown(ev) {
  if (state.introScreenActive) {
    return;
  }

  if (ev.key === "Escape") {
    ev.preventDefault();
    if (state.pauseMenuOpen) {
      resumeFromPauseMenu();
      return;
    }
    if (state.confirmExitOpen) {
      closePauseConfirmAndResume();
      return;
    }
    if (!state.gameOver) {
      openPauseMenu();
      return;
    }
  }

  if (state.pauseMenuOpen || state.confirmExitOpen || state.paused) {
    return;
  }

  if (state.gameOver && ev.key === "Enter") {
    restartGame();
    return;
  }

  const direction = DIRECTION_KEYS.get(ev.code);
  if (!direction) {
    return;
  }
  if (!canAcceptMovementInput()) {
    return;
  }

  ev.preventDefault();
  state.heldDirections.delete(direction);
  state.heldDirections.add(direction);
  startAutoMove(direction, "keyboard");
}

function handleKeyUp(ev) {
  if (state.pauseMenuOpen || state.confirmExitOpen || state.paused || state.levelTransitionActive || state.introScreenActive) {
    return;
  }

  const direction = DIRECTION_KEYS.get(ev.code);
  if (!direction) {
    return;
  }
  if (!canAcceptMovementInput()) {
    return;
  }

  ev.preventDefault();
  state.heldDirections.delete(direction);

  if (state.autoMoveSource !== "keyboard" || state.autoMoveDirection !== direction) {
    return;
  }

  const held = [...state.heldDirections];
  const fallbackDirection = held.length > 0 ? held[held.length - 1] : null;
  if (fallbackDirection) {
    startAutoMove(fallbackDirection, "keyboard");
    return;
  }

  stopAutoMove("keyboard");
  if (state.player.moving && state.player.dir === direction) {
    stopPlayerMovement();
  }
}

function tick(timestamp) {
  if (!state.lastFrameAt) {
    state.lastFrameAt = timestamp;
  }

  const deltaMs = timestamp - state.lastFrameAt;
  state.lastFrameAt = timestamp;

  if (!state.paused) {
    updateTimers(deltaMs);
    updatePlayerMovement(deltaMs / 1000);
    continueAutoMove();
    updatePlayerAnimation(deltaMs);
    updateDebris(deltaMs / 1000);
    updateCamera();

    if (state.controlsEnabled && !state.levelTransitionActive && !state.gameOver) {
      state.nextDebrisAt -= deltaMs;
      if (state.nextDebrisAt <= 0) {
        spawnDebris();
        state.nextDebrisAt += LEVEL_META[state.levelIndex].dropIntervalMs;
      }
    }
  }

  state.rafId = window.requestAnimationFrame(tick);
}

async function startGame() {
  state.score = 0;
  state.lives = 3;
  state.misses = 0;
  state.levelIndex = 0;
  state.gameOver = false;
  state.levelTransitionActive = false;
  state.controlsEnabled = false;
  state.hitRecoveryActive = false;
  clearScheduledTask(state.hitRecoveryTask);
  state.hitRecoveryTask = null;
  clearDirectionalInputs();
  setPlayerVisible(true);
  state.nextDebrisAt = LEVEL_META[0].dropIntervalMs;
  state.lastFrameAt = 0;
  state.timers.forEach((task) => {
    task.active = false;
  });
  state.timers.clear();
  clearCenterText();
  closePauseOverlays();
  setGameplayPaused(false);
  updateHud();

  if (sessionStorage.getItem(SKIP_HELP_KEY) === "crawl") {
    sessionStorage.removeItem(SKIP_HELP_KEY);
    introOverlay.classList.add("hidden");
    state.introScreenActive = false;
  } else {
    await showIntroScreen();
  }

  await loadLevel(0);
}

async function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCursor();
  bindSwipeControls();
  createHudSprites();
  bindPauseOverlayButtons();
  updateHud();
  updatePlayerVisual();
  playerEl.classList.remove("hidden");
  setPlayerFrame(getIdleFrame());

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("pointerdown", () => {
    state.ambient.music?.play().catch(() => {});
    state.ambient.ambience?.play().catch(() => {});
  });

  await startGame();
  state.rafId = window.requestAnimationFrame(tick);
}

boot().catch((err) => {
  console.error(err);
  showCenterText("ОШИБКА", 0);
});






















