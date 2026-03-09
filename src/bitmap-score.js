const DEFAULT_FONT_URL = new URL("../legacy/fonts/greenfon.dat", import.meta.url).toString();
const DEFAULT_DIGITS = "0123456789";
const DEFAULT_FIRST_DIGIT_INDEX = 52;
const DEFAULT_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DEFAULT_UPPERCASE_FIRST_INDEX = 0;

const atlasCache = new Map();

function normalizeScoreValue(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return String(Math.max(0, Math.trunc(numeric)));
  }

  const text = String(value ?? "").replace(/\D+/g, "");
  return text || "0";
}

function buildSequentialGlyphMap(chars, firstIndex) {
  const glyphMap = {};

  Array.from(chars).forEach((char, index) => {
    glyphMap[char] = firstIndex + index;
  });

  return glyphMap;
}

function parseDatGlyphs(buffer) {
  const view = new DataView(buffer);
  const glyphCount = view.getUint16(0, true);
  const tableOffset = 2;
  const dataOffset = tableOffset + glyphCount * 8;
  let glyphOffset = dataOffset;
  const glyphs = [];

  for (let index = 0; index < glyphCount; index += 1) {
    const entryOffset = tableOffset + index * 8;
    const size = view.getUint32(entryOffset, true);
    const duplicateSize = view.getUint32(entryOffset + 4, true);

    if (size !== duplicateSize) {
      throw new Error(`Invalid DAT font entry at index ${index}: mismatched BMP sizes.`);
    }

    if (glyphOffset + size > buffer.byteLength) {
      throw new Error(`Invalid DAT font entry at index ${index}: BMP block exceeds file bounds.`);
    }

    glyphs.push(new Uint8Array(buffer.slice(glyphOffset, glyphOffset + size)));
    glyphOffset += size;
  }

  if (glyphOffset !== buffer.byteLength) {
    throw new Error("Invalid DAT font file: trailing bytes after glyph table.");
  }

  return glyphs;
}

function readPixel(bytes, rowSize, pixelOffset, width, height, topDown, x, y) {
  const row = topDown ? y : height - 1 - y;
  const offset = pixelOffset + row * rowSize + x * 3;
  return {
    b: bytes[offset],
    g: bytes[offset + 1],
    r: bytes[offset + 2],
  };
}

