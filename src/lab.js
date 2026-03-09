import { createBitmapScoreRenderer } from "./bitmap-score.js";
import { getModeScore, recordModeScore } from "./score-store.js";

const BASE_W = 640;
const BASE_H = 480;
const MODE_KEY = "lab101";
const SKIP_HELP_KEY = "chp_skip_lab_help";
const INTRO_FADE_MS = 380;
const TIMER_SECONDS = 90;
const MAX_LIVES = 3;
const HEAT_INTERVAL_MS = 700;

const PATHS = {
  helpImage: "./assets/art/ui/help/help4lab.bmp",
  helpVoice: "./assets/sounds/labwork/lwppintro.wav",
  life: "./assets/art/global/life/spideyhead.png",
  hover: "./assets/sounds/moclick001.wav",
  click: "./assets/sounds/click001.wav",
  ambient: "./legacy/sounds/labwork/labloop001.wav",
  heatStart: "./legacy/sounds/labwork/heaton.wav",
  heatLoop: "./legacy/sounds/labwork/heat.wav",
  fail: "./legacy/sounds/labwork/labmiss.wav",
  success: "./legacy/sounds/labwork/poof.wav",
  pageTurn: "./legacy/sounds/labwork/pageturn.wav",
  break: "./legacy/sounds/labwork/break.wav",
  timeup: "./legacy/sounds/labwork/timeup.wav",
};

const TOOL_DEFS = [
  { id: "WATERDRAG", kind: "water", label: "Р’РѕРґР°", x: 94, y: 412, hoverX: 86, hoverY: 405, src: "./legacy/art/lab/buttons/water_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/water_over.bmp" },
  { id: "YELLOWLDRAG", kind: "ingredient", token: "ADDYELLOWLIQUID", color: "YELLOW", label: "Р–С‘Р»С‚Р°СЏ Р¶РёРґРєРѕСЃС‚СЊ", x: 150, y: 415, hoverX: 142, hoverY: 407, src: "./legacy/art/lab/buttons/ylol_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/ylol_over.bmp" },
  { id: "BLUELDRAG", kind: "ingredient", token: "ADDBLUELIQUID", color: "BLUE", label: "РЎРёРЅСЏСЏ Р¶РёРґРєРѕСЃС‚СЊ", x: 186, y: 415, hoverX: 178, hoverY: 407, src: "./legacy/art/lab/buttons/bluel_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/bluel_over.bmp" },
  { id: "REDLDRAG", kind: "ingredient", token: "ADDREDLIQUID", color: "RED", label: "РљСЂР°СЃРЅР°СЏ Р¶РёРґРєРѕСЃС‚СЊ", x: 223, y: 416, hoverX: 214, hoverY: 407, src: "./legacy/art/lab/buttons/redl_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/redl_over.bmp" },
  { id: "YELLOWPDRAG", kind: "ingredient", token: "ADDYELLOWPOWDER", color: "YELLOW", label: "Р–С‘Р»С‚С‹Р№ РїРѕСЂРѕС€РѕРє", x: 260, y: 437, hoverX: 254, hoverY: 432, src: "./legacy/art/lab/buttons/ylop_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/ylop_over.bmp" },
  { id: "BLUEPDRAG", kind: "ingredient", token: "ADDBLUEPOWDER", color: "BLUE", label: "РЎРёРЅРёР№ РїРѕСЂРѕС€РѕРє", x: 309, y: 437, hoverX: 303, hoverY: 431, src: "./legacy/art/lab/buttons/bluep_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/bluep_over.bmp" },
  { id: "REDPDRAG", kind: "ingredient", token: "ADDREDPOWDER", color: "RED", label: "РљСЂР°СЃРЅС‹Р№ РїРѕСЂРѕС€РѕРє", x: 360, y: 437, hoverX: 355, hoverY: 430, src: "./legacy/art/lab/buttons/redp_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/redp_over.bmp" },
  { id: "STIRDRAG", kind: "stir", label: "РџРѕРјРµС€Р°С‚СЊ", x: 406, y: 418, hoverX: 398, hoverY: 409, src: "./legacy/art/lab/buttons/stir_drag.bmp", hoverSrc: "./legacy/art/lab/buttons/stir_over.bmp" },
  { id: "HEATDRAG", kind: "heat", label: "РќР°РіСЂРµРІ", x: 428, y: 405, offSrc: "./legacy/art/lab/buttons/heat_off.bmp", onSrc: "./legacy/art/lab/buttons/heat_on.bmp", offHoverSrc: "./legacy/art/lab/buttons/heat_offhlite.bmp", onHoverSrc: "./legacy/art/lab/buttons/heat_onhlite.bmp" },
];

const BEAKER_DEFS = [
  {
    id: "Beaker7", capacity: 7, spriteX: 32, spriteY: 245, shadowX: 29, shadowY: 295, highlightX: 25, highlightY: 237, countX: 44, countY: 265,
    shadowSrc: "./legacy/art/lab/buttons/bkr7_shad.bmp", highlightSrc: "./legacy/art/lab/buttons/bkr7_hlite.bmp", emptySrc: "./legacy/art/lab/buttons/bkr7_emty.bmp",
    contentSrcByToken: { BLUELDRAG: "./legacy/art/lab/buttons/bkr7_blu_lqid.bmp", REDLDRAG: "./legacy/art/lab/buttons/bkr7_red_lqid.bmp", YELLOWLDRAG: "./legacy/art/lab/buttons/bkr7_ylo_lqid.bmp", BLUEPDRAG: "./legacy/art/lab/buttons/bkr7_blu_pdr.bmp", REDPDRAG: "./legacy/art/lab/buttons/bkr7_red_pdr.bmp", YELLOWPDRAG: "./legacy/art/lab/buttons/bkr7_ylo_pdr.bmp" },
    countSrcByUnits: { 1: "./legacy/art/lab/buttons/7bkr_1.bmp", 2: "./legacy/art/lab/buttons/7bkr_2.bmp", 3: "./legacy/art/lab/buttons/7bkr_3.bmp", 4: "./legacy/art/lab/buttons/7bkr_4.bmp", 5: "./legacy/art/lab/buttons/7bkr_5.bmp", 6: "./legacy/art/lab/buttons/7bkr_6.bmp", 7: "./legacy/art/lab/buttons/7bkr_7.bmp" },
  },
  {
    id: "Beaker3", capacity: 3, spriteX: 117, spriteY: 267, shadowX: 110, shadowY: 300, highlightX: 111, highlightY: 261, countX: 122, countY: 275,
    shadowSrc: "./legacy/art/lab/buttons/bkr3_shad.bmp", highlightSrc: "./legacy/art/lab/buttons/bkr3_hlite.bmp", emptySrc: "./legacy/art/lab/buttons/bkr3_emty.bmp",
    contentSrcByToken: { BLUELDRAG: "./legacy/art/lab/buttons/bkr3_blu_lqid.bmp", REDLDRAG: "./legacy/art/lab/buttons/bkr3_red_lqid.bmp", YELLOWLDRAG: "./legacy/art/lab/buttons/bkr3_ylo_lqid.bmp", BLUEPDRAG: "./legacy/art/lab/buttons/bkr3_blu_pdr.bmp", REDPDRAG: "./legacy/art/lab/buttons/bkr3_red_pdr.bmp", YELLOWPDRAG: "./legacy/art/lab/buttons/bkr3_ylo_pdr.bmp" },
    countSrcByUnits: { 1: "./legacy/art/lab/buttons/3bkr_1.bmp", 2: "./legacy/art/lab/buttons/3bkr_2.bmp", 3: "./legacy/art/lab/buttons/3bkr_3.bmp" },
  },
  {
    id: "Beaker1", capacity: 1, spriteX: 183, spriteY: 282, shadowX: 176, shadowY: 300, highlightX: 178, highlightY: 278, countX: 180, countY: 282,
    shadowSrc: "./legacy/art/lab/buttons/bkr1_shad.bmp", highlightSrc: "./legacy/art/lab/buttons/bkr1_hlite.bmp", emptySrc: "./legacy/art/lab/buttons/bkr1_emty.bmp",
    contentSrcByToken: { BLUELDRAG: "./legacy/art/lab/buttons/bkr1_blu_lqid.bmp", REDLDRAG: "./legacy/art/lab/buttons/bkr1_red_lqid.bmp", YELLOWLDRAG: "./legacy/art/lab/buttons/bkr1_ylo_lqid.bmp", BLUEPDRAG: "./legacy/art/lab/buttons/bkr1_blu_pdr.bmp", REDPDRAG: "./legacy/art/lab/buttons/bkr1_red_pdr.bmp", YELLOWPDRAG: "./legacy/art/lab/buttons/bkr1_ylo_pdr.bmp" },
    countSrcByUnits: { 1: "./legacy/art/lab/buttons/1bkr_1.bmp" },
  },
];

