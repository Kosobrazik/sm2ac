const STORAGE_KEY = "chp_mode_scores_v1";

const MODE_KEYS = Object.freeze([
  "crawl",
  "crook",
  "heist",
  "lab101",
  "mugshot",
  "ware",
  "websling",
]);

const TARGET_SCRIPT_TO_MODE_KEY = Object.freeze({
  "crawl.txt": "crawl",
  "crook.txt": "crook",
  "heist.txt": "heist",
  "lab101.txt": "lab101",
  "mugshot.txt": "mugshot",
  "ware.txt": "ware",
  "websling.txt": "websling",
});

const ORIGINAL_DEFAULT_SCORES = Object.freeze({
  crawl: 13000,
  crook: 0,
  heist: 0,
  lab101: 0,
  mugshot: 0,
  ware: 500,
  websling: 270,
});

function sanitizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric);
}

function createDefaultScores() {
  return Object.fromEntries(MODE_KEYS.map((modeKey) => [modeKey, sanitizeScore(ORIGINAL_DEFAULT_SCORES[modeKey])]))
}

function normalizeModeKey(modeKey) {
  if (typeof modeKey !== "string") {
    return null;
  }

  const normalized = modeKey.trim().toLowerCase();
  return MODE_KEYS.includes(normalized) ? normalized : null;
}

function normalizeScoreMap(value) {
  const scores = createDefaultScores();

  if (!value || typeof value !== "object") {
    return scores;
  }

  MODE_KEYS.forEach((modeKey) => {
    scores[modeKey] = sanitizeScore(value[modeKey] ?? scores[modeKey]);
  });

  return scores;
}

function readScoreMap() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultScores();
    }

    return normalizeScoreMap(JSON.parse(raw));
  } catch {
    return createDefaultScores();
  }
}

function writeScoreMap(scores) {
  const normalizedScores = normalizeScoreMap(scores);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedScores));
  } catch {}

  return normalizedScores;
}

export function getModeScore(modeKey) {
  const normalizedModeKey = normalizeModeKey(modeKey);
  if (!normalizedModeKey) {
    return 0;
  }

  return readScoreMap()[normalizedModeKey] ?? 0;
}

export function setModeScore(modeKey, value) {
  const normalizedModeKey = normalizeModeKey(modeKey);
  if (!normalizedModeKey) {
    return 0;
  }

  const scores = readScoreMap();
  scores[normalizedModeKey] = sanitizeScore(value);
  writeScoreMap(scores);
  return scores[normalizedModeKey];
}

export function recordModeScore(modeKey, value) {
  const normalizedModeKey = normalizeModeKey(modeKey);
  if (!normalizedModeKey) {
    return 0;
  }

  const scores = readScoreMap();
  scores[normalizedModeKey] = Math.max(scores[normalizedModeKey] ?? 0, sanitizeScore(value));
  writeScoreMap(scores);
  return scores[normalizedModeKey];
}

export function getModeKeyFromTargetScript(targetScript) {
  if (typeof targetScript !== "string") {
    return null;
  }

  return TARGET_SCRIPT_TO_MODE_KEY[targetScript.trim().toLowerCase()] ?? null;
}

export function getMenuItemScore(item) {
  const modeKey = getModeKeyFromTargetScript(item?.targetScript);
  if (!modeKey) {
    return 0;
  }

  return getModeScore(modeKey);
}