function bmpGlyphToDataUrl(bytes) {
  if (bytes[0] !== 0x42 || bytes[1] !== 0x4d) {
    throw new Error("Unexpected glyph format: only BMP blocks are supported.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pixelOffset = view.getUint32(10, true);
  const dibHeaderSize = view.getUint32(14, true);
  const rawWidth = view.getInt32(18, true);
  const rawHeight = view.getInt32(22, true);
  const planes = view.getUint16(26, true);
  const bitsPerPixel = view.getUint16(28, true);
  const compression = view.getUint32(30, true);

  if (dibHeaderSize < 40 || planes !== 1 || bitsPerPixel !== 24 || compression !== 0) {
    throw new Error("Unsupported BMP glyph format. Expected uncompressed 24-bit BMP.");
  }

  const width = Math.abs(rawWidth);
  const height = Math.abs(rawHeight);
  const topDown = rawHeight < 0;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const imageData = context.createImageData(width, height);
  const output = imageData.data;
  const transparentColor = readPixel(bytes, rowSize, pixelOffset, width, height, topDown, 0, 0);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = readPixel(bytes, rowSize, pixelOffset, width, height, topDown, x, y);
      const outIndex = (y * width + x) * 4;
      const isTransparent =
        pixel.r === transparentColor.r &&
        pixel.g === transparentColor.g &&
        pixel.b === transparentColor.b;

      output[outIndex] = pixel.r;
      output[outIndex + 1] = pixel.g;
      output[outIndex + 2] = pixel.b;
      output[outIndex + 3] = isTransparent ? 0 : 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return {
    src: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

async function loadBitmapGlyphAtlas({
  fontUrl = DEFAULT_FONT_URL,
  glyphMap,
}) {
  const sortedEntries = Object.entries(glyphMap).sort(([a], [b]) => a.localeCompare(b));
  const cacheKey = `${fontUrl}|${JSON.stringify(sortedEntries)}`;
  if (atlasCache.has(cacheKey)) {
    return atlasCache.get(cacheKey);
  }

  const atlasPromise = (async () => {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to load bitmap score font: ${response.status} ${response.statusText}`);
    }

    const glyphs = parseDatGlyphs(await response.arrayBuffer());
    const atlas = {
      glyphs: {},
      height: 0,
    };

    for (const [char, glyphIndex] of sortedEntries) {
      const glyph = glyphs[glyphIndex];
      if (!glyph) {
        throw new Error(`Bitmap score font is missing glyph index ${glyphIndex}.`);
      }

      const image = bmpGlyphToDataUrl(glyph);
      atlas.glyphs[char] = image;
      atlas.height = Math.max(atlas.height, image.height);
    }

    return atlas;
  })();

  atlasCache.set(cacheKey, atlasPromise);
  return atlasPromise;
}

function createBitmapGlyphRenderer({
  container,
  fallbackEl = null,
  fontUrl = DEFAULT_FONT_URL,
  glyphMap,
  normalizeValue = (value) => String(value ?? ""),
}) {
  if (!container) {
    throw new Error("Bitmap renderer requires a container element.");
  }

  let atlas = null;
  let currentValue = normalizeValue("");

  const render = () => {
    if (!atlas) {
      return;
    }

    container.replaceChildren();
    container.setAttribute("aria-label", currentValue);

    for (const char of currentValue) {
      if (char === " ") {
        const spacer = document.createElement("span");
        spacer.className = "bitmap-score-space";
        spacer.style.width = `${Math.max(4, Math.round(atlas.height * 0.35))}px`;
        spacer.style.height = `${atlas.height}px`;
        container.appendChild(spacer);
        continue;
      }

      const glyph = atlas.glyphs[char];
      if (!glyph) {
        continue;
      }

      const image = document.createElement("img");
      image.className = "bitmap-score-digit";
      image.src = glyph.src;
      image.alt = "";
      image.width = glyph.width;
      image.height = glyph.height;
      image.decoding = "async";
      image.draggable = false;
      container.appendChild(image);
    }
  };

  const ready = loadBitmapGlyphAtlas({
    fontUrl,
    glyphMap,
  })
    .then((loadedAtlas) => {
      atlas = loadedAtlas;
      render();
      container.style.display = "";
      fallbackEl?.classList.add("bitmap-score-fallback-hidden");
      container.dataset.bitmapScoreStatus = "ready";
      return loadedAtlas;
    })
    .catch((error) => {
      container.dataset.bitmapScoreStatus = "failed";
      console.warn("Bitmap renderer fallback to text:", error);
      return null;
    });

  return {
    ready,
    setValue(value) {
      currentValue = normalizeValue(value);
      if (atlas) {
        render();
      }
    },
  };
}

export function createBitmapFontTextRenderer({
  container,
  fallbackEl = null,
  fontUrl = DEFAULT_FONT_URL,
  text = "",
  alphabet = DEFAULT_UPPERCASE,
  firstGlyphIndex = DEFAULT_UPPERCASE_FIRST_INDEX,
  glyphMap = null,
  normalizeValue = (value) => String(value ?? "").toUpperCase(),
} = {}) {
  const renderer = createBitmapGlyphRenderer({
    container,
    fallbackEl,
    fontUrl,
    glyphMap: glyphMap ?? buildSequentialGlyphMap(alphabet, firstGlyphIndex),
    normalizeValue,
  });

  renderer.setValue(text);
  return renderer;
}

export function createBitmapScoreRenderer({
  container,
  fallbackEl = null,
  fontUrl = DEFAULT_FONT_URL,
  digits = DEFAULT_DIGITS,
  firstDigitIndex = DEFAULT_FIRST_DIGIT_INDEX,
} = {}) {
  const renderer = createBitmapGlyphRenderer({
    container,
    fallbackEl,
    fontUrl,
    glyphMap: buildSequentialGlyphMap(digits, firstDigitIndex),
    normalizeValue: normalizeScoreValue,
  });

  renderer.setValue(0);
  return renderer;
}