const TARGET_LIQUID_SRC = {
  1: { BLUE: "./legacy/art/lab/beakervariationsl2/blu2_l1.bmp", GREEN: "./legacy/art/lab/beakervariationsl2/green2_l1.bmp", ORANGE: "./legacy/art/lab/beakervariationsl2/orng2_l1.bmp", PURPLE: "./legacy/art/lab/beakervariationsl2/prpl2_l1.bmp", RED: "./legacy/art/lab/beakervariationsl2/red2_l1.bmp", YELLOW: "./legacy/art/lab/beakervariationsl2/ylo2_l1.bmp", WATER: "./legacy/art/lab/beakervariationsl2/watr2_l1.bmp" },
  2: { BLUE: "./legacy/art/lab/beakervariationsl2/blu2_l2.bmp", GREEN: "./legacy/art/lab/beakervariationsl2/green2_l2.bmp", ORANGE: "./legacy/art/lab/beakervariationsl2/orng2_l2.bmp", PURPLE: "./legacy/art/lab/beakervariationsl2/prpl2_l2.bmp", RED: "./legacy/art/lab/beakervariationsl2/red2_l2.bmp", YELLOW: "./legacy/art/lab/beakervariationsl2/ylo2_l2.bmp", WATER: "./legacy/art/lab/beakervariationsl2/watr2_l2.bmp" },
};

const STEP_ICON_SRC = {
  ADDBLUELIQUID: "./legacy/art/lab/checklist/add_blu_l.bmp", ADDBLUEPOWDER: "./legacy/art/lab/checklist/add_blu_p.bmp", ADDREDLIQUID: "./legacy/art/lab/checklist/add_red_l.bmp", ADDREDPOWDER: "./legacy/art/lab/checklist/add_red_p.bmp", ADDWATER: "./legacy/art/lab/checklist/add_watr.bmp", ADDWATER2: "./legacy/art/lab/checklist/add_watr.bmp", ADDYELLOWLIQUID: "./legacy/art/lab/checklist/add_ylo_l.bmp", ADDYELLOWPOWDER: "./legacy/art/lab/checklist/add_ylo_p.bmp", STIR: "./legacy/art/lab/checklist/stir.bmp", STIR2: "./legacy/art/lab/checklist/stir.bmp", HEATB: "./legacy/art/lab/checklist/heat1.bmp", HEATY: "./legacy/art/lab/checklist/heat2.bmp", HEATR: "./legacy/art/lab/checklist/heat3.bmp",
};

const STEP_LABELS = {
  ADDBLUELIQUID: "Р”РѕР±Р°РІСЊ СЃРёРЅСЋСЋ Р¶РёРґРєРѕСЃС‚СЊ", ADDBLUEPOWDER: "Р”РѕР±Р°РІСЊ СЃРёРЅРёР№ РїРѕСЂРѕС€РѕРє", ADDREDLIQUID: "Р”РѕР±Р°РІСЊ РєСЂР°СЃРЅСѓСЋ Р¶РёРґРєРѕСЃС‚СЊ", ADDREDPOWDER: "Р”РѕР±Р°РІСЊ РєСЂР°СЃРЅС‹Р№ РїРѕСЂРѕС€РѕРє", ADDWATER: "Р”РѕР±Р°РІСЊ РІРѕРґСѓ", ADDWATER2: "Р”РѕР±Р°РІСЊ РІРѕРґСѓ СЃРЅРѕРІР°", ADDYELLOWLIQUID: "Р”РѕР±Р°РІСЊ Р¶С‘Р»С‚СѓСЋ Р¶РёРґРєРѕСЃС‚СЊ", ADDYELLOWPOWDER: "Р”РѕР±Р°РІСЊ Р¶С‘Р»С‚С‹Р№ РїРѕСЂРѕС€РѕРє", STIR: "РџРµСЂРµРјРµС€Р°Р№ СЃРјРµСЃСЊ", STIR2: "РџРµСЂРµРјРµС€Р°Р№ РµС‰С‘ СЂР°Р·", HEATB: "РќР°РіСЂРµР№ РґРѕ СЃРёРЅРµРіРѕ СѓСЂРѕРІРЅСЏ", HEATY: "РќР°РіСЂРµР№ РґРѕ Р¶С‘Р»С‚РѕРіРѕ СѓСЂРѕРІРЅСЏ", HEATR: "РќР°РіСЂРµР№ РґРѕ РєСЂР°СЃРЅРѕРіРѕ СѓСЂРѕРІРЅСЏ",
};

const STEP_PROMPT_SOUND = {
  HEATB: "./legacy/sounds/labwork/lwpr001.wav", HEATY: "./legacy/sounds/labwork/lwpr001.wav", HEATR: "./legacy/sounds/labwork/lwpr001.wav", STIR: "./legacy/sounds/labwork/lwpr008.wav", STIR2: "./legacy/sounds/labwork/lwpr008.wav", ADDBLUELIQUID: "./legacy/sounds/labwork/lwpr006.wav", ADDBLUEPOWDER: "./legacy/sounds/labwork/lwpr003.wav", ADDREDLIQUID: "./legacy/sounds/labwork/lwpr007.wav", ADDREDPOWDER: "./legacy/sounds/labwork/lwpr004.wav", ADDYELLOWLIQUID: "./legacy/sounds/labwork/lwpr005.wav", ADDYELLOWPOWDER: "./legacy/sounds/labwork/lwpr002.wav", ADDWATER: "./legacy/sounds/labwork/lwpr009.wav", ADDWATER2: "./legacy/sounds/labwork/lwpr009.wav",
};

const ACTION_SOUND = {
  WATERDRAG: "./legacy/sounds/labwork/pour1.wav", YELLOWLDRAG: "./legacy/sounds/labwork/drip2.wav", BLUELDRAG: "./legacy/sounds/labwork/drip1.wav", REDLDRAG: "./legacy/sounds/labwork/drip3.wav", YELLOWPDRAG: "./legacy/sounds/labwork/powder2.wav", BLUEPDRAG: "./legacy/sounds/labwork/powder3.wav", REDPDRAG: "./legacy/sounds/labwork/powder1.wav", STIRDRAG: "./legacy/sounds/labwork/stir3.wav",
};

const TINY_NUMBER_SRC = { 2: "./legacy/art/lab/checklist/tinynum_00002.bmp", 3: "./legacy/art/lab/checklist/tinynum_00003.bmp", 4: "./legacy/art/lab/checklist/tinynum_00004.bmp", 5: "./legacy/art/lab/checklist/tinynum_00005.bmp", 6: "./legacy/art/lab/checklist/tinynum_00006.bmp", 7: "./legacy/art/lab/checklist/tinynum_00007.bmp", 8: "./legacy/art/lab/checklist/tinynum_00008.bmp", 9: "./legacy/art/lab/checklist/tinynum_00009.bmp", 10: "./legacy/art/lab/checklist/tinynum_000010.bmp", 11: "./legacy/art/lab/checklist/tinynum_000011.bmp", 12: "./legacy/art/lab/checklist/tinynum_000012.bmp" };
const CHECK_MARK_SRC = "./legacy/art/lab/checklist/check.bmp";

