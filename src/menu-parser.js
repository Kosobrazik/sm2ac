const NAME_TOKEN_TO_VAR = {
  Exit: "sNameExit",
  Crawl: "sNameCrawl",
  Crook: "sNameCrook",
  Cafe: "sNameHeist",
  Lab: "sNameLab",
  MugShot: "sNameMugshot",
  Ware: "sNameWare",
  WebSling: "sNameWebSling",
  Print: "sNamePrint",
};

function normalizeAssetPath(path) {
  return path.replace(/\\/g, "/").toLowerCase();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseMenuScript(source) {
  const lines = source.split(/\r?\n/);
  const sprites = new Map();
  const names = new Map();
  const order = [];
  const vars = new Map();
  let currentSpriteName = null;

  const getSprite = (name) => {
    const key = name.toLowerCase();
    if (!sprites.has(key)) {
      sprites.set(key, {
        name,
        frames: {},
        binks: {},
      });
      order.push(key);
    }
    return sprites.get(key);
  };

  const resolveCoord = (token) => {
    const parsed = toNumber(token);
    if (parsed !== null) {
      return parsed;
    }
    const fromVar = vars.get(token);
    return typeof fromVar === "number" ? fromVar : null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("*")) {
      continue;
    }

    let m = line.match(/^SET\s+(sName\w+)\s*=\s*(.+)$/i);
    if (m) {
      names.set(m[1], m[2]);
      continue;
    }

    m = line.match(/^SET\s+(\w+)\s*=\s*(.+)$/i);
    if (m) {
      const numericValue = toNumber(m[2]);
      vars.set(m[1], numericValue ?? m[2]);
      continue;
    }

    m = line.match(/^SPRITENAME\s+(\w+)$/i);
    if (m) {
      currentSpriteName = m[1];
      getSprite(m[1]);
      continue;
    }

    if (/^ADDFRAME\s+/i.test(line)) {
      const tokens = line.split(/\s+/);
      let owner = currentSpriteName;
      let assetPath = null;
      let state = null;

      if (tokens.length >= 3 && (tokens[1].includes("\\") || tokens[1].includes("/"))) {
        assetPath = tokens[1];
        state = tokens[2];
      } else if (tokens.length >= 4) {
        owner = tokens[1];
        assetPath = tokens[2];
        state = tokens[3];
      }

      if (owner && assetPath && state) {
        const sprite = getSprite(owner);
        sprite.frames[state.toLowerCase()] = normalizeAssetPath(assetPath);
      }
      continue;
    }

    m = line.match(/^ADDBINK\s+(\w+)\s+([^\s]+)\s+(\w+)/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.binks[m[3].toLowerCase()] = normalizeAssetPath(m[2]);
      continue;
    }

    m = line.match(/^SETPOSITION\s+(\w+)\s+([^\s]+)\s+([^\s]+)\s+/i);
    if (m) {
      const sprite = getSprite(m[1]);
      const x = resolveCoord(m[2]);
      const y = resolveCoord(m[3]);
      if (x !== null && y !== null) {
        sprite.position = { x, y };
      }
      continue;
    }

    m = line.match(/^HOTSPOTAREA\s+(\w+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)$/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.hotspot = {
        ox: Number(m[2]),
        oy: Number(m[3]),
        w: Number(m[4]),
        h: Number(m[5]),
      };
      continue;
    }

    m = line.match(/^STORE\s+(\w+)\s+ROLLOVER\s+.*PLAYBINK\s+NameBink\s+(\w+)/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.nameToken = m[2];
      continue;
    }

    m = line.match(/^STORE\s+(\w+)\s+ROLLOVER\s+.*SHOW\s+(CU\w+)/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.popupSpriteId = m[2].toLowerCase();
      continue;
    }

    m = line.match(/^STORE\s+(\w+)\s+ROLLOVER\s+.*PLAYONESOUND\s+sndLocation\s+([^\s]+)/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.hoverVoice = normalizeAssetPath(m[2]);
      continue;
    }

    m = line.match(/^STORE\s+(\w+)\s+CLICK\s+.*FADEOUT\s+LOAD\s+scripts\\([\w\d_]+)\.txt/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.targetScript = `${m[2].toLowerCase()}.txt`;
      continue;
    }

    m = line.match(/^STORE\s+(\w+)\s+CLICK\s+.*EXECUTE\s+game\s+ESC/i);
    if (m) {
      const sprite = getSprite(m[1]);
      sprite.targetScript = "exit";
    }
  }

  const nameBinkSprite = sprites.get("namebink") || null;

  const items = [];
  for (const key of order) {
    const sprite = sprites.get(key);
    if (!sprite?.position) {
      continue;
    }

    const hasAction = Boolean(sprite.targetScript);
    const isQuit = key === "quit";
    if (!hasAction && !isQuit) {
      continue;
    }

    const labelVar = sprite.nameToken ? NAME_TOKEN_TO_VAR[sprite.nameToken] : "sNameExit";
    const label = (labelVar && names.get(labelVar)) || sprite.nameToken || sprite.name || "Unknown";
    const base = isQuit ? (sprite.frames.wait || null) : null;
    const overlay = sprite.frames.over || sprite.frames.glow || null;

    let popupBink = null;
    let popupPosition = null;
    if (sprite.popupSpriteId) {
      const popupSprite = sprites.get(sprite.popupSpriteId);
      popupBink = popupSprite?.binks?.over || null;
      popupPosition = popupSprite?.position || null;
    }

    let nameBink = null;
    let nameBinkPosition = null;
    if (sprite.nameToken && nameBinkSprite) {
      nameBink = nameBinkSprite.binks?.[sprite.nameToken.toLowerCase()] || null;
      nameBinkPosition = nameBinkSprite.position || null;
    }

    items.push({
      id: key,
      label,
      base,
      overlay,
      position: sprite.position,
      hotspot: sprite.hotspot || null,
      targetScript: sprite.targetScript || "unknown",
      popupBink,
      popupPosition,
      nameBink,
      nameBinkPosition,
      hoverVoice: sprite.hoverVoice || null,
    });
  }

  return { items };
}






