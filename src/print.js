import { getModeScore } from "./score-store.js";
import {
  getPrintFrameItem,
  isPrintSlotUnlocked,
  readLastPrintFrame,
  writeLastPrintFrame,
} from "./print-store.js";

const BASE_W = 640;
const BASE_H = 480;
const PRINT_MESSAGE_MS = 1600;
const CLEAR_SELECTION_MS = 3000;
const PRINTED_AWARD_KEY = "chp_print_award_flag_v1";
const AWARDS_BACKGROUND = "./legacy/art/print/awardscreen/background.bmp";
const SELECT_BACKGROUND = "./legacy/art/print/background.bmp";
const ENABLE_STEAM_OVERLAY = false;

const wrap = document.getElementById("gameWrap");
const root = document.getElementById("root");
const cursor = document.getElementById("cursor");
const pageBackground = document.getElementById("pageBackground");
const pageOneCard = document.getElementById("pageOneCard");
const pageOneCardHover = document.getElementById("pageOneCardHover");
const pageOneBackHover = document.getElementById("pageOneBackHover");
const pageOneUpHover = document.getElementById("pageOneUpHover");
const pageOneDownHover = document.getElementById("pageOneDownHover");
const scoreLabelArt = document.getElementById("scoreLabelArt");
const scoreValue = document.getElementById("scoreValue");
const awardsCollage = document.getElementById("awardsCollage");
const awardsBackHover = document.getElementById("awardsBackHover");
const printHover = document.getElementById("printHover");
const steamVideo = document.getElementById("steamVideo");
const printMessage = document.getElementById("printMessage");

const pageOneBackHit = document.getElementById("pageOneBackHit");
const pageOneUpHit = document.getElementById("pageOneUpHit");
const pageOneDownHit = document.getElementById("pageOneDownHit");
const pageOneCardHit = document.getElementById("pageOneCardHit");
const awardsBackHit = document.getElementById("awardsBackHit");
const printHit = document.getElementById("printHit");

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

const slotDefs = [
  {
    index: 1,
    lockedEl: document.getElementById("slot1Locked"),
    overlayEl: document.getElementById("slot1Overlay"),
    hitEl: document.getElementById("slot1Hit"),
  },
  {
    index: 2,
    lockedEl: document.getElementById("slot2Locked"),
    overlayEl: document.getElementById("slot2Overlay"),
    hitEl: document.getElementById("slot2Hit"),
  },
  {
    index: 3,
    lockedEl: document.getElementById("slot3Locked"),
    overlayEl: document.getElementById("slot3Overlay"),
    hitEl: document.getElementById("slot3Hit"),
  },
];

const audio = {
  hover: new Audio("./assets/sounds/moclick001.wav"),
  click: new Audio("./assets/sounds/click001.wav"),
  pageIntro: new Audio("./legacy/sounds/bugle/dbsm004.wav"),
  pageReturn: new Audio("./legacy/sounds/bugle/dbsm001.wav"),
  awards: new Audio("./legacy/sounds/bugle/dbsm003.wav"),
  locked: new Audio("./legacy/sounds/bugle/dbsm002.wav"),
  music: new Audio("./legacy/sounds/bugle/printloop.wav"),
};
audio.music.loop = true;
audio.music.volume = 0.34;

const state = {
  page: "select",
  frame: readLastPrintFrame(),
  selectedSlot: 0,
  hoveredPageOne: null,
  hoveredPageTwo: null,
  hoveredSlot: 0,
  pauseMenuOpen: false,
  confirmExitOpen: false,
  printMessageTimer: null,
  clearSelectionTimer: null,
  resumeMusic: false,
  resumeSteam: false,
  printedAward: readPrintedAwardFlag(),
};

function readPrintedAwardFlag() {
  try {
    return window.sessionStorage.getItem(PRINTED_AWARD_KEY) === "1";
  } catch {
    return false;
  }
}

function writePrintedAwardFlag(value) {
  try {
    if (value) {
      window.sessionStorage.setItem(PRINTED_AWARD_KEY, "1");
      return;
    }

    window.sessionStorage.removeItem(PRINTED_AWARD_KEY);
  } catch {}
}

function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
}

function stopSound(audioEl) {
  if (!audioEl) {
    return;
  }

  audioEl.pause();
  try {
    audioEl.currentTime = 0;
  } catch {}
}