const THERMOMETER_FRAMES = Array.from({ length: 11 }, (_, index) => `./legacy/art/lab/burner/therm${String(index + 1).padStart(2, "0")}.bmp`);
const BURNER_IGNITE_FRAMES = ["./legacy/art/lab/burner/firel2on_01.bmp", "./legacy/art/lab/burner/firel2on_02.bmp", "./legacy/art/lab/burner/firel2on_03.bmp"];
const BURNER_LOOP_FRAMES = Array.from({ length: 13 }, (_, index) => `./legacy/art/lab/burner/firel2_${String(index).padStart(2, "0")}.bmp`);

const TARGET_DROP_ZONE = { x: 265, y: 109, width: 112, height: 172 };
const TARGET_HIGHLIGHT = { x: 265, y: 109, src: "./legacy/art/lab/buttons/mainbkrl3_hlite.bmp" };
const TARGET_LIQUID_POS = { 1: { x: 282, y: 182 }, 2: { x: 282, y: 140 } };
const BURNER_POS = { x: 245, y: 155 };
const THERMOMETER_POS = { x: 398, y: 122 };
const SINK_POS = { x: 0, y: 236 };
const SINK_HIGHLIGHT_SRC = "./legacy/art/lab/buttons/sink_hlite.bmp";

const RECIPE_SEQUENCE = [
  [["ADDWATER", 1], ["ADDBLUELIQUID", 1], ["STIR", 1], ["ADDREDPOWDER", 1], ["STIR2", 1], ["HEATB", 1]],
  [["ADDWATER", 1], ["ADDREDLIQUID", 1], ["STIR", 1], ["ADDYELLOWPOWDER", 1], ["STIR2", 1], ["HEATY", 1]],
  [["ADDWATER", 1], ["ADDYELLOWLIQUID", 1], ["STIR", 1], ["ADDBLUEPOWDER", 1], ["STIR2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDYELLOWLIQUID", 1], ["ADDBLUELIQUID", 3], ["STIR", 1], ["ADDWATER2", 1], ["HEATB", 1]],
  [["ADDWATER", 1], ["ADDYELLOWLIQUID", 7], ["STIR", 1], ["ADDBLUEPOWDER", 3], ["STIR2", 1], ["HEATY", 1]],
  [["ADDWATER", 1], ["ADDBLUEPOWDER", 1], ["STIR", 1], ["ADDREDPOWDER", 3], ["STIR2", 1], ["HEATB", 1]],
  [["ADDWATER", 1], ["ADDREDLIQUID", 4], ["STIR", 1], ["ADDYELLOWPOWDER", 3], ["STIR2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDBLUEPOWDER", 4], ["STIR", 1], ["ADDREDLIQUID", 9], ["STIR2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDYELLOWLIQUID", 6], ["ADDBLUEPOWDER", 4], ["STIR2", 1], ["ADDWATER2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDREDLIQUID", 8], ["ADDBLUELIQUID", 1], ["STIR", 1], ["ADDWATER2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDYELLOWPOWDER", 4], ["STIR", 1], ["HEATR", 1], ["ADDBLUEPOWDER", 6], ["STIR2", 1]],
  [["ADDWATER", 1], ["ADDREDPOWDER", 4], ["ADDYELLOWLIQUID", 9], ["STIR", 1], ["ADDWATER2", 1], ["HEATY", 1]],
  [["ADDWATER", 1], ["ADDREDLIQUID", 4], ["STIR", 1], ["HEATY", 1], ["ADDWATER2", 1], ["HEATR", 1]],
  [["ADDWATER", 1], ["ADDYELLOWPOWDER", 4], ["STIR", 1], ["HEATR", 1], ["ADDBLUEPOWDER", 5], ["STIR2", 1]],
  [["ADDWATER", 1], ["ADDBLUEPOWDER", 6], ["ADDYELLOWLIQUID", 8], ["STIR", 1], ["ADDWATER2", 1], ["HEATB", 1]],
  [["ADDWATER", 1], ["ADDBLUELIQUID", 4], ["HEATB", 1], ["STIR", 1], ["ADDREDPOWDER", 9], ["HEATR", 1]],
].map((steps, index) => ({ id: index + 1, steps: steps.map(([token, qty]) => ({ token, qty })) }));

const MIX_RESULTS = { BLUE: { RED: "PURPLE", YELLOW: "GREEN", BLUE: "BLUE" }, RED: { BLUE: "PURPLE", YELLOW: "ORANGE", RED: "RED" }, YELLOW: { BLUE: "GREEN", RED: "ORANGE", YELLOW: "YELLOW" }, GREEN: { GREEN: "GREEN" }, ORANGE: { ORANGE: "ORANGE" }, PURPLE: { PURPLE: "PURPLE" } };
const TOOL_BY_ID = Object.fromEntries(TOOL_DEFS.map((tool) => [tool.id, tool]));
const BEAKER_BY_ID = Object.fromEntries(BEAKER_DEFS.map((beaker) => [beaker.id, beaker]));

const wrap = document.getElementById("gameWrap");
const root = document.getElementById("root");
const sceneLayer = document.getElementById("sceneLayer");
const recipeLayer = document.getElementById("recipeLayer");
const cursor = document.getElementById("cursor");
const ambientRain = document.getElementById("ambientRain");
const ambientDrip = document.getElementById("ambientDrip");
const ambientShower = document.getElementById("ambientShower");
const ambientBubble = document.getElementById("ambientBubble");
const scoreFallback = document.getElementById("scoreFallback");
const scoreBitmap = document.getElementById("scoreBitmap");
const timeFallback = document.getElementById("timeFallback");
const timeBitmap = document.getElementById("timeBitmap");
const roundText = document.getElementById("roundText");
const livesEl = document.getElementById("lives");
const statusText = document.getElementById("statusText");
const fxBadge = document.getElementById("fxBadge");
const targetFeedback = document.getElementById("targetFeedback");
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
const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultBody = document.getElementById("resultBody");
const resultRestart = document.getElementById("resultRestart");
const resultMenu = document.getElementById("resultMenu");

const scoreRenderer = createBitmapScoreRenderer({ container: scoreBitmap, fallbackEl: scoreFallback });
const timeRenderer = createBitmapScoreRenderer({ container: timeBitmap, fallbackEl: timeFallback });
scoreBitmap.classList.remove("hidden");
timeBitmap.classList.remove("hidden");
const audio = { hover: new Audio(PATHS.hover), click: new Audio(PATHS.click), ambient: new Audio(PATHS.ambient), heatLoop: new Audio(PATHS.heatLoop) };
audio.ambient.loop = true;
audio.ambient.volume = 0.32;
audio.heatLoop.loop = true;
audio.heatLoop.volume = 0.2;

const state = { scale: 1, score: getModeScore(MODE_KEY), highScore: getModeScore(MODE_KEY), lives: MAX_LIVES, timeLeft: TIMER_SECONDS, recipeIndex: 0, recipe: RECIPE_SEQUENCE[0], currentStepIndex: 0, quantityRemaining: RECIPE_SEQUENCE[0].steps[0].qty, selection: null, hoverToolId: null, hoverBeakerId: null, targetHover: false, heating: false, heatLevel: 0, heatTimer: null, heatTickCount: 0, timer: null, introOpen: false, pauseOpen: false, confirmOpen: false, resultOpen: false, startedAmbient: false, backgroundAmbientStarted: false, target: { fill: 0, color: "WATER", firstColor: "NONE", secondColor: "NONE" }, beakers: { Beaker1: { content: null, units: 0 }, Beaker3: { content: null, units: 0 }, Beaker7: { content: null, units: 0 } } };
const dom = { tools: new Map(), beakers: new Map(), recipeRows: [] };
function playSound(source, volume = 1) { if (!source) return; const fx = new Audio(source); fx.volume = volume; fx.play().catch(() => {}); }
function playShared(audioEl, volume = 1) { if (!audioEl) return; audioEl.pause(); audioEl.currentTime = 0; audioEl.volume = volume; audioEl.play().catch(() => {}); }
function stopShared(audioEl) { if (!audioEl) return; audioEl.pause(); audioEl.currentTime = 0; }
function tryStartAmbient() {
  if (!state.startedAmbient) {
    audio.ambient.play().then(() => { state.startedAmbient = true; }).catch(() => {});
  }
  startAmbientBackground();
}

