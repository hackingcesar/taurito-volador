const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// =========================
// SOPORTE MÓVIL / RESPONSIVE V2
// =========================
function setupMobileCanvas() {
  const css = `
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0b1f13;
      touch-action: none;
      overscroll-behavior: none;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #gameCanvas {
      display: block;
      background: #000;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      image-rendering: auto;
    }

    #rotatePhoneOverlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: linear-gradient(180deg, #0b1f13, #164d2c);
      color: white;
      font-family: Arial, sans-serif;
      padding: 28px;
      box-sizing: border-box;
    }

    #rotatePhoneOverlay .box {
      max-width: 420px;
      border: 3px solid rgba(255,255,255,.85);
      border-radius: 22px;
      padding: 28px 24px;
      background: rgba(0,0,0,.28);
      box-shadow: 0 18px 45px rgba(0,0,0,.35);
    }

    #rotatePhoneOverlay .icon {
      font-size: 74px;
      line-height: 1;
      margin-bottom: 14px;
    }

    #rotatePhoneOverlay h1 {
      margin: 0 0 12px;
      font-size: 30px;
      color: #ffdf4d;
    }

    #rotatePhoneOverlay p {
      margin: 0;
      font-size: 20px;
      line-height: 1.35;
    }
  `;

  if (!document.getElementById("mobileGameStyle")) {
    const style = document.createElement("style");
    style.id = "mobileGameStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (!document.getElementById("rotatePhoneOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "rotatePhoneOverlay";
    overlay.innerHTML = `
      <div class="box">
        <div class="icon">📱↔️</div>
        <h1>Gira tu celular</h1>
        <p>Para jugar Taurito Volador, usa el teléfono en horizontal.</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function getViewportSize() {
    const vv = window.visualViewport;
    return {
      w: Math.floor(vv ? vv.width : window.innerWidth),
      h: Math.floor(vv ? vv.height : window.innerHeight)
    };
  }

  function resizeGameCanvas() {
    const size = getViewportSize();
    const w = size.w;
    const h = size.h;
    const overlay = document.getElementById("rotatePhoneOverlay");
    const isTouchDevice = navigator.maxTouchPoints > 0;
    const isPortrait = h > w;

    if (isTouchDevice && isPortrait) {
      overlay.style.display = "flex";
      canvas.style.display = "none";
      return;
    }

    overlay.style.display = "none";
    canvas.style.display = "block";

    const gameRatio = 16 / 9;
    let cssW = w;
    let cssH = Math.floor(cssW / gameRatio);

    if (cssH > h) {
      cssH = h;
      cssW = Math.floor(cssH * gameRatio);
    }

    cssW = Math.max(1, cssW - 2);
    cssH = Math.max(1, cssH - 2);

    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
  }

  window.addEventListener("resize", resizeGameCanvas);
  window.addEventListener("orientationchange", () => setTimeout(resizeGameCanvas, 250));

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resizeGameCanvas);
  }

  window.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  window.addEventListener("contextmenu", (e) => e.preventDefault());

  resizeGameCanvas();
}

setupMobileCanvas();



const tauritoFrames = ["taurito_01.png","taurito_02.png","taurito_03.png","taurito_04.png"].map(name => {
  const im = new Image();
  im.src = "assets/" + name;
  return im;
});

// Nuevos sprites enemigos CBTA 95
// Coloca tus PNG en: assets/obstacles/
// Puedes usar cualquiera de estos nombres. El juego intentará varias opciones.
const obstacleAliases = {
  siloTop: ["silo_top.png", "siloTop.png", "silo-techo.png", "silo_techo.png", "Silo Top.png"],
  siloBody: ["silo_body.png", "siloBody.png", "silo_cuerpo.png", "silo_tramo.png", "Silo Body.png"],
  siloBase: ["silo_base.png", "siloBase.png", "silo_base_cbta95.png", "silo_cbta95.png", "Silo Base.png"],
  paca: ["paca.png", "paca_heno.png", "paca-de-heno.png", "heno.png", "Paca.png"],
  costal: ["costal.png", "costal_humus95.png", "humus95.png", "costal_humus.png", "Costal.png"],
  arbolPequeno: ["arbol chico.png", "arbol_chico.png", "arbol-chico.png", "arbol_pequeno.png", "arbol_guayaba.png", "guayaba.png", "arbol-pequeno.png", "Arbol Chico.png", "Arbol Pequeno.png"],
  arbolMediano: ["arbol mediano.png", "arbol_mediano.png", "arbol-mediano.png", "arbol_macuili.png", "macuili.png", "Arbol Mediano.png"],
  arbolGrande: ["arbol grande.png", "arbol_grande.png", "arbol-grande.png", "arbol_ceiba.png", "ceiba.png", "Arbol Grande.png"],
  tractor: ["tractor.png", "tractor_cbta.png", "tractor_conductor.png", "Tractor.png"],
  profesor: ["profesor.png", "maestro.png", "profe.png", "Profesor.png"],
  prefecto: ["prefecto.png", "Prefecto.png"],
  director: ["director.png", "Director.png"]
};

const obstacleImgs = {};
for (const key in obstacleAliases) {
  obstacleImgs[key] = obstacleAliases[key].map(name => loadImg("assets/obstacles/" + name));
}

const OBSTACLE_TYPES = {
  // Pesos de rareza acordados:
  // 35% paca, 25% costal, 15% silo, 10% árboles, 7% tractor, 5% profesor, 2% prefecto, 1% director.
  silo:          { label:"Silo",          rarity:"comun",      points:1, weight:14, hitW:120, kind:"silo" },
  paca:          { label:"Paca",          rarity:"comun",      points:1, weight:32, hitW:100, kind:"stack", img:"paca", unitW:100, unitH:60 },
  costal:        { label:"Costal",        rarity:"comun",      points:1, weight:22, hitW:96,  kind:"stack", img:"costal", unitW:90, unitH:70 },

  // Los árboles siempre nacen desde abajo, valen 1 punto y ahora pueden estirarse hasta 200% de alto.
  arbolPequeno:  { label:"Árbol chico",   rarity:"comun",      points:1, weight:4,  hitW:86,  kind:"tree", img:"arbolPequeno", visualW:120, visualH:180 },
  arbolMediano:  { label:"Macuilí",       rarity:"comun",      points:1, weight:3,  hitW:98,  kind:"tree", img:"arbolMediano", visualW:140, visualH:240 },
  arbolGrande:   { label:"Ceiba",         rarity:"comun",      points:1, weight:3,  hitW:105, kind:"tree", img:"arbolGrande", visualW:170, visualH:320, hitboxScale:0.70 },

  // Obstáculos especiales con movimiento y bonus.
  tractor:       { label:"Tractor",       rarity:"especial",   points:2, weight:7,  hitW:158, kind:"fixed", img:"tractor",  visualW:180, visualH:120, alert:"ahí viene el tractor",   alertColor:"#ffdf7d", motion:"x", amp:230, freq:0.055 },
  profesor:      { label:"Maestro",       rarity:"especial",   points:3, weight:6,  hitW:96,  kind:"fixed", img:"profesor", visualW:110, visualH:150, alert:"ahí viene el maestro",  alertColor:"#ffdf7d", motion:"fullY", speed:0.032 },
  prefecto:      { label:"Prefecto",      rarity:"especial",   points:4, weight:4,  hitW:106, kind:"fixed", img:"prefecto", visualW:120, visualH:160, alert:"ahí viene el prefecto", alertColor:"#ff9f4d", motion:"fullY", speed:0.046 },
  director:      { label:"Director",      rarity:"legendario", points:5, weight:5,  hitW:118, kind:"fixed", img:"director", visualW:140, visualH:190, alert:"ahí viene el director",  alertColor:"#ff4d4d", motion:"fullY", speed:0.070 }
};

function loadImg(src) {
  const im = new Image();
  im.src = src;
  return im;
}

const W = canvas.width;
const H = canvas.height;

// Área jugable vertical MÁS ampliada con sprite ligeramente más pequeño: el suelo queda casi decorativo y el techo permite más margen.
// No se modifica la gravedad ni el impulso; solo aumenta el espacio disponible para moverse.
const FLOOR_H = 0;
const CEILING_MARGIN = -140;
const PLAY_BOTTOM = H - FLOOR_H;

const GRAVITY = 0.49; // más desafiante
const FLAP = -8.7; // impulso ajustado para la gravedad
const PLAYER_X = 250;

let state = "menu";
let score = 0;
let best = Number(localStorage.getItem("tauritoBestCompetencia") || 0);
let frame = 0;
let paused = false;
let soundOn = true;
let difficultyName = "FÁCIL";
let lastMedal = 0;
let flashText = "";
let flashTimer = 0;
let boostTimer = 0;
let alertText = "";
let alertTimer = 0;
let alertColor = "#ffdf7d";
let bonusText = "";
let bonusTimer = 0;

const audio = {
  flap: new Audio("audio/flap.wav"),
  point: new Audio("audio/point.wav"),
  hit: new Audio("audio/hit.wav"),
  medal: new Audio("audio/medal.wav"),
  record: new Audio("audio/record.wav"),
  start: new Audio("audio/start.wav")
};

function playSound(name) {
  if (!soundOn || !audio[name]) return;
  try {
    audio[name].currentTime = 0;
    audio[name].play();
  } catch (e) {}
}

const player = {
  x: PLAYER_X,
  y: H / 2,
  r: 26,
  vy: 0,
  angle: 0
};

let obstacles = [];
let particles = [];
let medals = [];

let clouds = [
  {x: 120, y: 80, s: 1.0},
  {x: 520, y: 130, s: 0.75},
  {x: 980, y: 85, s: 1.15},
  {x: 1340, y: 160, s: 0.62}
];

// Alterna la altura de los huecos para obligar al jugador a subir y bajar,
// pero mantiene el espacio suficientemente amplio para competir sin frustración.
let lastGapMode = "low";

// Seguridad de paso: evita que se generen obstáculos imposibles.
// MIN_CLEAR_GAP es el hueco vertical mínimo real que debe quedar libre.
const MIN_CLEAR_GAP = 285;
const TREE_UPPER_CLEARANCE = 305;

function resetGame() {
  state = "playing";
  score = 0;
  frame = 0;
  player.y = H / 2;
  player.vy = 0;
  player.angle = 0;
  obstacles = [];
  medals = [];
  particles = [];
  paused = false;
  lastMedal = 0;
  flashText = "";
  flashTimer = 0;
  lastGapMode = "low";
  alertText = "";
  alertTimer = 0;
  bonusText = "";
  bonusTimer = 0;
  playSound("start");
}

function flap() {
  if (state === "menu" || state === "gameover") {
    resetGame();
    return;
  }
  if (state === "playing" && !paused) {
    player.vy = FLAP;
    boostTimer = 14;
    playSound("flap");
    makeDust(player.x - 24, player.y + 22, 7);
  }
}

function getDifficulty() {
  // MODO COMPETENCIA:
  // La dificultad sube más rápido para que sea emocionante en torneo.
  let level = 0;
  if (score >= 50) level = 5;
  else if (score >= 35) level = 4;
  else if (score >= 25) level = 3;
  else if (score >= 15) level = 2;
  else if (score >= 7) level = 1;

  const data = [
    {name:"FÁCIL", gap:350, interval:138, speed:3.15},
    {name:"NORMAL", gap:335, interval:132, speed:3.48},
    {name:"DIFÍCIL", gap:322, interval:126, speed:3.86},
    {name:"EXPERTO", gap:308, interval:120, speed:4.25},
    {name:"EXTREMO", gap:298, interval:114, speed:4.62},
    {name:"LEYENDA", gap:290, interval:108, speed:5.00}
  ][level];

  // Aumento gradual extra: un poco más rápido, pero con huecos más justos/amistosos.
  data.speed += Math.min(0.55, score * 0.010);
  data.gap = Math.max(282, data.gap - Math.floor(score / 26) * 2);

  difficultyName = data.name;
  return data;
}

function chooseObstacleType() {
  // Sistema de rarezas por peso.
  // Solo permite UN obstáculo especial/personaje a la vez para evitar saturar la pantalla.
  const hasSpecialOnScreen = obstacles.some(o => o.meta && o.meta.kind === "fixed" && o.x > -220 && o.x < W + 260);
  const keys = Object.keys(OBSTACLE_TYPES).filter(key => {
    if (!hasSpecialOnScreen) return true;
    return OBSTACLE_TYPES[key].kind !== "fixed";
  });

  let total = 0;
  for (const key of keys) total += OBSTACLE_TYPES[key].weight;

  let roll = Math.random() * total;
  for (const key of keys) {
    roll -= OBSTACLE_TYPES[key].weight;
    if (roll <= 0) return key;
  }
  return "paca";
}

function chooseTreeUpperType() {
  // Complementos superiores para árboles: se dibujan desde arriba y ayudan a cerrar visualmente el espacio.
  const options = ["paca", "costal", "silo"];
  return options[Math.floor(Math.random() * options.length)];
}

function addObstacle() {
  const d = getDifficulty();
  const minTop = 0;
  const maxTop = PLAY_BOTTOM - d.gap;

  // Genera huecos por zonas: alto, medio y bajo.
  let gapMode;
  if (Math.random() < 0.82) {
    gapMode = lastGapMode === "high" ? "low" : "high";
  } else {
    const modes = ["high", "mid", "low"];
    gapMode = modes[Math.floor(Math.random() * modes.length)];
  }
  lastGapMode = gapMode;

  const zones = {
    high: 18 + Math.random() * 45,
    mid: PLAY_BOTTOM * 0.50 + (Math.random() * 70 - 35),
    low: PLAY_BOTTOM - (18 + Math.random() * 45)
  };
  const center = zones[gapMode];
  let topH = Math.floor(center - d.gap / 2);
  topH = Math.max(minTop, Math.min(maxTop, topH));

  const typeKey = chooseObstacleType();
  const meta = OBSTACLE_TYPES[typeKey];

  // En niveles altos los hitboxes crecen solo un poco.
  let baseW = meta.hitW || 100;
  if (score >= 25) baseW += 4;
  if (score >= 50) baseW += 4;

  const treeScale = meta.kind === "tree" ? 1.00 + Math.random() * 1.00 : 1;

  // Ajuste anti-imposibles:
  // 1) Los árboles siempre nacen desde abajo.
  // 2) El complemento superior deja un espacio real mínimo entre su borde y la copa.
  // 3) Los personajes con movimiento vertical reciben un gap extra proporcional a su amplitud.
  let actualGap = Math.max(d.gap, MIN_CLEAR_GAP);
  if (meta.kind === "fixed") {
    // Los especiales ahora son un solo sprite móvil, no columnas dobles.
    // Se deja un gap amplio para que el resto de la generación no cierre pasos imposibles.
    actualGap = Math.max(actualGap, d.gap + 60);
  }

  if (meta.kind === "tree") {
    const treeH = (meta.visualH || 180) * treeScale;
    const treeTopY = PLAY_BOTTOM - treeH;
    const safeGap = Math.max(TREE_UPPER_CLEARANCE, d.gap);
    topH = Math.max(0, treeTopY - safeGap);
    actualGap = Math.max(MIN_CLEAR_GAP, treeTopY - topH);
  } else {
    // Si el gap se agranda por movimiento, se vuelve a centrar/clamp para evitar columnas imposibles.
    const safeMaxTop = Math.max(0, PLAY_BOTTOM - actualGap - 35);
    topH = Math.max(0, Math.min(safeMaxTop, Math.floor(center - actualGap / 2)));
    // Último candado: si por clamp el hueco queda raro, se recalcula dentro de límites seguros.
    if (topH + actualGap > PLAY_BOTTOM - 35) topH = Math.max(0, PLAY_BOTTOM - actualGap - 35);
  }

  const o = {
    x: W + 80,
    w: baseW,
    topH,
    gap: actualGap,
    passed: false,
    typeKey,
    kind: meta.kind,
    meta,
    phase: Math.random() * Math.PI * 2,
    moving: false,
    gapMode,
    treeScale,
    // Cuando sale un árbol abajo, arriba se completa con otro obstáculo para no dejar la pantalla vacía.
    upperTypeKey: meta.kind === "tree" ? chooseTreeUpperType() : null
  };

  obstacles.push(o);
  if (meta.kind === "fixed" && meta.alert) {
    // Aviso anticipado: aparece desde que el especial se genera, antes de entrar a pantalla.
    o.alertShown = true;
    showAlert(meta.alert, meta.alertColor || "#ffdf7d");
  }
  spawnStrategicCoin(o);
}

function spawnStrategicCoin(o) {
  // Monedas de +2 colocadas de forma estratégica:
  // aparecen en el lado contrario al hueco principal para que sean premio de riesgo.
  if (score < 2) return;
  const chance = o.meta && o.meta.kind === "tree" ? 0.18 : 0.12;
  if (Math.random() > chance) return;

  let safeTop = o.topH + 65;
  let safeBottom = o.topH + o.gap - 65;

  // En árboles el paso real está entre el complemento superior y la copa.
  if (o.meta && o.meta.kind === "tree") {
    const scale = o.treeScale || 1;
    const treeH = (o.meta.visualH || 180) * scale;
    const treeTopY = PLAY_BOTTOM - treeH;
    safeTop = Math.max(65, o.topH + 70);
    safeBottom = Math.min(treeTopY - 55, PLAY_BOTTOM - 70);
  }

  if (safeBottom <= safeTop + 30) return;

  // Contrario a la abertura:
  // gap alto  -> moneda abajo del hueco
  // gap bajo  -> moneda arriba del hueco
  // gap medio -> alterna arriba/abajo
  const range = safeBottom - safeTop;
  let y;
  if (o.gapMode === "high") {
    y = Math.min(PLAY_BOTTOM - 25, safeTop + range * (0.94 + Math.random() * 0.05));
  } else if (o.gapMode === "low") {
    y = Math.max(25, safeTop + range * (0.01 + Math.random() * 0.05));
  } else {
    const upper = Math.random() < 0.5;
    y = upper ? Math.max(25, safeTop + range * (0.01 + Math.random() * 0.05))
              : Math.min(PLAY_BOTTOM - 25, safeTop + range * (0.94 + Math.random() * 0.05));
  }

  // X ANTES del obstáculo: la moneda queda en la dirección contraria al camino,
  // pero todavía es físicamente posible tomarla y regresar al hueco.
  // Mientras más avance el juego, la moneda queda un poco más separada y exige más decisión.
  const riskOffset = 230 + Math.min(90, score * 1.5);
  medals.push({x: o.x - riskOffset - 80, y, r: 15, taken:false, value:2});
}


function getSiloColumnHitRects(columnX, columnY, columnW, columnH, topSide) {
  // Hitboxes especiales para silo modular.
  // El techo cónico solo usa una franja central estrecha para evitar golpes fantasma en la punta.
  const visualW = 100;
  const baseW = 120;
  const topH = 60;
  const baseH = 60;
  const overlap = 6;
  const visualX = columnX + (columnW - visualW) / 2;
  const baseX = columnX + (columnW - baseW) / 2;

  const rects = [];
  const add = (x, y, w, h) => {
    if (h > 8 && w > 8) rects.push({x, y, w, h});
  };

  if (columnH <= topH + baseH) {
    const topPartH = Math.max(12, columnH - baseH + overlap);
    if (topSide) {
      // Al estar invertido, la base queda arriba y el techo cerca del gap.
      add(baseX + 14, columnY, baseW - 28, Math.min(baseH, columnH));
      add(visualX + visualW * 0.38, columnY + columnH - topPartH, visualW * 0.24, topPartH);
    } else {
      add(visualX + visualW * 0.38, columnY, visualW * 0.24, topPartH);
      add(baseX + 14, columnY + columnH - baseH, baseW - 28, Math.min(baseH, columnH));
    }
    return rects;
  }

  if (topSide) {
    // Silo superior invertido: base arriba, cuerpo al centro, techo abajo cerca del hueco.
    add(baseX + 14, columnY, baseW - 28, baseH);
    add(visualX + 8, columnY + baseH - overlap, visualW - 16, columnH - topH - baseH + overlap * 2);
    add(visualX + visualW * 0.38, columnY + columnH - topH, visualW * 0.24, topH);
  } else {
    // Silo inferior normal: techo arriba cerca del hueco, cuerpo al centro, base abajo.
    add(visualX + visualW * 0.38, columnY, visualW * 0.24, topH);
    add(visualX + 8, columnY + topH - overlap, visualW - 16, columnH - topH - baseH + overlap * 2);
    add(baseX + 14, columnY + columnH - baseH, baseW - 28, baseH);
  }

  return rects;
}

function getObstacleHitRects(o) {
  const ys = o.yShift || 0;
  const xs = o.xShift || 0;
  const ox = o.x + xs;
  const meta = o.meta || OBSTACLE_TYPES[o.typeKey] || OBSTACLE_TYPES.paca;

  // Árboles: solo nacen desde la parte baja, como un árbol real.
  // No hay árbol colgado de cabeza ni árbol superior.
  if (meta.kind === "tree") {
    const scale = o.treeScale || 1;
    const widthScale = 1 + (scale - 1) * 0.15;
    const visualW = (meta.visualW || 120) * widthScale;
    const visualH = (meta.visualH || 180) * scale;
    const hitScale = meta.hitboxScale || 0.72;
    const hitW = (meta.hitW || visualW) * widthScale * hitScale;
    const hitH = visualH * 0.92;
    const x = ox + (o.w - visualW) / 2 + (visualW - hitW) / 2;
    const y = PLAY_BOTTOM - hitH;

    const rects = [{x, y, w: hitW, h: hitH}];

    // Complemento superior: paca/costal/silo desde arriba.
    // La colisión usa el ancho del complemento, centrado sobre el mismo eje del árbol.
    if (o.upperTypeKey) {
      const upperMeta = OBSTACLE_TYPES[o.upperTypeKey] || OBSTACLE_TYPES.silo;
      const upperW = upperMeta.hitW || o.w;
      const upperX = ox + (o.w - upperW) / 2;
      const upperH = Math.max(35, Math.min(o.topH + 20, y - 170));
      if (upperH > 30) {
        if (upperMeta.kind === "silo") rects.push(...getSiloColumnHitRects(upperX, 0, upperW, upperH, true));
        else rects.push({x: upperX, y: 0, w: upperW, h: upperH});
      }
    }
    return rects;
  }

  // Silo: hitbox especial por piezas. El Silo Top usa solo una franja central.
  if (meta.kind === "silo") {
    return [
      ...getSiloColumnHitRects(ox, ys, o.w, o.topH, true),
      ...getSiloColumnHitRects(ox, o.topH + o.gap + ys, o.w, PLAY_BOTTOM - (o.topH + o.gap), false)
    ];
  }

  // Para paca y costal, la colisión sigue siendo columna completa.
  if (meta.kind !== "fixed") {
    const hitW = meta.hitboxScale ? o.w * meta.hitboxScale : o.w;
    const hitX = ox + (o.w - hitW) / 2;
    return [
      {x: hitX, y: ys, w: hitW, h: o.topH},
      {x: hitX, y: o.topH + o.gap + ys, w: hitW, h: PLAY_BOTTOM - (o.topH + o.gap)}
    ];
  }

  // Especiales: un solo sprite a la vez, siempre del mismo tamaño.
  const visualW = meta.visualW || o.w;
  const visualH = meta.visualH || 140;
  const hitW = meta.hitW || visualW;
  const hitH = meta.hitH || visualH;
  const pos = getFixedSpritePosition(o, meta);
  const hx = pos.x + (visualW - hitW) / 2;
  const hy = pos.y + (visualH - hitH) / 2;
  return [{x: hx, y: hy, w: hitW, h: hitH}];
}

function update() {
  if (paused || state !== "playing") return;

  frame++;
  const d = getDifficulty();

  clouds.forEach(c => {
    c.x -= 0.25 * c.s;
    if (c.x < -160) c.x = W + 160;
  });

  player.vy += GRAVITY;
  player.y += player.vy;
  player.angle = Math.max(-0.48, Math.min(0.86, player.vy / 12));

  if (frame % d.interval === 0) addObstacle();

  for (const o of obstacles) {
    o.x -= d.speed;

    // Movimientos especiales acordados.
    // Tractor: izquierda-derecha. Profesor/Prefecto/Director: arriba-abajo con dificultad creciente.
    o.xShift = 0;
    o.yShift = 0;
    if (o.meta && o.meta.motion === "x") {
      o.xShift = Math.sin(frame * (o.meta.freq || 0.08) + o.phase) * (o.meta.amp || 18);
    }
    if (o.meta && o.meta.motion === "y") {
      o.yShift = Math.sin(frame * (o.meta.freq || 0.08) + o.phase) * (o.meta.amp || 18);
    }
    // fullY se calcula directamente al dibujar y colisionar para abarcar toda la pantalla.

    if (!o.passed && o.x + o.w < player.x - player.r) {
      o.passed = true;
      const gained = o.meta && o.meta.points ? o.meta.points : 1;
      score += gained;
      playSound("point");
      if (gained > 1) showBonus("+" + gained + " BONUS");

      if (score > best) {
        best = score;
        localStorage.setItem("tauritoBestCompetencia", best);
        if (score > 2) {
          showFlash("¡NUEVO RÉCORD CBTA 95!");
          playSound("record");
        }
      }

    }

    // Alerta especial cuando el obstáculo ya viene cerca del jugador.
    if (o.meta && o.meta.alert && !o.alertShown && o.x < W - 260) {
      o.alertShown = true;
      showAlert(o.meta.alert, o.meta.alertColor || "#ffdf7d");
    }

    const rects = getObstacleHitRects(o);
    for (const r of rects) {
      if (circleRectCollision(player.x, player.y, player.r * 0.72, r.x, r.y, r.w, r.h)) {
        gameOver();
        break;
      }
    }
  }

  obstacles = obstacles.filter(o => o.x > -170);

  for (const m of medals) {
    m.x -= d.speed;
    if (!m.taken && Math.hypot(player.x - m.x, player.y - m.y) < player.r + m.r) {
      m.taken = true;
      const val = m.value || 2;
      score += val;
      playSound("medal");
      showBonus("+" + val);
      makeSpark(m.x, m.y, 22);
      if (score > best) {
        best = score;
        localStorage.setItem("tauritoBestCompetencia", best);
      }
    }
  }
  medals = medals.filter(m => m.x > -50 && !m.taken);

  if (player.y - player.r < CEILING_MARGIN || player.y + player.r > PLAY_BOTTOM) {
    gameOver();
  }

  updateParticles();
  if (flashTimer > 0) flashTimer--;
  if (boostTimer > 0) boostTimer--;
  if (alertTimer > 0) alertTimer--;
  if (bonusTimer > 0) bonusTimer--;
}

function showFlash(txt) {
  flashText = txt;
  flashTimer = 120;
}

function showAlert(txt, color = "#ffdf7d") {
  alertText = txt;
  alertColor = color;
  alertTimer = 150;
}

function showBonus(txt) {
  bonusText = txt;
  bonusTimer = 70;
}

function gameOver() {
  if (state === "gameover") return;
  state = "gameover";
  playSound("hit");
  makeSpark(player.x, player.y, 34);
}

function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < cr * cr;
}

function makeDust(x,y,n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: -Math.random() * 3 - 1,
      vy: Math.random() * 3 - 1.5,
      life: 24,
      type: "dust"
    });
  }
}

function makeSpark(x,y,n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: Math.random() * 8 - 4,
      vy: Math.random() * 8 - 4,
      life: 36,
      type: "spark"
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#74c9ff");
  grad.addColorStop(0.45, "#ccefff");
  grad.addColorStop(0.78, "#ffe7a8");
  grad.addColorStop(1, "#f0d083");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Sol con brillo suave
  const sunGrad = ctx.createRadialGradient(1080, 95, 10, 1080, 95, 95);
  sunGrad.addColorStop(0, "rgba(255,230,110,.95)");
  sunGrad.addColorStop(0.45, "rgba(255,203,70,.70)");
  sunGrad.addColorStop(1, "rgba(255,203,70,0)");
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(1080, 95, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd45c";
  ctx.beginPath();
  ctx.arc(1080, 95, 44, 0, Math.PI * 2);
  ctx.fill();

  clouds.forEach(c => drawCloud(c.x, c.y, c.s));

  // Aves pequeñas al fondo
  ctx.strokeStyle = "rgba(20,70,55,.45)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const bx = (W + 120 - ((frame * (0.45 + i * 0.05) + i * 210) % (W + 240)));
    const by = 105 + Math.sin(frame / 55 + i) * 18 + i * 18;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.quadraticCurveTo(bx, by - 10, bx + 10, by);
    ctx.moveTo(bx + 10, by);
    ctx.quadraticCurveTo(bx + 20, by - 10, bx + 30, by);
    ctx.stroke();
  }

  // Montañas lejanas
  ctx.fillStyle = "#7fb38d";
  ctx.beginPath();
  ctx.moveTo(0, 440);
  ctx.lineTo(180, 288);
  ctx.lineTo(340, 440);
  ctx.lineTo(520, 310);
  ctx.lineTo(710, 440);
  ctx.lineTo(W, 338);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Loma intermedia con parallax
  ctx.fillStyle = "#5fa568";
  const hillOffset = (frame * -0.45) % 260;
  ctx.beginPath();
  ctx.moveTo(-260 + hillOffset, 500);
  for (let x = -260 + hillOffset; x <= W + 260; x += 260) {
    ctx.quadraticCurveTo(x + 130, 420, x + 260, 500);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Siluetas de árboles del terreno
  ctx.fillStyle = "rgba(35,100,45,.82)";
  const treeOffset = (frame * -0.8) % 180;
  for (let x = -180 + treeOffset; x < W + 180; x += 180) {
    ctx.fillRect(x + 76, 430, 18, 94);
    ctx.beginPath();
    ctx.arc(x + 85, 424, 46, 0, Math.PI * 2);
    ctx.arc(x + 55, 455, 34, 0, Math.PI * 2);
    ctx.arc(x + 115, 455, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // Edificio escolar
  ctx.fillStyle = "#c79257";
  roundRect(520, 435, 260, 96, 8, true, true);
  ctx.fillStyle = "#8c4f2c";
  ctx.fillRect(500, 418, 300, 28);
  ctx.fillStyle = "#fff1b8";
  ctx.font = "bold 22px Arial";
  ctx.fillText("CBTA 95", 605, 466);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  for (let x = 545; x <= 735; x += 48) ctx.fillRect(x, 485, 26, 24);

  // Campo principal
  ctx.fillStyle = "#70b85b";
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.bezierCurveTo(250, 500, 500, 615, 760, 548);
  ctx.bezierCurveTo(950, 502, 1120, 545, 1280, 520);
  ctx.lineTo(1280, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Surcos animados para sensación de velocidad
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 4;
  const furrowOffset = (frame * -4) % 120;
  for (let x = -120 + furrowOffset; x < W + 160; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, PLAY_BOTTOM - 53);
    ctx.quadraticCurveTo(x + 55, PLAY_BOTTOM - 93, x + 150, PLAY_BOTTOM - 41);
    ctx.stroke();
  }

  // Cerca frontal
  ctx.fillStyle = "#3b8d3b";
  ctx.fillRect(0, PLAY_BOTTOM, W, FLOOR_H);
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(0, PLAY_BOTTOM - 14, W, 8);
  const postOffset = (frame * -3.2) % 95;
  for (let x = -95 + postOffset; x < W + 95; x += 95) {
    ctx.fillRect(x, PLAY_BOTTOM - 34, 14, 42);
  }

  ctx.fillStyle = "#2b6f2e";
  for (let x = -40 + (frame * -3.1 % 80); x < W + 80; x += 80) {
    ctx.fillRect(x, PLAY_BOTTOM + 3, 45, 7);
  }

  // Detalles pequeños del pasto
  ctx.fillStyle = "rgba(255,230,90,.75)";
  for (let x = -30 + (frame * -2.7 % 140); x < W + 140; x += 140) {
    ctx.beginPath();
    ctx.arc(x, H - 35, 4, 0, Math.PI * 2);
    ctx.arc(x + 13, H - 48, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCloud(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.beginPath();
  ctx.arc(0, 20, 28, 0, Math.PI * 2);
  ctx.arc(32, 12, 38, 0, Math.PI * 2);
  ctx.arc(72, 20, 30, 0, Math.PI * 2);
  ctx.rect(0, 20, 84, 30);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(o) {
  const ys = o.yShift || 0;
  const xs = o.xShift || 0;
  const ox = o.x + xs;
  const meta = o.meta || OBSTACLE_TYPES[o.typeKey] || OBSTACLE_TYPES.paca;

  // Árboles: solo desde abajo, nunca de cabeza.
  // Arriba se dibuja un complemento paca/costal/silo para cerrar la pantalla.
  if (meta.kind === "tree") {
    drawTreeUpperObstacle(o, ox);
    return drawTreeObstacle(o, ox);
  }

  if (meta.kind === "fixed") {
    return drawFixedSingle(o, meta);
  }

  drawObstaclePart(o, ox, -20 + ys, o.w, o.topH + 20, true);
  drawObstaclePart(o, ox, o.topH + o.gap + ys, o.w, PLAY_BOTTOM - (o.topH + o.gap), false);
}

function drawObstaclePart(o, x, y, w, h, topSide) {
  if (h <= 8) return;
  const meta = o.meta || OBSTACLE_TYPES[o.typeKey] || OBSTACLE_TYPES.paca;

  if (meta.kind === "silo") return drawSiloModular(x, y, w, h, topSide);
  if (meta.kind === "stack") return drawStackedObstacle(meta, x, y, w, h, topSide);
  if (meta.kind === "tree") return;
  if (meta.kind === "fixed") return drawFixedObstacle(meta, x, y, w, h, topSide);

  // Respaldo si falta una configuración.
  drawPacaTower(x, y, w, h);
}

function getLoadedImage(key) {
  const group = obstacleImgs[key];
  if (!group) return null;
  const arr = Array.isArray(group) ? group : [group];
  for (const im of arr) {
    if (im && im.complete && im.naturalWidth > 0) return im;
  }
  return null;
}

function drawSiloModular(x, y, w, h, topSide) {
  const top = getLoadedImage("siloTop");
  const body = getLoadedImage("siloBody");
  const base = getLoadedImage("siloBase");

  const visualW = 100;
  const baseW = 120; // la base sobresale 10 px por lado para lucir más estable
  const partX = x + (w - visualW) / 2;
  const topH = 60;
  const bodyH = 80;
  const baseH = 60;

  ctx.save();
  if (topSide) {
    // Los silos superiores sí se invierten como columnas de Flappy Bird.
    ctx.translate(partX + visualW / 2, y + h);
    ctx.scale(1, -1);
    drawSiloModulesNormal(-visualW / 2, 0, visualW, baseW, h, top, body, base, topH, bodyH, baseH);
  } else {
    drawSiloModulesNormal(partX, y, visualW, baseW, h, top, body, base, topH, bodyH, baseH);
  }
  ctx.restore();
}

function drawSiloModulesNormal(x, y, w, baseW, h, top, body, base, topH, bodyH, baseH) {
  // Empalme entre piezas para evitar la junta vacía que aparece por transparencias o escalado.
  const overlap = 6;
  const baseX = x + (w - baseW) / 2;

  // Mínimo visual del silo: techo + base. Nunca se dibuja solo la base.
  if (h <= topH + baseH) {
    const availableTopH = Math.max(12, h - baseH + overlap);
    if (top) ctx.drawImage(top, x, y, w, availableTopH);
    else drawSilo(x, y, w, availableTopH, false);

    if (base) ctx.drawImage(base, baseX, y + h - baseH, baseW, baseH + overlap);
    else drawSilo(baseX, y + h - baseH, baseW, baseH + overlap, false);
    return;
  }

  if (top) ctx.drawImage(top, x, y, w, topH + overlap);
  else drawSilo(x, y, w, topH + overlap, false);

  let cy = y + topH - overlap;
  const endY = y + h - baseH + overlap;

  while (cy < endY) {
    const segH = Math.min(bodyH + overlap, endY - cy);
    if (body) ctx.drawImage(body, x, cy, w, segH);
    else drawSilo(x, cy, w, segH, false);
    cy += bodyH - overlap;
  }

  if (base) ctx.drawImage(base, baseX, y + h - baseH, baseW, baseH + overlap);
  else drawSilo(baseX, y + h - baseH, baseW, baseH + overlap, false);
}

function drawStackedObstacle(meta, x, y, w, h, topSide) {
  const im = getLoadedImage(meta.img);
  const unitW = meta.unitW || 100;
  const unitH = meta.unitH || 60;
  const visualX = x + (w - unitW) / 2;

  ctx.save();
  if (topSide) {
    ctx.translate(visualX + unitW / 2, y + h);
    ctx.scale(1, -1);
    drawStackNormal(im, -unitW / 2, 0, unitW, unitH, h);
  } else {
    drawStackNormal(im, visualX, y, unitW, unitH, h);
  }
  ctx.restore();
}

function drawStackNormal(im, x, y, unitW, unitH, h) {
  const count = Math.max(1, Math.ceil(h / unitH));
  for (let i = 0; i < count; i++) {
    const dy = y + h - unitH * (i + 1);
    const visibleH = Math.min(unitH, h - i * unitH);
    if (visibleH <= 0) continue;
    if (im) ctx.drawImage(im, x, dy, unitW, unitH);
    else drawPacaTower(x, dy, unitW, unitH);
  }
}

function drawTreeUpperObstacle(o, ox) {
  if (!o.upperTypeKey) return;
  const treeMeta = o.meta || OBSTACLE_TYPES[o.typeKey] || OBSTACLE_TYPES.arbolPequeno;
  const scale = o.treeScale || 1;
  const treeH = (treeMeta.visualH || 180) * scale;
  const treeTopY = PLAY_BOTTOM - treeH;

  // Mantiene un hueco justo entre el complemento superior y la copa del árbol.
  const maxUpperH = Math.max(0, treeTopY - TREE_UPPER_CLEARANCE);
  const h = Math.max(40, Math.min(o.topH + 20, maxUpperH));
  if (h <= 35) return;

  const upperMeta = OBSTACLE_TYPES[o.upperTypeKey] || OBSTACLE_TYPES.silo;
  const w = upperMeta.hitW || 100;
  const x = ox + (o.w - w) / 2;
  drawObstaclePart({ ...o, meta: upperMeta, typeKey: o.upperTypeKey }, x, -20, w, h + 20, true);
}

function drawTreeObstacle(o, ox) {
  const meta = o.meta || OBSTACLE_TYPES[o.typeKey] || OBSTACLE_TYPES.arbolPequeno;
  const im = getLoadedImage(meta.img);
  const scale = o.treeScale || 1;
  const widthScale = 1 + (scale - 1) * 0.15;
  const visualW = (meta.visualW || 120) * widthScale;
  const visualH = (meta.visualH || 180) * scale;
  const visualX = ox + (o.w - visualW) / 2;
  const visualY = PLAY_BOTTOM - visualH;

  ctx.save();
  if (im) ctx.drawImage(im, visualX, visualY, visualW, visualH);
  else drawPlaceholderSprite(visualX, visualY, visualW, visualH, meta.label || "Árbol");
  ctx.restore();
}

function getFixedSpritePosition(o, meta) {
  const visualW = meta.visualW || o.w;
  const visualH = meta.visualH || 140;
  let x = o.x + (o.xShift || 0) + (o.w - visualW) / 2;
  let y;

  if (meta.motion === "fullY") {
    // Recorre prácticamente toda la pantalla: maestro lento, prefecto medio, director rápido.
    const top = 14;
    const bottom = PLAY_BOTTOM - visualH - 14;
    const center = (top + bottom) / 2;
    const amp = Math.max(0, (bottom - top) / 2);
    y = center + Math.sin(frame * (meta.speed || 0.04) + o.phase) * amp;
  } else {
    // Tractor: un solo sprite, con movimiento lateral amplio, pero altura estable.
    y = Math.max(35, Math.min(PLAY_BOTTOM - visualH - 20, o.topH + o.gap / 2 - visualH / 2));
  }

  return {x, y, w: visualW, h: visualH};
}

function drawFixedSingle(o, meta) {
  const im = getLoadedImage(meta.img);
  const pos = getFixedSpritePosition(o, meta);
  ctx.save();
  if (im) ctx.drawImage(im, pos.x, pos.y, pos.w, pos.h);
  else drawPlaceholderSprite(pos.x, pos.y, pos.w, pos.h, meta.label || "?");
  ctx.restore();
}

function drawFixedObstacle(meta, x, y, w, h, topSide) {
  const im = getLoadedImage(meta.img);
  const baseW = meta.visualW || w;
  const baseH = meta.visualH || h;

  // Tractor, profesor, prefecto y director SIEMPRE conservan su tamaño original.
  // Ya no se reducen ni se agrandan según el tamaño de la columna.
  const visualW = baseW;
  const visualH = baseH;
  const visualX = x + (w - visualW) / 2;

  // IMPORTANTE:
  // Los personajes nunca se voltean de cabeza.
  // Si están arriba, se anclan al borde del hueco; si están abajo, nacen desde la parte baja del hueco.
  const visualY = topSide ? y + h - visualH : y;

  ctx.save();
  if (im) ctx.drawImage(im, visualX, visualY, visualW, visualH);
  else drawPlaceholderSprite(visualX, visualY, visualW, visualH, meta.label || "?");
  ctx.restore();
}

function drawPlaceholderSprite(x, y, w, h, label) {
  ctx.save();
  ctx.fillStyle = "rgba(40,120,55,.75)";
  ctx.strokeStyle = "#123b1d";
  ctx.lineWidth = 3;
  roundRect(x, y, w, h, 12, true, true);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 16px Arial";
  ctx.fillText(label, x + w/2, y + h/2);
  ctx.restore();
}

function drawAssetContain(im, x, y, w, h) {
  const ratio = im.naturalWidth / im.naturalHeight;
  let dw = w;
  let dh = w / ratio;
  if (dh < h) {
    dh = h;
    dw = h * ratio;
  }
  ctx.drawImage(im, x + (w-dw)/2, y + (h-dh)/2, dw, dh);
}

function drawSilo(x, y, w, h, topSide) {
  ctx.save();
  ctx.fillStyle = "#c6c6bd";
  ctx.strokeStyle = "#596257";
  ctx.lineWidth = 4;
  roundRect(x, y, w, h, 20, true, true);
  ctx.fillStyle = "#287b3a";
  if (topSide) {
    ctx.fillRect(x-3, y+h-18, w+6, 18);
  } else {
    ctx.fillRect(x-3, y, w+6, 18);
  }
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(x + 15, y + 20, 12, Math.max(20, h - 40));
  ctx.restore();
}

function drawPacaTower(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#d8b75a";
  ctx.strokeStyle = "#8a6a2e";
  ctx.lineWidth = 4;
  roundRect(x, y, w, h, 14, true, true);
  ctx.strokeStyle = "rgba(100,70,25,.5)";
  ctx.lineWidth = 3;
  for (let yy = y + 30; yy < y + h; yy += 42) {
    ctx.beginPath();
    ctx.moveTo(x + 6, yy);
    ctx.lineTo(x + w - 6, yy + Math.sin(yy) * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFence(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#9b642f";
  ctx.strokeStyle = "#553115";
  ctx.lineWidth = 4;
  roundRect(x+8, y, w-16, h, 10, true, true);
  ctx.fillStyle = "#c18744";
  for (let yy = y + 25; yy < y + h; yy += 60) {
    ctx.fillRect(x, yy, w, 20);
    ctx.strokeRect(x, yy, w, 20);
  }
  ctx.restore();
}

function drawTree(x, y, w, h, topSide) {
  ctx.save();
  ctx.fillStyle = "#7a4d24";
  ctx.strokeStyle = "#3c2411";
  ctx.lineWidth = 4;
  roundRect(x+w*0.38, y, w*0.24, h, 18, true, true);
  ctx.fillStyle = "#2f8c35";
  const crownY = topSide ? y+h-75 : y+35;
  ctx.beginPath();
  ctx.arc(x+w*.5, crownY, 55, 0, Math.PI*2);
  ctx.arc(x+w*.3, crownY+20, 38, 0, Math.PI*2);
  ctx.arc(x+w*.7, crownY+20, 38, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCorn(x, y, w, h, topSide) {
  ctx.save();
  ctx.fillStyle = "#2f8c35";
  roundRect(x+8, y, w-16, h, 24, true, true);
  ctx.fillStyle = "#ffcc32";
  const cobH = Math.min(130, h*.55);
  const cy = topSide ? y+h-cobH-10 : y+10;
  roundRect(x+23, cy, w-46, cobH, 28, true, true);
  ctx.strokeStyle = "rgba(120,80,0,.5)";
  for (let yy=cy+12; yy<cy+cobH; yy+=16) {
    ctx.beginPath();
    ctx.moveTo(x+25, yy);
    ctx.lineTo(x+w-25, yy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSack(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#d6bd87";
  ctx.strokeStyle = "#715b35";
  ctx.lineWidth = 4;
  roundRect(x+3, y, w-6, h, 22, true, true);
  ctx.fillStyle = "#155f31";
  ctx.textAlign = "center";
  ctx.font = "bold 22px Arial";
  if (h > 80) {
    ctx.fillText("CBTA", x+w/2, y+h/2-8);
    ctx.fillText("95", x+w/2, y+h/2+24);
  }
  ctx.restore();
}

function drawCBTA(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#2b7d3b";
  ctx.strokeStyle = "#17451f";
  ctx.lineWidth = 4;
  roundRect(x, y, w, h, 12, true, true);
  ctx.fillStyle = "#efe2a6";
  ctx.textAlign = "center";
  ctx.font = "bold 30px Arial";
  if (h > 100) {
    ctx.fillText("CB", x+w/2, y+h/2-36);
    ctx.fillText("TA", x+w/2, y+h/2);
    ctx.fillText("95", x+w/2, y+h/2+36);
  }
  ctx.restore();
}

function drawTaurito() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  const boosting = boostTimer > 0;
  let idx;
  if (boosting) {
    idx = Math.floor(frame / 5) % 3; // alas arriba/centro/extendidas mientras sube
  } else {
    idx = 3; // alas abajo / cohete apagado mientras cae
  }

  const im = tauritoFrames[idx];
  const drawW = 122;
  const drawH = 90;

  // Cuando cae, no hay flama; cuando sube se agrega flama sincronizada con la tecla.
  if (boosting) {
    const flame = 20 + Math.sin(frame * 1.1) * 6;
    ctx.fillStyle = "#ff4c00";
    ctx.beginPath();
    ctx.moveTo(-56, 23);
    ctx.lineTo(-86, 24 - flame * 0.42);
    ctx.lineTo(-75, 24);
    ctx.lineTo(-86, 24 + flame * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffd447";
    ctx.beginPath();
    ctx.moveTo(-58, 23);
    ctx.lineTo(-79, 24 - flame * 0.23);
    ctx.lineTo(-70, 23);
    ctx.lineTo(-79, 24 + flame * 0.23);
    ctx.closePath();
    ctx.fill();
  }

  if (im && im.complete && im.naturalWidth > 0) {
    ctx.drawImage(im, -drawW/2, -drawH/2, drawW, drawH);
  } else {
    ctx.fillStyle = "#8a5732";
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawMedals() {
  for (const m of medals) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(frame/25);
    ctx.fillStyle = "#ffcf3a";
    ctx.strokeStyle = "#8a5f00";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0,0,m.r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff4a6";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("+2",0,7);
    ctx.restore();
  }
}

function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 36);
    ctx.fillStyle = p.type === "spark" ? "#ffd44a" : "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === "spark" ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawUI() {
  ctx.fillStyle = "rgba(0,0,0,.35)";
  roundRect(28, 24, 260, 112, 12, true);

  ctx.fillStyle = "white";
  ctx.font = "bold 34px Arial";
  ctx.fillText("Puntos: " + score, 48, 62);
  ctx.font = "20px Arial";
  ctx.fillText("Récord: " + best, 50, 90);
  ctx.fillText("Nivel: " + difficultyName, 50, 118);

  ctx.fillStyle = soundOn ? "#8ff2a7" : "#ff8f8f";
  ctx.font = "bold 20px Arial";
  ctx.fillText(soundOn ? "SONIDO ON" : "SONIDO OFF", 1070, 52);

  if (alertTimer > 0 && alertText) {
    ctx.save();
    const t = alertTimer / 155;
    ctx.globalAlpha = Math.min(1, t * 1.6);
    ctx.fillStyle = "rgba(30,20,20,.86)";
    roundRect(W/2-330, 26, 660, 62, 18, true);
    ctx.strokeStyle = alertColor;
    ctx.lineWidth = 4;
    roundRect(W/2-330, 26, 660, 62, 18, false, true);
    ctx.fillStyle = alertColor;
    ctx.textAlign = "center";
    ctx.font = "bold 34px Arial";
    ctx.fillText(alertText, W/2, 68);
    ctx.restore();
  }

  if (bonusTimer > 0 && bonusText) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, bonusTimer / 18);
    ctx.fillStyle = "#fff1a8";
    ctx.strokeStyle = "rgba(0,0,0,.55)";
    ctx.lineWidth = 5;
    ctx.textAlign = "center";
    ctx.font = "bold 42px Arial";
    ctx.strokeText(bonusText, W/2, 180);
    ctx.fillText(bonusText, W/2, 180);
    ctx.restore();
  }

  if (flashTimer > 0 && flashText) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, flashTimer / 20);
    ctx.fillStyle = "rgba(20,45,30,.82)";
    roundRect(W/2-300, 86, 600, 62, 18, true);
    ctx.fillStyle = "#ffdf7d";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Arial";
    ctx.fillText(flashText, W/2, 128);
    ctx.restore();
  }

  if (state === "menu") {
    drawCenterPanel("TAURITO VOLADOR", "Presiona ESPACIO, CLICK o TOCA la pantalla", "CBTA 95 · Fuerza que siembra orgullo");
  }

  if (state === "gameover") {
    drawCenterPanel("¡GAME OVER!", "Puntuación: " + score + " · Récord: " + best, "Presiona R, ESPACIO o TOCA la pantalla para intentarlo de nuevo");
  }

  if (paused) {
    drawCenterPanel("PAUSA", "Presiona P para continuar", "");
  }
}

function drawCenterPanel(title, subtitle, footer) {
  ctx.save();
  ctx.fillStyle = "rgba(20,45,30,.90)";
  roundRect(W / 2 - 360, H / 2 - 145, 720, 290, 22, true);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  roundRect(W / 2 - 360, H / 2 - 145, 720, 290, 22, false, true);

  ctx.fillStyle = "#ffdf4d";
  ctx.textAlign = "center";
  ctx.font = "bold 58px Arial";
  ctx.strokeStyle = "#082414";
  ctx.lineWidth = 7;
  ctx.strokeText(title, W / 2, H / 2 - 50);
  ctx.fillText(title, W / 2, H / 2 - 50);

  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(subtitle, W / 2, H / 2 + 22);

  ctx.font = "23px Arial";
  ctx.fillStyle = "#ffdf7d";
  ctx.fillText(footer, W / 2, H / 2 + 82);
  ctx.restore();
}

function roundRect(x, y, w, h, r, fill, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function loop() {
  update();
  drawBackground();
  obstacles.forEach(drawObstacle);
  drawMedals();
  drawParticles();
  drawTaurito();
  drawUI();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
  if (e.key.toLowerCase() === "r") resetGame();
  if (e.key.toLowerCase() === "p" && state === "playing") paused = !paused;
  if (e.key.toLowerCase() === "m") soundOn = !soundOn;
});



console.log("Taurito Volador: versión nuevos sprites CBTA 95 cargada. Revisa que tus PNG estén en assets/obstacles/.");

// =========================
// CONTROLES PC + CELULAR
// =========================
function handlePrimaryInput(e) {
  if (e) e.preventDefault();
  flap();
}

// Pointer events funcionan en mouse, celular, tablet y stylus.
canvas.addEventListener("pointerdown", handlePrimaryInput, { passive: false });

// Respaldo para navegadores viejos.
canvas.addEventListener("touchstart", handlePrimaryInput, { passive: false });

// Evita toque largo / menú contextual.
canvas.addEventListener("contextmenu", (e) => e.preventDefault());


loop();