function playSound(audioEl, volume = 1) {
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

function stopVoices() {
  stopSound(audio.pageIntro);
  stopSound(audio.pageReturn);
  stopSound(audio.awards);
  stopSound(audio.locked);
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

function startAmbientMedia() {
  if (state.pauseMenuOpen || state.confirmExitOpen) {
    return;
  }

  audio.music.play().catch(() => {});
  if (ENABLE_STEAM_OVERLAY && steamVideo.dataset.failed !== "1") {
    steamVideo.play().catch(() => {});
  }
}

function pauseAmbientMedia() {
  state.resumeMusic = !audio.music.paused;
  state.resumeSteam = ENABLE_STEAM_OVERLAY && steamVideo.dataset.failed !== "1" && !steamVideo.paused;
  audio.music.pause();
  steamVideo.pause();
}

function resumeAmbientMedia() {
  if (state.resumeMusic) {
    audio.music.play().catch(() => {});
  }

  if (state.resumeSteam && ENABLE_STEAM_OVERLAY && steamVideo.dataset.failed !== "1") {
    steamVideo.play().catch(() => {});
  }

  state.resumeMusic = false;
  state.resumeSteam = false;
}

function getCurrentItem() {
  return getPrintFrameItem(state.frame);
}

function getCurrentScore() {
  return getModeScore(getCurrentItem().modeKey);
}

function clearHoverState() {
  state.hoveredPageOne = null;
  state.hoveredPageTwo = null;
  state.hoveredSlot = 0;
}

function clearSelection() {
  state.selectedSlot = 0;
  state.hoveredSlot = 0;
}

function showPrintMessage(text, duration = PRINT_MESSAGE_MS) {
  window.clearTimeout(state.printMessageTimer);
  printMessage.textContent = text;
  setHidden(printMessage, false);

  state.printMessageTimer = window.setTimeout(() => {
    setHidden(printMessage, true);
  }, duration);
}

function scheduleSelectionReset() {
  window.clearTimeout(state.clearSelectionTimer);
  state.clearSelectionTimer = window.setTimeout(() => {
    clearSelection();
    render();
  }, CLEAR_SELECTION_MS);
}

function playPageOneVoice() {
  stopVoices();
  playSound(state.printedAward ? audio.pageReturn : audio.pageIntro, 1);
}

function render() {
  const item = getCurrentItem();
  const score = getCurrentScore();
  const onAwardsPage = state.page === "awards";

  if (state.selectedSlot && !isPrintSlotUnlocked(score, state.selectedSlot)) {
    clearSelection();
  }

  document.title = `Print Center - ${item.printTitle}`;
  writeLastPrintFrame(state.frame);

  pageBackground.src = onAwardsPage ? AWARDS_BACKGROUND : SELECT_BACKGROUND;
  pageBackground.alt = onAwardsPage ? "Экран наград" : "Центр печати";

  pageOneCard.src = item.pageArt;
  pageOneCardHover.src = item.pageHoverArt;
  awardsCollage.src = item.awardsArt;
  slotDefs.forEach((slot) => {
    slot.overlayEl.src = item.slotOverlayPaths[slot.index - 1];
  });

  scoreValue.textContent = `:${score}`;

  setHidden(pageOneCard, onAwardsPage);
  setHidden(pageOneCardHover, onAwardsPage || state.hoveredPageOne !== "card");
  setHidden(pageOneBackHover, onAwardsPage || state.hoveredPageOne !== "back");
  setHidden(pageOneUpHover, onAwardsPage || state.hoveredPageOne !== "up");
  setHidden(pageOneDownHover, onAwardsPage || state.hoveredPageOne !== "down");
  setHidden(scoreLabelArt, onAwardsPage);
  setHidden(scoreValue, onAwardsPage);

  setHidden(awardsCollage, !onAwardsPage);
  setHidden(awardsBackHover, !onAwardsPage || state.hoveredPageTwo !== "back");
  setHidden(printHover, !onAwardsPage || state.hoveredPageTwo !== "print" || state.selectedSlot === 0);
  setHidden(steamVideo, true);

  setHidden(pageOneBackHit, onAwardsPage);
  setHidden(pageOneUpHit, onAwardsPage);
  setHidden(pageOneDownHit, onAwardsPage);
  setHidden(pageOneCardHit, onAwardsPage);
  setHidden(awardsBackHit, !onAwardsPage);
  setHidden(printHit, !onAwardsPage);

  slotDefs.forEach((slot) => {
    const unlocked = isPrintSlotUnlocked(score, slot.index);
    const shouldShowOverlay =
      onAwardsPage &&
      unlocked &&
      (state.selectedSlot === slot.index || (state.selectedSlot === 0 && state.hoveredSlot === slot.index));

    setHidden(slot.hitEl, !onAwardsPage);
    setHidden(slot.lockedEl, !onAwardsPage || unlocked);
    setHidden(slot.overlayEl, !shouldShowOverlay);
  });
}

function openSelectionPage({ playVoice = true } = {}) {
  state.page = "select";
  clearSelection();
  state.hoveredPageTwo = null;
  render();

  if (playVoice) {
    playPageOneVoice();
  }
}

function openAwardsPage() {
  state.page = "awards";
  clearSelection();
  state.hoveredPageOne = null;
  render();
  stopVoices();
  playSound(audio.awards, 1);
}

function openMainMenu() {
  window.location.href = "./index.html";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function openPrintPreview() {
  if (!state.selectedSlot) {
    return false;
  }

  const item = getCurrentItem();
  const slotIndex = state.selectedSlot - 1;
  const imageUrl = new URL(item.printPaths[slotIndex], window.location.href).href;
  const title = `${item.printTitle} ${state.selectedSlot}`;
  const fileName = item.printNames[slotIndex];
  const popup = window.open("", "_blank", "width=900,height=700");

  if (!popup) {
    showPrintMessage("Разрешите всплывающее окно", 1800);
    return false;
  }

  popup.document.write(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      gap: 14px;
      padding: 20px;
      box-sizing: border-box;
      background: #0f131a;
      color: #f4f8ff;
      font-family: "Segoe UI", Tahoma, sans-serif;
    }

    img {
      max-width: min(100%, 960px);
      max-height: calc(100vh - 96px);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
      background: #000;
    }

    .meta {
      font-size: 14px;
      letter-spacing: 0.3px;
      text-align: center;
    }
  </style>
</head>
<body>
  <img id="poster" src="${imageUrl}" alt="${escapeHtml(title)}" />
  <div id="status" class="meta">${escapeHtml(fileName)}</div>
  <script>
    const poster = document.getElementById("poster");
    const status = document.getElementById("status");

    const sendToPrinter = () => {
      status.textContent = "Подготовка к печати...";
      setTimeout(() => {
        window.focus();
        window.print();
      }, 80);
    };

    if (poster.complete) {
      sendToPrinter();
    } else {
      poster.addEventListener("load", sendToPrinter, { once: true });
      poster.addEventListener("error", () => {
        status.textContent = "Не удалось загрузить изображение.";
      }, { once: true });
    }
  </script>
</body>
</html>`);
  popup.document.close();

  return true;
}

function handlePrint() {
  if (!state.selectedSlot) {
    return;
  }

  const printed = openPrintPreview();
  if (!printed) {
    return;
  }

  state.printedAward = true;
  writePrintedAwardFlag(true);
  showPrintMessage("Печать...", PRINT_MESSAGE_MS);
  scheduleSelectionReset();
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

function closePauseMenu({ resumeMedia = true } = {}) {
  hidePauseMenuHighlights();
  pauseMenuOverlay.classList.add("hidden");
  state.pauseMenuOpen = false;
  if (resumeMedia) {
    resumeAmbientMedia();
  }
}

function closeConfirmOverlay({ resumeMedia = true } = {}) {
  hidePauseConfirmHighlights();
  pauseConfirmOverlay.classList.add("hidden");
  state.confirmExitOpen = false;
  if (resumeMedia) {
    resumeAmbientMedia();
  }
}

function openPauseMenu() {
  if (state.pauseMenuOpen || state.confirmExitOpen) {
    return;
  }

  clearHoverState();
  render();
  pauseAmbientMedia();
  pauseMenuOverlay.classList.remove("hidden");
  state.pauseMenuOpen = true;
  playSound(audio.click, 0.9);
}

function openConfirmOverlay() {
  if (!state.pauseMenuOpen) {
    return;
  }

  playSound(audio.click, 0.9);
  closePauseMenu({ resumeMedia: false });
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
    closePauseMenu({ resumeMedia: false });
    openSelectionPage({ playVoice: true });
    resumeAmbientMedia();
  });

  bindOverlayButton(pauseHelpHit, pauseHelpOverlay, () => state.pauseMenuOpen, () => {
    playSound(audio.click, 0.9);
    closePauseMenu({ resumeMedia: false });
    openSelectionPage({ playVoice: true });
    resumeAmbientMedia();
  });

  bindOverlayButton(pauseMainMenuHit, pauseMainMenuOverlay, () => state.pauseMenuOpen, openConfirmOverlay);

  bindOverlayButton(pauseConfirmYesHit, pauseConfirmYesOverlay, () => state.confirmExitOpen, () => {
    playSound(audio.click, 0.9);
    openMainMenu();
  });

  bindOverlayButton(pauseConfirmNoHit, pauseConfirmNoOverlay, () => state.confirmExitOpen, () => {
    playSound(audio.click, 0.9);
    closeConfirmOverlay();
  });
}

function bindInteractiveButton(hitEl, { isActive, onEnter, onLeave, onClick }) {
  hitEl.addEventListener("pointerenter", () => {
    if (!isActive()) {
      return;
    }
    onEnter?.();
  });

  hitEl.addEventListener("focus", () => {
    if (!isActive()) {
      return;
    }
    onEnter?.();
  });

  hitEl.addEventListener("pointerleave", () => {
    onLeave?.();
  });

  hitEl.addEventListener("blur", () => {
    onLeave?.();
  });

  hitEl.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!isActive()) {
      return;
    }
    onClick?.();
  });
}

function bindPageControls() {
  bindInteractiveButton(pageOneBackHit, {
    isActive: () => state.page === "select" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      state.hoveredPageOne = "back";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageOne === "back") {
        state.hoveredPageOne = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      openMainMenu();
    },
  });

  bindInteractiveButton(pageOneUpHit, {
    isActive: () => state.page === "select" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      state.hoveredPageOne = "up";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageOne === "up") {
        state.hoveredPageOne = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      state.frame = (state.frame + 1) % 7;
      render();
    },
  });

  bindInteractiveButton(pageOneDownHit, {
    isActive: () => state.page === "select" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      state.hoveredPageOne = "down";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageOne === "down") {
        state.hoveredPageOne = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      state.frame = (state.frame + 6) % 7;
      render();
    },
  });

  bindInteractiveButton(pageOneCardHit, {
    isActive: () => state.page === "select" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      state.hoveredPageOne = "card";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageOne === "card") {
        state.hoveredPageOne = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      openAwardsPage();
    },
  });

  bindInteractiveButton(awardsBackHit, {
    isActive: () => state.page === "awards" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      state.hoveredPageTwo = "back";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageTwo === "back") {
        state.hoveredPageTwo = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      openSelectionPage({ playVoice: true });
    },
  });

  slotDefs.forEach((slot) => {
    bindInteractiveButton(slot.hitEl, {
      isActive: () => state.page === "awards" && !state.pauseMenuOpen && !state.confirmExitOpen,
      onEnter: () => {
        if (!isPrintSlotUnlocked(getCurrentScore(), slot.index) || state.selectedSlot !== 0) {
          return;
        }

        state.hoveredSlot = slot.index;
        playSound(audio.hover, 0.6);
        render();
      },
      onLeave: () => {
        if (state.hoveredSlot === slot.index) {
          state.hoveredSlot = 0;
          render();
        }
      },
      onClick: () => {
        if (!isPrintSlotUnlocked(getCurrentScore(), slot.index)) {
          playSound(audio.locked, 1);
          return;
        }

        playSound(audio.click, 0.9);
        state.hoveredSlot = 0;
        state.selectedSlot = state.selectedSlot === slot.index ? 0 : slot.index;
        render();
      },
    });
  });

  bindInteractiveButton(printHit, {
    isActive: () => state.page === "awards" && !state.pauseMenuOpen && !state.confirmExitOpen,
    onEnter: () => {
      if (!state.selectedSlot) {
        return;
      }

      state.hoveredPageTwo = "print";
      playSound(audio.hover, 0.6);
      render();
    },
    onLeave: () => {
      if (state.hoveredPageTwo === "print") {
        state.hoveredPageTwo = null;
        render();
      }
    },
    onClick: () => {
      playSound(audio.click, 0.9);
      handlePrint();
    },
  });
}

function setupGlobalKeys() {
  window.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") {
      return;
    }

    ev.preventDefault();

    if (state.confirmExitOpen) {
      closeConfirmOverlay();
      return;
    }

    if (state.pauseMenuOpen) {
      closePauseMenu();
      return;
    }

    openPauseMenu();
  });
}

function boot() {
  ensureScale();
  window.addEventListener("resize", ensureScale);
  setupCursor();
  bindPageControls();
  bindPauseOverlayButtons();
  setupGlobalKeys();

  if (!ENABLE_STEAM_OVERLAY) {
    steamVideo.dataset.failed = "1";
  } else {
    steamVideo.addEventListener(
      "error",
      () => {
        steamVideo.dataset.failed = "1";
        steamVideo.pause();
        render();
      },
      { once: true }
    );
  }

  window.addEventListener("pointerdown", startAmbientMedia);
  window.addEventListener("keydown", startAmbientMedia);

  render();
  startAmbientMedia();
  playPageOneVoice();
}

boot();