function ensureScale() { state.scale = Math.min(wrap.clientWidth / BASE_W, wrap.clientHeight / BASE_H); root.style.transform = `scale(${state.scale})`; }
function setupCursor() {
  const moveCursor = (ev) => {
    const rect = wrap.getBoundingClientRect();
    cursor.style.left = `${ev.clientX - rect.left}px`;
    cursor.style.top = `${ev.clientY - rect.top}px`;
    cursor.style.display = "block";
  };
  wrap.addEventListener("pointerenter", moveCursor);
  wrap.addEventListener("pointerleave", () => { cursor.style.display = "none"; });
  wrap.addEventListener("pointermove", moveCursor);
  wrap.addEventListener("pointerdown", moveCursor);
  window.addEventListener("blur", () => { cursor.style.display = "none"; });
}

const bmpSourceCache = new Map();

function loadBmpWithColorKey(src) {
  if (!src || !/\.bmp$/i.test(src)) return Promise.resolve(src);
  if (bmpSourceCache.has(src)) return bmpSourceCache.get(src);

  const task = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const width = Math.max(1, image.naturalWidth || image.width || 1);
        const height = Math.max(1, image.naturalHeight || image.height || 1);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          resolve(src);
          return;
        }

        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        const cornerKeys = new Set();
        const pushCorner = (x, y) => {
          const offset = (y * width + x) * 4;
          const key = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
          cornerKeys.add(key);
        };

        pushCorner(0, 0);
        pushCorner(Math.max(0, width - 1), 0);
        pushCorner(0, Math.max(0, height - 1));
        pushCorner(Math.max(0, width - 1), Math.max(0, height - 1));

        for (let offset = 0; offset < data.length; offset += 4) {
          const key = (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
          if (cornerKeys.has(key)) {
            data[offset + 3] = 0;
          }
        }

        context.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };

    image.onerror = () => resolve(src);
    image.src = src;
  });

  bmpSourceCache.set(src, task);
  return task;
}

function setSpriteSource(el, src) {
  if (!el || !src) return;
  const requestToken = String((Number(el.dataset.srcRequestToken || "0") + 1));
  el.dataset.srcRequestToken = requestToken;

  if (!/\.bmp$/i.test(src)) {
    el.src = src;
    return;
  }

  loadBmpWithColorKey(src).then((resolvedSrc) => {
    if (el.dataset.srcRequestToken !== requestToken) return;
    el.src = resolvedSrc;
  });
}

function tryPlayVideo(video) {
  if (!video) return;
  video.play().catch(() => {});
}

function scheduleAmbientBurst(video, delayMs) {
  if (!video) return;

  const replay = () => {
    video.classList.remove("hidden");
    video.currentTime = 0;
    tryPlayVideo(video);
  };

  video.addEventListener("ended", () => {
    video.classList.add("hidden");
    setTimeout(replay, delayMs);
  });

  replay();
}

function startAmbientBackground() {
  if (state.backgroundAmbientStarted) return;
  state.backgroundAmbientStarted = true;

  [ambientRain, ambientBubble].forEach((video) => {
    if (!video) return;
    video.loop = true;
    tryPlayVideo(video);
  });

  scheduleAmbientBurst(ambientDrip, 3000);
  scheduleAmbientBurst(ambientShower, 10000);
}

function createSprite({ src, x, y, zIndex = 10, className = "", parent = sceneLayer }) {
  const el = document.createElement("img");
  el.className = `sprite ${className}`.trim();
  setSpriteSource(el, src);
  el.alt = "";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.zIndex = String(zIndex);
  parent.appendChild(el);
  return el;
}

function normalizeStaticBmpSprites() {
  root.querySelectorAll("img").forEach((img) => {
    const source = img.getAttribute("src");
    if (!source || !/\.bmp$/i.test(source)) return;
    if (img.classList.contains("lab-bg") || img.classList.contains("intro-image")) return;
    setSpriteSource(img, source);
  });
}

function createHitButton({ x, y, width, height, onClick }) {
  const hit = document.createElement("button");
  hit.type = "button";
  hit.className = "scene-hit";
  hit.style.left = `${x}px`;
  hit.style.top = `${y}px`;
  hit.style.width = `${width}px`;
  hit.style.height = `${height}px`;
  hit.addEventListener("click", onClick);
  sceneLayer.appendChild(hit);
  return hit;
}

function buildScene() {
  dom.targetHighlight = createSprite({ src: TARGET_HIGHLIGHT.src, x: TARGET_HIGHLIGHT.x, y: TARGET_HIGHLIGHT.y, zIndex: 48, className: "hidden target-hint" });
  dom.targetLiquid = createSprite({ src: TARGET_LIQUID_SRC[1].WATER, x: TARGET_LIQUID_POS[1].x, y: TARGET_LIQUID_POS[1].y, zIndex: 46, className: "hidden" });
  dom.burner = createSprite({ src: BURNER_IGNITE_FRAMES[0], x: BURNER_POS.x, y: BURNER_POS.y, zIndex: 30, className: "hidden" });
  dom.thermometer = createSprite({ src: THERMOMETER_FRAMES[0], x: THERMOMETER_POS.x, y: THERMOMETER_POS.y, zIndex: 35 });
  dom.sinkHighlight = createSprite({ src: SINK_HIGHLIGHT_SRC, x: SINK_POS.x, y: SINK_POS.y, zIndex: 41, className: "hidden" });
  dom.recipeBase = createSprite({ src: "./legacy/art/lab/checklist/paper.bmp", x: 520, y: 165, zIndex: 42 });
  dom.recipeBadge = createSprite({ src: "./legacy/art/lab/checklist/chklist.bmp", x: 546, y: 185, zIndex: 43, className: "hidden" });
  dom.targetHit = createHitButton({ x: TARGET_DROP_ZONE.x, y: TARGET_DROP_ZONE.y, width: TARGET_DROP_ZONE.width, height: TARGET_DROP_ZONE.height, onClick: onTargetClick });
  dom.targetHit.addEventListener("pointerenter", () => { state.targetHover = true; renderSelection(); });
  dom.targetHit.addEventListener("pointerleave", () => { state.targetHover = false; renderSelection(); });
  createHitButton({ x: 30, y: 221, width: 130, height: 20, onClick: onSinkClick });

  TOOL_DEFS.forEach((tool) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = `${tool.x}px`;
    wrapper.style.top = `${tool.y}px`;
    wrapper.style.zIndex = tool.kind === "heat" ? "56" : "54";

    const base = document.createElement("img");
    base.className = "sprite interactive";
    setSpriteSource(base, tool.kind === "heat" ? tool.offSrc : tool.src);
    base.alt = tool.label;
    base.style.position = "relative";
    base.style.pointerEvents = "auto";
    base.draggable = false;
    base.addEventListener("pointerenter", () => { state.hoverToolId = tool.id; renderSelection(); if (canInteract(tool.kind === "heat" ? "heat" : "generic")) playShared(audio.hover, 0.55); });
    base.addEventListener("pointerleave", () => { if (state.hoverToolId === tool.id) state.hoverToolId = null; renderSelection(); });
    base.addEventListener("click", () => onToolClick(tool.id));
    wrapper.appendChild(base);

    const hover = document.createElement("img");
    hover.className = "sprite hidden";
    setSpriteSource(hover, tool.kind === "heat" ? tool.offHoverSrc : tool.hoverSrc);
    hover.alt = "";
    hover.style.left = `${tool.kind === "heat" ? tool.x : tool.hoverX}px`;
    hover.style.top = `${tool.kind === "heat" ? tool.y : tool.hoverY}px`;
    hover.style.zIndex = "57";
    sceneLayer.appendChild(hover);
    sceneLayer.appendChild(wrapper);
    dom.tools.set(tool.id, { wrapper, base, hover, def: tool });
  });

  BEAKER_DEFS.forEach((beaker) => {
    const shadow = createSprite({ src: beaker.shadowSrc, x: beaker.shadowX, y: beaker.shadowY, zIndex: 34 });
    const sprite = document.createElement("img");
    sprite.className = "sprite interactive";
    setSpriteSource(sprite, beaker.emptySrc);
    sprite.alt = beaker.id;
    sprite.style.left = `${beaker.spriteX}px`;
    sprite.style.top = `${beaker.spriteY}px`;
    sprite.style.zIndex = "45";
    sprite.style.pointerEvents = "auto";
    sprite.draggable = false;
    sprite.addEventListener("click", () => onBeakerClick(beaker.id));
    sprite.addEventListener("pointerenter", () => { state.hoverBeakerId = beaker.id; renderSelection(); });
    sprite.addEventListener("pointerleave", () => { if (state.hoverBeakerId === beaker.id) state.hoverBeakerId = null; renderSelection(); });
    sceneLayer.appendChild(sprite);
    const highlight = createSprite({ src: beaker.highlightSrc, x: beaker.highlightX, y: beaker.highlightY, zIndex: 47, className: "hidden" });
    const count = createSprite({ src: Object.values(beaker.countSrcByUnits)[0], x: beaker.countX, y: beaker.countY, zIndex: 46, className: "hidden" });
    dom.beakers.set(beaker.id, { shadow, sprite, highlight, count, def: beaker });
  });
}

