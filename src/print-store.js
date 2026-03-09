const STORAGE_KEY = "chp_print_last_frame_v1";

export const PRINT_FRAME_ITEMS = Object.freeze([
  {
    frame: 0,
    targetScript: "crawl.txt",
    modeKey: "crawl",
    pageArt: "./legacy/art/print/crawl.bmp",
    pageHoverArt: "./assets/art/print/crawlh.png",
    awardsArt: "./legacy/art/print/awardscreen/crawl3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/crawlover1.png",
      "./assets/art/print/awardscreen/crawlover2.png",
      "./assets/art/print/awardscreen/crawlover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/crawl1.bmp",
      "./legacy/art/print/awards/crawl2.bmp",
      "./legacy/art/print/awards/crawl3.bmp"
    ],
    printNames: ["SpiderMan2_Crawl_1", "SpiderMan2_Crawl_2", "SpiderMan2_Crawl_3"],
    printTitle: "Wall Crawler"
  },
  {
    frame: 1,
    targetScript: "crook.txt",
    modeKey: "crook",
    pageArt: "./legacy/art/print/crook.bmp",
    pageHoverArt: "./assets/art/print/crookh.png",
    awardsArt: "./legacy/art/print/awardscreen/crook3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/crookover1.png",
      "./assets/art/print/awardscreen/crookover2.png",
      "./assets/art/print/awardscreen/crookover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/crook1.bmp",
      "./legacy/art/print/awards/crook2.bmp",
      "./legacy/art/print/awards/crook3.bmp"
    ],
    printNames: ["SpiderMan2_Crook_1", "SpiderMan2_Crook_2", "SpiderMan2_Crook_3"],
    printTitle: "Catch the Crook"
  },
  {
    frame: 2,
    targetScript: "heist.txt",
    modeKey: "heist",
    pageArt: "./legacy/art/print/cafe.bmp",
    pageHoverArt: "./assets/art/print/cafeh.png",
    awardsArt: "./legacy/art/print/awardscreen/cafe3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/cafeover1.png",
      "./assets/art/print/awardscreen/cafeover2.png",
      "./assets/art/print/awardscreen/cafeover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/cafe1.bmp",
      "./legacy/art/print/awards/cafe2.bmp",
      "./legacy/art/print/awards/cafe3.bmp"
    ],
    printNames: ["SpiderMan2_Cafe_1", "SpiderMan2_Cafe_2", "SpiderMan2_Cafe_3"],
    printTitle: "Cafe Attack"
  },
  {
    frame: 3,
    targetScript: "lab101.txt",
    modeKey: "lab101",
    pageArt: "./legacy/art/print/lab.bmp",
    pageHoverArt: "./assets/art/print/labh.png",
    awardsArt: "./legacy/art/print/awardscreen/lab3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/labover1.png",
      "./assets/art/print/awardscreen/labover2.png",
      "./assets/art/print/awardscreen/labover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/lab1.bmp",
      "./legacy/art/print/awards/lab2.bmp",
      "./legacy/art/print/awards/lab3.bmp"
    ],
    printNames: ["SpiderMan2_Lab_1", "SpiderMan2_Lab_2", "SpiderMan2_Lab_3"],
    printTitle: "Lab Work 101"
  },
  {
    frame: 4,
    targetScript: "mugshot.txt",
    modeKey: "mugshot",
    pageArt: "./legacy/art/print/mugshot.bmp",
    pageHoverArt: "./assets/art/print/mugshoth.png",
    awardsArt: "./legacy/art/print/awardscreen/mugshot3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/mugshotover1.png",
      "./assets/art/print/awardscreen/mugshotover2.png",
      "./assets/art/print/awardscreen/mugshotover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/mugshot1.bmp",
      "./legacy/art/print/awards/mugshot2.bmp",
      "./legacy/art/print/awards/mugshot3.bmp"
    ],
    printNames: ["SpiderMan2_Mugshot_1", "SpiderMan2_Mugshot_2", "SpiderMan2_Mugshot_3"],
    printTitle: "Mug Shot"
  },
  {
    frame: 5,
    targetScript: "ware.txt",
    modeKey: "ware",
    pageArt: "./legacy/art/print/sneak.bmp",
    pageHoverArt: "./assets/art/print/sneakh.png",
    awardsArt: "./legacy/art/print/awardscreen/sneak3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/sneakover1.png",
      "./assets/art/print/awardscreen/sneakover2.png",
      "./assets/art/print/awardscreen/sneakover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/sneak1.bmp",
      "./legacy/art/print/awards/sneak2.bmp",
      "./legacy/art/print/awards/sneak3.bmp"
    ],
    printNames: ["SpiderMan2_Sneak_1", "SpiderMan2_Sneak_2", "SpiderMan2_Sneak_3"],
    printTitle: "Warehouse Infiltration"
  },
  {
    frame: 6,
    targetScript: "websling.txt",
    modeKey: "websling",
    pageArt: "./legacy/art/print/websling.bmp",
    pageHoverArt: "./assets/art/print/webslingh.png",
    awardsArt: "./legacy/art/print/awardscreen/websling3pics.bmp",
    slotOverlayPaths: [
      "./assets/art/print/awardscreen/webslingover1.png",
      "./assets/art/print/awardscreen/webslingover2.png",
      "./assets/art/print/awardscreen/webslingover3.png"
    ],
    printPaths: [
      "./legacy/art/print/awards/websling1.bmp",
      "./legacy/art/print/awards/websling2.bmp",
      "./legacy/art/print/awards/websling3.bmp"
    ],
    printNames: ["SpiderMan2_WebSling_1", "SpiderMan2_WebSling_2", "SpiderMan2_WebSling_3"],
    printTitle: "Web Slinger"
  }
]);

const FRAME_BY_TARGET_SCRIPT = Object.freeze(
  Object.fromEntries(PRINT_FRAME_ITEMS.map((item) => [item.targetScript, item.frame]))
);

const ITEM_BY_FRAME = new Map(PRINT_FRAME_ITEMS.map((item) => [item.frame, item]));

function sanitizeFrame(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) {
    return 0;
  }

  return ITEM_BY_FRAME.has(numeric) ? numeric : 0;
}

export function getPrintFrameFromTargetScript(targetScript) {
  if (typeof targetScript !== "string") {
    return null;
  }

  return FRAME_BY_TARGET_SCRIPT[targetScript.trim().toLowerCase()] ?? null;
}

export function getPrintFrameItem(frame) {
  return ITEM_BY_FRAME.get(sanitizeFrame(frame)) ?? PRINT_FRAME_ITEMS[0];
}

export function readLastPrintFrame(storage = window.sessionStorage) {
  try {
    return sanitizeFrame(storage.getItem(STORAGE_KEY));
  } catch {
    return 0;
  }
}

export function writeLastPrintFrame(frame, storage = window.sessionStorage) {
  const nextFrame = sanitizeFrame(frame);

  try {
    storage.setItem(STORAGE_KEY, String(nextFrame));
  } catch {}

  return nextFrame;
}

export function rememberPrintFrameForTargetScript(targetScript, storage = window.sessionStorage) {
  const frame = getPrintFrameFromTargetScript(targetScript);
  if (frame === null) {
    return null;
  }

  return writeLastPrintFrame(frame, storage);
}

export function isPrintSlotUnlocked(score, slotIndex) {
  const numericScore = Number(score) || 0;

  if (slotIndex === 1) {
    return numericScore > 3000;
  }

  if (slotIndex === 2) {
    return numericScore >= 8000;
  }

  if (slotIndex === 3) {
    return numericScore > 14000;
  }

  return false;
}

