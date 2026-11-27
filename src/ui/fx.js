const KINDS = {
  blood: {drop: 8},
  sparkle: {spark: 7},
  number: {text: 1},
  shimmer: {sheen: 1},
  seal: {ring: 1},
  puff: {smoke: 1},
  moon: {night: 1},
  mana: {flare: 1, wave: 2, streak: 8, ember: 10},
  charge: {swell: 1, mote: 14, flare: 1},
  holy: {ray: 8, ring: 1},
  heartbeat: {ring: 1, candle: 1},
  stable: {glow: 1, candle: 1, flame: 1, speck: 10, word: 1},
  skull: {vignette: 1, skull: 1},
  doom: {shade: 1, fume: 5, skull: 1, word: 1},
  weary: {dim: 1, drip: 5},
  dice: {die: 2},
  lids: {lid: 2},
  hearts: {heart: 6},
  hush: {halo: 3},
  focus: {halo: 2},
  vanish: {wisp: 10},
  dread: {vignette: 1},
  clamp: {shackle: 2},
  jolt: {bolt: 6},
  crumble: {shard: 9},
  bubbles: {bubble: 8},
  thud: {dust: 6},
  bind: {cinch: 2},
  daze: {star: 8},
  sleep: {dim: 1, zee: 3},
  shatter: {glint: 7},
  fall: {flash: 1, vignette: 1, glint: 20}
};
const GLYPHS = {
  heart: ["♥"],
  die: ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"],
  star: ["✦", "✧", "★"],
  zee: ["z", "Z"]
};
const WORDS = {stable: "Stable", doom: "Dead"};
const RAGGED_WORDS = ["doom"];
const SPREAD_PX = 46;
const STAGGER_MS = 40;
// PITFALL: the BANNER_ numbers mirror the band curve drawn in --shape-banner and --shape-banner-torn.
const BANNER_VIEW = 260;
const BANNER_HALF = 90;
const BANNER_ARCH = 7;
const RAGGED_DRIFT_PX = 1.4;
const RAGGED_TILT_DEG = 3;

let layer = null;

function fxLayer(){
  if(!layer){
    layer = document.createElement("div");
    layer.className = "fx-layer";
    document.body.appendChild(layer);
  }
  return layer;
}

const spread = () => Math.round((Math.random() * 2 - 1) * SPREAD_PX) + "px";
const pick = list => list[Math.floor(Math.random() * list.length)];
const prefersStill = () => Boolean(window.matchMedia) && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function bit(part, index, count, text){
  const piece = document.createElement("span");
  piece.className = "fx-bit";
  piece.dataset.part = part;
  piece.style.setProperty("--i", String(index));
  piece.style.setProperty("--n", String(count));
  piece.style.setProperty("--dx", spread());
  piece.style.setProperty("--dy", spread());
  piece.style.setProperty("--delay", index * STAGGER_MS + "ms");
  piece.style.setProperty("--rand", Math.random().toFixed(3));
  if(text) piece.textContent = text;
  return piece;
}

function letterOnBanner(word, isRagged){
  const letters = [...word.textContent].map(letter => {
    const span = document.createElement("span");
    span.className = "fx-letter";
    span.textContent = letter;
    return span;
  });
  word.textContent = "";
  letters.forEach(span => word.appendChild(span));
  const scale = word.offsetWidth / BANNER_VIEW;
  letters.forEach(span => {
    const along = (span.offsetLeft + span.offsetWidth / 2 - word.offsetWidth / 2) / (BANNER_HALF * scale);
    const jitter = isRagged ? Math.random() * 2 - 1 : 0;
    span.style.setProperty("--dy", (BANNER_ARCH * scale * along * along + jitter * RAGGED_DRIFT_PX).toFixed(2) + "px");
    span.style.setProperty("--rot", (Math.atan(2 * BANNER_ARCH * along / BANNER_HALF) * 180 / Math.PI + jitter * RAGGED_TILT_DEG).toFixed(2) + "deg");
  });
}

export function spawnFx(kind, rect, options = {}){
  if(prefersStill()) return;
  const burst = document.createElement("div");
  burst.className = "fx";
  burst.dataset.kind = kind;
  if(options.tone) burst.dataset.tone = options.tone;
  burst.style.setProperty("--x", rect.left + rect.width / 2 + "px");
  burst.style.setProperty("--y", rect.top + rect.height / 2 + "px");
  burst.style.setProperty("--w", rect.width + "px");
  burst.style.setProperty("--h", rect.height + "px");
  let total = 0;
  const words = [];
  Object.entries(KINDS[kind]).forEach(([part, count]) => {
    for(let i = 0; i < count; i++){
      const text = part === "word" ? WORDS[kind] : GLYPHS[part] ? pick(GLYPHS[part]) : options.text;
      const piece = bit(part, i, count, text);
      if(part === "word") words.push(piece);
      burst.appendChild(piece);
      total++;
    }
  });
  let ended = 0;
  burst.addEventListener("animationend", () => { if(++ended === total) burst.remove(); });
  fxLayer().appendChild(burst);
  words.forEach(word => letterOnBanner(word, RAGGED_WORDS.includes(kind)));
}

export function buzz(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern);
}