function buildRecipeRows() {
  for (let index = 0; index < 8; index += 1) {
    const number = createSprite({ src: TINY_NUMBER_SRC[2], x: 523, y: 210 + index * 28, zIndex: 44, parent: recipeLayer, className: "hidden" });
    const icon = createSprite({ src: STEP_ICON_SRC.ADDWATER, x: 544, y: 209 + index * 28, zIndex: 44, parent: recipeLayer, className: "hidden" });
    const check = createSprite({ src: CHECK_MARK_SRC, x: 528, y: 211 + index * 28, zIndex: 45, parent: recipeLayer, className: "hidden" });
    dom.recipeRows.push({ number, icon, check });
  }
}

function canInteract(kind = "generic") { if (state.introOpen || state.pauseOpen || state.confirmOpen || state.resultOpen) return false; if (state.heating && kind !== "heat") return false; return true; }
function getBeakerState(beakerId) { return state.beakers[beakerId]; }
function clearSelection() { state.selection = null; state.targetHover = false; state.hoverBeakerId = null; renderSelection(); }
function setSelection(selection) { state.selection = selection; renderSelection(); }

function renderLives() {
  livesEl.replaceChildren();
  for (let index = 0; index < MAX_LIVES; index += 1) {
    const img = document.createElement("img");
    img.className = `life${index >= state.lives ? " is-empty" : ""}`;
    setSpriteSource(img, PATHS.life);
    img.alt = "";
    img.draggable = false;
    livesEl.appendChild(img);
  }
}

function renderHUD() {
  roundText.textContent = `${state.recipe.id} / ${RECIPE_SEQUENCE.length}`;
  scoreFallback.textContent = String(state.score);
  timeFallback.textContent = String(state.timeLeft);
  scoreRenderer.setValue(state.score);
  timeRenderer.setValue(state.timeLeft);
  renderLives();
}

function setStatus(text, kind = "") {
  if (!statusText) return;
  statusText.textContent = text;
  statusText.classList.toggle("is-success", kind === "success");
  statusText.classList.toggle("is-error", kind === "error");
}

function showBadge(text, kind = "neutral") {
  if (!fxBadge) return;
  fxBadge.textContent = text;
  fxBadge.dataset.kind = kind;
  fxBadge.classList.add("is-visible");
  clearTimeout(showBadge.timeoutId);
  showBadge.timeoutId = setTimeout(() => fxBadge.classList.remove("is-visible"), 1300);
}

function flashTarget(kind) {
  if (!targetFeedback) return;
  targetFeedback.className = `target-feedback is-${kind}`;
  clearTimeout(flashTarget.timeoutId);
  flashTarget.timeoutId = setTimeout(() => { targetFeedback.className = "target-feedback"; }, 240);
}

function renderTarget() {
  if (state.target.fill <= 0) { dom.targetLiquid.classList.add("hidden"); return; }
  dom.targetLiquid.classList.remove("hidden");
  dom.targetLiquid.style.left = `${TARGET_LIQUID_POS[state.target.fill].x}px`;
  dom.targetLiquid.style.top = `${TARGET_LIQUID_POS[state.target.fill].y}px`;
  setSpriteSource(dom.targetLiquid, TARGET_LIQUID_SRC[state.target.fill][state.target.color] ?? TARGET_LIQUID_SRC[state.target.fill].WATER);
}

function renderBeakers() {
  BEAKER_DEFS.forEach((beaker) => {
    const refs = dom.beakers.get(beaker.id);
    const beakerState = getBeakerState(beaker.id);
    setSpriteSource(refs.sprite, beakerState.content ? beaker.contentSrcByToken[beakerState.content] : beaker.emptySrc);
    if (beakerState.units > 0) { refs.count.classList.remove("hidden"); setSpriteSource(refs.count, beaker.countSrcByUnits[beakerState.units]); } else { refs.count.classList.add("hidden"); }
  });
}

function renderThermometer() { setSpriteSource(dom.thermometer, THERMOMETER_FRAMES[Math.max(0, Math.min(state.heatLevel, THERMOMETER_FRAMES.length - 1))]); }
function renderBurner() {
  if (!state.heating) { dom.burner.classList.add("hidden"); return; }
  const frame = state.heatTickCount < BURNER_IGNITE_FRAMES.length ? BURNER_IGNITE_FRAMES[state.heatTickCount] : BURNER_LOOP_FRAMES[(state.heatTickCount - BURNER_IGNITE_FRAMES.length) % BURNER_LOOP_FRAMES.length];
  setSpriteSource(dom.burner, frame);
  dom.burner.classList.remove("hidden");
}

function renderHeatButton() {
  const refs = dom.tools.get("HEATDRAG");
  if (!refs) return;
  setSpriteSource(refs.base, state.heating ? refs.def.onSrc : refs.def.offSrc);
  setSpriteSource(refs.hover, state.heating ? refs.def.onHoverSrc : refs.def.offHoverSrc);
}

function renderRecipe() {
  dom.recipeBadge.classList.toggle("hidden", state.recipe.steps.length === 0);
  dom.recipeRows.forEach((row, index) => {
    const step = state.recipe.steps[index];
    if (!step) { row.icon.classList.add("hidden"); row.number.classList.add("hidden"); row.check.classList.add("hidden"); return; }
    row.icon.classList.remove("hidden");
    setSpriteSource(row.icon, STEP_ICON_SRC[step.token]);
    if (index < state.currentStepIndex) { row.check.classList.remove("hidden"); row.number.classList.add("hidden"); return; }
    row.check.classList.add("hidden");
    const quantity = index === state.currentStepIndex ? state.quantityRemaining : step.qty;
    if (quantity > 1 && TINY_NUMBER_SRC[quantity]) { row.number.classList.remove("hidden"); setSpriteSource(row.number, TINY_NUMBER_SRC[quantity]); } else { row.number.classList.add("hidden"); }
  });
}

function describeCurrentStep() {
  const step = state.recipe.steps[state.currentStepIndex];
  if (!step) return "Р­РєСЃРїРµСЂРёРјРµРЅС‚ Р·Р°РІРµСЂС€С‘РЅ.";
  return state.quantityRemaining > 1 ? `${STEP_LABELS[step.token]} x${state.quantityRemaining}` : STEP_LABELS[step.token];
}

function updateInstructionState(kind = "") { setStatus(describeCurrentStep(), kind); renderRecipe(); }
function canSelectionApplyToTarget() {
  if (!state.selection || !canInteract()) return false;
  if (state.selection.type === "tool") return true;
  const beaker = getBeakerState(state.selection.id);
  return Boolean(beaker && beaker.units > 0);
}

function canSelectionApplyToSink() {
  if (!state.selection || state.selection.type !== "beaker") return false;
  return getBeakerState(state.selection.id).units > 0;
}

function canTransferIntoSelected(fromId) {
  if (!state.selection || state.selection.type !== "beaker") return false;
  const selectedId = state.selection.id;
  if (selectedId === fromId) return false;
  const selected = getBeakerState(selectedId);
  const source = getBeakerState(fromId);
  return selected.units === 0 && source.units > 0 && BEAKER_BY_ID[selectedId].capacity < BEAKER_BY_ID[fromId].capacity;
}

function renderSelection() {
  dom.tools.forEach(({ base, hover, def }, id) => {
    const selected = state.selection?.type === "tool" && state.selection.id === id;
    base.classList.toggle("is-selected", selected);
    const hovered = state.hoverToolId === id && canInteract(def.kind === "heat" ? "heat" : "generic");
    hover.classList.toggle("hidden", !(selected || hovered));
  });

  const canHighlightHoveredBeaker = (beakerId) => {
    if (!canInteract()) return false;
    if (state.hoverBeakerId !== beakerId) return false;

    if (state.selection?.type === "tool") {
      const tool = TOOL_BY_ID[state.selection.id];
      return tool?.kind === "ingredient" && getBeakerState(beakerId).units === 0;
    }

    if (state.selection?.type === "beaker") {
      return canTransferIntoSelected(beakerId);
    }

    return false;
  };

  dom.beakers.forEach(({ sprite, highlight }, id) => {
    const selected = state.selection?.type === "beaker" && state.selection.id === id;
    sprite.classList.toggle("is-selected", selected);
    highlight.classList.toggle("hidden", !canHighlightHoveredBeaker(id));
  });

  dom.targetHighlight.classList.toggle("hidden", !(canSelectionApplyToTarget() && state.targetHover));
  dom.sinkHighlight.classList.toggle("hidden", !canSelectionApplyToSink());
}

function resetHeatState() {
  state.heating = false;
  state.heatLevel = 0;
  state.heatTickCount = 0;
  clearInterval(state.heatTimer);
  state.heatTimer = null;
  stopShared(audio.heatLoop);
  renderThermometer();
  renderBurner();
  renderHeatButton();
}

function resetMeasureBeakers() {
  Object.keys(state.beakers).forEach((id) => {
    state.beakers[id] = { content: null, units: 0 };
  });
  renderBeakers();
  if (state.selection?.type === "beaker") clearSelection();
}

function resetTargetState() {
  state.target = { fill: 0, color: "WATER", firstColor: "NONE", secondColor: "NONE" };
  renderTarget();
}

function resetWorkbench() {
  resetTargetState();
  resetMeasureBeakers();
  resetHeatState();
  clearSelection();
}

function mixColors(firstColor, secondColor) {
  if (!firstColor || firstColor === "NONE") return secondColor || "WATER";
  if (!secondColor || secondColor === "NONE") return firstColor;
  if (firstColor === secondColor) return firstColor;
  return MIX_RESULTS[firstColor]?.[secondColor] ?? MIX_RESULTS[secondColor]?.[firstColor] ?? firstColor;
}

function getHeatTokenFromLevel(level) {
  if (level < 4) return "HEATB";
  if (level < 7) return "HEATY";
  return "HEATR";
}

function addScore(points) {
  state.score += points;
  state.highScore = recordModeScore(MODE_KEY, state.score);
  renderHUD();
}

function playStepPrompt() {
  const step = state.recipe.steps[state.currentStepIndex];
  const sound = step ? STEP_PROMPT_SOUND[step.token] : null;
  if (sound) playSound(sound, 0.75);
}

function consumeStepProgress(actionToken, quantity) {
  const step = state.recipe.steps[state.currentStepIndex];
  if (!step || step.token !== actionToken) return "wrong";
  const remaining = state.quantityRemaining - quantity;
  if (remaining < 0) return "wrong";
  state.quantityRemaining = remaining;
  return remaining === 0 ? "complete" : "partial";
}

function settleStepProgress(successText) {
  if (state.quantityRemaining > 0) {
    updateInstructionState();
    showBadge(`${successText} РћСЃС‚Р°Р»РѕСЃСЊ ${state.quantityRemaining}.`, "success");
    playStepPrompt();
    return true;
  }

  addScore(20);
  state.currentStepIndex += 1;
  resetMeasureBeakers();
  resetHeatState();

  if (state.currentStepIndex >= state.recipe.steps.length) {
    handleRecipeSuccess();
    return true;
  }

  state.quantityRemaining = state.recipe.steps[state.currentStepIndex].qty;
  updateInstructionState("success");
  showBadge("РЁР°Рі Р·Р°РєСЂС‹С‚.", "success");
  playStepPrompt();
  return true;
}

function handleRecipeSuccess() {
  const bonus = 100 + state.timeLeft * 4;
  addScore(bonus);
  showBadge(`Р¤РѕСЂРјСѓР»Р° СЃРѕР±СЂР°РЅР°. Р‘РѕРЅСѓСЃ ${bonus}.`, "success");
  setStatus("Р РµР°РєС†РёСЏ СЃС‚Р°Р±РёР»РёР·РёСЂРѕРІР°РЅР°. Р“РѕС‚РѕРІРёРј СЃР»РµРґСѓСЋС‰СѓСЋ С„РѕСЂРјСѓР»Сѓ.", "success");
  playSound(PATHS.success, 0.9);
  flashTarget("success");
  clearSelection();

  if (state.recipeIndex >= RECIPE_SEQUENCE.length - 1) {
    openResultOverlay("Р›Р°Р±РѕСЂР°С‚РѕСЂРёСЏ РѕС‡РёС‰РµРЅР°", `Р¤РёРЅР°Р»СЊРЅС‹Р№ СЃС‡С‘С‚: ${state.score}. Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚: ${state.highScore}.`);
    return;
  }

  setTimeout(() => loadRecipe(state.recipeIndex + 1), 1200);
}

function failAttempt(message) {
  flashTarget("error");
  showBadge(message, "error");
  setStatus(message, "error");
  playSound(PATHS.fail, 0.85);
  state.lives = Math.max(0, state.lives - 1);
  renderHUD();
  resetWorkbench();

  if (state.lives <= 0) {
    openResultOverlay("Р РµР°РєС‚РѕСЂ СЃРѕСЂРІР°РЅ", `РџРѕРїС‹С‚РєРё Р·Р°РєРѕРЅС‡РёР»РёСЃСЊ. РўРµРєСѓС‰РёР№ СЃС‡С‘С‚: ${state.score}. Р›СѓС‡С€РёР№ СЂРµР·СѓР»СЊС‚Р°С‚: ${state.highScore}.`);
    return;
  }

  state.currentStepIndex = 0;
  state.quantityRemaining = state.recipe.steps[0].qty;
  state.timeLeft = TIMER_SECONDS;
  renderHUD();
  updateInstructionState("error");
  playStepPrompt();
}

function setTargetIngredient(sourceToken) {
  const color = TOOL_BY_ID[sourceToken]?.color ?? "WATER";
  if (state.target.firstColor === "NONE") state.target.firstColor = color;
  else state.target.secondColor = color;
}

function performWaterStep() {
  const step = state.recipe.steps[state.currentStepIndex];
  if (!step || (step.token !== "ADDWATER" && step.token !== "ADDWATER2")) {
    failAttempt("РќСѓР¶РµРЅ РґСЂСѓРіРѕР№ С€Р°Рі.");
    return false;
  }

  const evaluation = consumeStepProgress(step.token, 1);
  if (evaluation === "wrong") {
    failAttempt("Р’РѕРґР° РЅРµ РїРѕРґС…РѕРґРёС‚ Рє С‚РµРєСѓС‰РµРјСѓ СЂРµС†РµРїС‚Сѓ.");
    return false;
  }

  state.target.fill = Math.min(2, state.target.fill + 1);
  if (state.target.fill === 1 && state.target.color === "WATER") state.target.color = "WATER";
  playSound(ACTION_SOUND.WATERDRAG, 0.7);
  renderTarget();
  return settleStepProgress("Р”РѕР±Р°РІР»РµРЅР° РІРѕРґР°.");
}

function performIngredientStep(sourceToken, quantity) {
  const stepToken = TOOL_BY_ID[sourceToken]?.token;
  if (!stepToken) return false;
  const evaluation = consumeStepProgress(stepToken, quantity);
  if (evaluation === "wrong") {
    failAttempt("Р­С‚РѕС‚ СЂРµР°РіРµРЅС‚ СЃСЋРґР° РЅРµ РїРѕРґС…РѕРґРёС‚.");
    return false;
  }

  setTargetIngredient(sourceToken);
  playSound(ACTION_SOUND[sourceToken], 0.78);
  flashTarget("success");
  return settleStepProgress(`${STEP_LABELS[stepToken]}${quantity > 1 ? ` x${quantity}` : ""}.`);
}

function playStirToolAnimation() {
  const refs = dom.tools.get("STIRDRAG");
  if (!refs) return;

  const composeTransform = (baseTransform, degrees) =>
    `${baseTransform ? `${baseTransform} ` : ""}rotate(${degrees}deg)`;

  const animateStir = (el, baseTransform = "") => {
    if (!el || typeof el.animate !== "function") return;
    el.animate(
      [
        { transform: composeTransform(baseTransform, 0) },
        { transform: composeTransform(baseTransform, -9) },
        { transform: composeTransform(baseTransform, 10) },
        { transform: composeTransform(baseTransform, -7) },
        { transform: composeTransform(baseTransform, 0) },
      ],
      { duration: 360, easing: "ease-in-out" }
    );
  };

  const baseTransform = refs.base.classList.contains("is-selected") ? "translateY(-2px) scale(1.04)" : "";
  animateStir(refs.base, baseTransform);
  if (!refs.hover.classList.contains("hidden")) animateStir(refs.hover);
}

function performStirStep() {
  const step = state.recipe.steps[state.currentStepIndex];
  if (!step || (step.token !== "STIR" && step.token !== "STIR2")) {
    failAttempt("РЎРµР№С‡Р°СЃ РЅСѓР¶РЅРѕ РґСЂСѓРіРѕРµ РґРµР№СЃС‚РІРёРµ.");
    return false;
  }

  if (state.target.fill === 0 || state.target.firstColor === "NONE") {
    failAttempt("РџРѕРєР° РЅРµС‡РµРіРѕ РїРµСЂРµРјРµС€РёРІР°С‚СЊ.");
    return false;
  }

  const evaluation = consumeStepProgress(step.token, 1);
  if (evaluation === "wrong") {
    failAttempt("РџРµСЂРµРјРµС€РёРІР°РЅРёРµ Р·РґРµСЃСЊ РЅРµ СЃСЂР°Р±РѕС‚Р°Р»Рѕ.");
    return false;
  }

  state.target.color = mixColors(state.target.firstColor, state.target.secondColor);
  state.target.firstColor = state.target.color;
  state.target.secondColor = "NONE";
  renderTarget();
  playStirToolAnimation();
  playSound(ACTION_SOUND.STIRDRAG, 0.8);
  flashTarget("success");
  return settleStepProgress("РЎРјРµСЃСЊ РїРµСЂРµРјРµС€Р°РЅР°.");
}

function performHeatStep(levelToken) {
  const evaluation = consumeStepProgress(levelToken, 1);
  if (evaluation === "wrong") {
    failAttempt("РўРµРјРїРµСЂР°С‚СѓСЂР° РІС‹Р±СЂР°РЅР° РЅРµРІРµСЂРЅРѕ.");
    return false;
  }
  flashTarget("success");
  return settleStepProgress(`РќР°РіСЂРµРІ Р·Р°РІРµСЂС€С‘РЅ: ${STEP_LABELS[levelToken]}.`);
}
function fillBeakerFromTool(beakerId, toolId) {
  const tool = TOOL_BY_ID[toolId];
  const beaker = getBeakerState(beakerId);
  if (!tool || tool.kind !== "ingredient" || beaker.units > 0) return false;
  beaker.content = toolId;
  beaker.units = BEAKER_BY_ID[beakerId].capacity;
  renderBeakers();
  renderSelection();
  playSound(ACTION_SOUND[toolId], 0.72);
  showBadge(`${tool.label} РїРѕРјРµС‰С‘РЅ РІ РєРѕР»Р±Сѓ.`, "success");
  return true;
}

function transferBeaker(selectedId, sourceId) {
  const selected = getBeakerState(selectedId);
  const source = getBeakerState(sourceId);
  if (!selected || !source || selected.units > 0 || source.units <= 0) return false;
  const transferUnits = Math.min(BEAKER_BY_ID[selectedId].capacity, source.units);
  selected.content = source.content;
  selected.units = transferUnits;
  source.units -= transferUnits;
  if (source.units <= 0) {
    source.units = 0;
    source.content = null;
  }
  renderBeakers();
  renderSelection();
  playSound("./legacy/sounds/labwork/pour3.wav", 0.65);
  showBadge("РџРµСЂРµР»РёРІ РІС‹РїРѕР»РЅРµРЅ.", "success");
  return true;
}

function pourBeakerToTarget(beakerId) {
  const beaker = getBeakerState(beakerId);
  if (!beaker || beaker.units <= 0 || !beaker.content) return false;
  const success = performIngredientStep(beaker.content, beaker.units);
  if (!success) return false;
  beaker.content = null;
  beaker.units = 0;
  renderBeakers();
  clearSelection();
  return true;
}

function emptyBeaker(beakerId) {
  const beaker = getBeakerState(beakerId);
  if (!beaker || beaker.units <= 0) return false;
  playSound(ACTION_SOUND[beaker.content] ?? ACTION_SOUND.WATERDRAG, 0.55);
  beaker.content = null;
  beaker.units = 0;
  renderBeakers();
  clearSelection();
  showBadge("РљРѕР»Р±Р° РѕС‡РёС‰РµРЅР°.", "success");
  return true;
}

function onToolClick(toolId) {
  tryStartAmbient();
  const tool = TOOL_BY_ID[toolId];
  if (!tool || !canInteract(tool.kind === "heat" ? "heat" : "generic")) return;
  playShared(audio.click, 0.8);
  if (tool.kind === "heat") {
    toggleHeat();
    return;
  }
  if (state.selection?.type === "tool" && state.selection.id === toolId) {
    clearSelection();
    return;
  }
  setSelection({ type: "tool", id: toolId });
}

function onBeakerClick(beakerId) {
  tryStartAmbient();
  if (!canInteract()) return;
  playShared(audio.click, 0.8);
  const currentSelection = state.selection;
  if (!currentSelection) {
    setSelection({ type: "beaker", id: beakerId });
    return;
  }
  if (currentSelection.type === "tool") {
    const tool = TOOL_BY_ID[currentSelection.id];
    if (tool?.kind === "ingredient" && getBeakerState(beakerId).units === 0) {
      fillBeakerFromTool(beakerId, currentSelection.id);
      return;
    }
    setSelection({ type: "beaker", id: beakerId });
    return;
  }
  if (currentSelection.id === beakerId) {
    clearSelection();
    return;
  }
  if (canTransferIntoSelected(beakerId)) {
    transferBeaker(currentSelection.id, beakerId);
    return;
  }
  setSelection({ type: "beaker", id: beakerId });
}

function onTargetClick() {
  tryStartAmbient();
  if (!canInteract() || !state.selection) return;
  playShared(audio.click, 0.8);
  if (state.selection.type === "tool") {
    const tool = TOOL_BY_ID[state.selection.id];
    if (tool.kind === "water") performWaterStep();
    else if (tool.kind === "stir") performStirStep();
    else performIngredientStep(state.selection.id, 1);
    renderSelection();
    return;
  }
  pourBeakerToTarget(state.selection.id);
}

function onSinkClick() {
  tryStartAmbient();
  if (!canInteract() || state.selection?.type !== "beaker") return;
  playShared(audio.click, 0.8);
  emptyBeaker(state.selection.id);
}

function heatTick() {
  if (!state.heating) return;
  state.heatTickCount += 1;
  state.heatLevel += 1;
  renderThermometer();
  renderBurner();
  if (state.heatLevel >= 10) {
    playSound(PATHS.break, 0.95);
    resetHeatState();
    failAttempt("РЎР»РёС€РєРѕРј РіРѕСЂСЏС‡Рѕ. РўРµСЂРјРѕРјРµС‚СЂ РЅРµ РІС‹РґРµСЂР¶Р°Р».");
  }
}

function toggleHeat() {
  if (state.heating) {
    const levelToken = getHeatTokenFromLevel(Math.max(1, state.heatLevel));
    resetHeatState();
    performHeatStep(levelToken);
    return;
  }
  state.heating = true;
  state.heatTickCount = 0;
  renderHeatButton();
  renderBurner();
  playSound(PATHS.heatStart, 0.7);
  playShared(audio.heatLoop, 0.22);
  heatTick();
  state.heatTimer = setInterval(heatTick, HEAT_INTERVAL_MS);
  renderSelection();
}

function startTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    if (state.pauseOpen || state.confirmOpen || state.introOpen || state.resultOpen) return;
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    renderHUD();
    if (state.timeLeft === 0) {
      clearInterval(state.timer);
      playSound(PATHS.timeup, 0.9);
      failAttempt("Р’СЂРµРјСЏ РІС‹С€Р»Рѕ.");
    }
  }, 1000);
}

function loadRecipe(index, { resetScore = false } = {}) {
  state.recipeIndex = index;
  state.recipe = RECIPE_SEQUENCE[index];
  state.currentStepIndex = 0;
  state.quantityRemaining = state.recipe.steps[0].qty;
  state.timeLeft = TIMER_SECONDS;
  if (resetScore) state.score = 0;
  resetWorkbench();
  renderHUD();
  updateInstructionState();
  startTimer();
  playSound(PATHS.pageTurn, 0.75);
  playStepPrompt();
}

async function showIntroScreen(options = {}) {
  const { playCloseClick = false, allowEscape = true } = options;
  if (state.introOpen) return;
  state.introOpen = true;
  introImage.src = PATHS.helpImage;
  introOverlay.classList.remove("hidden", "fade-out");
  playSound(PATHS.helpVoice, 1);
  await new Promise((resolve) => {
    let done = false;
    const finish = (ev) => {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      if (done) return;
      done = true;
      cleanup();
      if (playCloseClick) playShared(audio.click, 0.8);
      introOverlay.classList.add("fade-out");
      setTimeout(() => {
        introOverlay.classList.add("hidden");
        introOverlay.classList.remove("fade-out");
        state.introOpen = false;
        resolve();
      }, INTRO_FADE_MS);
    };
    const onKeyDown = (ev) => {
      if (ev.key === "Enter" || ev.key === " ") finish(ev);
      else if (allowEscape && ev.key === "Escape") finish(ev);
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
function hidePauseHighlights() {
  pauseResumeOverlay.classList.add("hidden");
  pauseRestartOverlay.classList.add("hidden");
  pauseHelpOverlay.classList.add("hidden");
  pauseMainMenuOverlay.classList.add("hidden");
}

function hideConfirmHighlights() {
  pauseConfirmYesOverlay.classList.add("hidden");
  pauseConfirmNoOverlay.classList.add("hidden");
}

function closePauseMenu() {
  hidePauseHighlights();
  pauseMenuOverlay.classList.add("hidden");
  state.pauseOpen = false;
}

function closeConfirmOverlay() {
  hideConfirmHighlights();
  pauseConfirmOverlay.classList.add("hidden");
  state.confirmOpen = false;
}

function openPauseMenu() {
  if (state.pauseOpen || state.confirmOpen || state.introOpen || state.resultOpen) return;
  hidePauseHighlights();
  pauseMenuOverlay.classList.remove("hidden");
  state.pauseOpen = true;
  playShared(audio.click, 0.8);
}

function openConfirmOverlay() {
  if (!state.pauseOpen) return;
  playShared(audio.click, 0.8);
  closePauseMenu();
  hideConfirmHighlights();
  pauseConfirmOverlay.classList.remove("hidden");
  state.confirmOpen = true;
}

function bindOverlayButton(hitEl, overlayEl, isActive, onClick) {
  const show = () => {
    if (!isActive()) return;
    overlayEl.classList.remove("hidden");
    playShared(audio.hover, 0.55);
  };
  const hide = () => { overlayEl.classList.add("hidden"); };
  hitEl.addEventListener("pointerenter", show);
  hitEl.addEventListener("focus", show);
  hitEl.addEventListener("pointerleave", hide);
  hitEl.addEventListener("blur", hide);
  hitEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!isActive()) return;
    onClick();
  });
}

function bindPauseOverlayButtons() {
  [pauseMenuOverlay, pauseConfirmOverlay].forEach((el) => {
    el.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    el.addEventListener("click", (ev) => ev.stopPropagation());
  });

  bindOverlayButton(pauseResumeHit, pauseResumeOverlay, () => state.pauseOpen, () => {
    playShared(audio.click, 0.8);
    closePauseMenu();
  });

  bindOverlayButton(pauseRestartHit, pauseRestartOverlay, () => state.pauseOpen, () => {
    playShared(audio.click, 0.8);
    sessionStorage.removeItem(SKIP_HELP_KEY);
    window.location.href = "./lab.html";
  });

  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseOpen, async () => {
    closePauseMenu();
    await showIntroScreen({ playCloseClick: true, allowEscape: false });
  });

  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseOpen, openConfirmOverlay);

  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmOpen, () => {
    playShared(audio.click, 0.8);
    sessionStorage.removeItem(SKIP_HELP_KEY);
    window.location.href = "./index.html";
  });

  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmOpen, () => {
    playShared(audio.click, 0.8);
    closeConfirmOverlay();
  });
}

function setupGlobalKeys() {
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || state.introOpen) return;
    ev.preventDefault();
    if (state.pauseOpen) {
      closePauseMenu();
      return;
    }
    if (state.confirmOpen) {
      closeConfirmOverlay();
      return;
    }
    if (state.resultOpen) return;
    openPauseMenu();
  });
}

function openResultOverlay(title, body) {
  state.resultOpen = true;
  resultTitle.textContent = title;
  resultBody.textContent = body;
  resultOverlay.classList.remove("hidden");
  clearInterval(state.timer);
  resetHeatState();
  clearSelection();
}

function closeResultOverlay() {
  state.resultOpen = false;
  resultOverlay.classList.add("hidden");
}

function bindResultOverlay() {
  resultRestart.addEventListener("click", () => {
    playShared(audio.click, 0.8);
    closeResultOverlay();
    state.lives = MAX_LIVES;
    state.score = 0;
    state.highScore = getModeScore(MODE_KEY);
    renderHUD();
    loadRecipe(0, { resetScore: true });
  });

  resultMenu.addEventListener("click", () => {
    playShared(audio.click, 0.8);
    window.location.href = "./index.html";
  });
}

async function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCursor();
  buildScene();
  normalizeStaticBmpSprites();
  buildRecipeRows();
  bindPauseOverlayButtons();
  bindResultOverlay();
  setupGlobalKeys();
  window.addEventListener("pointerdown", tryStartAmbient, { once: true });
  window.addEventListener("keydown", tryStartAmbient, { once: true });
  renderHUD();
  renderTarget();
  renderBeakers();
  renderThermometer();
  renderHeatButton();
  renderSelection();
  loadRecipe(0);
  if (sessionStorage.getItem(SKIP_HELP_KEY) === "1") {
    sessionStorage.removeItem(SKIP_HELP_KEY);
    return;
  }
  await showIntroScreen();
}

boot().catch((error) => {
  console.error(error);
  window.location.replace("./index.html");
});





