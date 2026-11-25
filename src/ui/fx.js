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
  heartbeat: {ring: 1, heart: 1},
  stable: {glow: 1, heart: 1, word: 1},
  skull: {vignette: 1, skull: 1},
  doom: {darkness: 1, skull: 1, word: 1},
  weary: {dim: 1, drip: 5},
  dice: {die: 2}
};
const GLYPHS = {
  heart: ["♥"],
  skull: ["☠"],
  die: ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
};
const WORDS = {stable: "Stable", doom: "Dead"};
const SPREAD_PX = 46;
const STAGGER_MS = 40;

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
  Object.entries(KINDS[kind]).forEach(([part, count]) => {
    for(let i = 0; i < count; i++){
      const text = part === "word" ? WORDS[kind] : GLYPHS[part] ? pick(GLYPHS[part]) : options.text;
      burst.appendChild(bit(part, i, count, text));
      total++;
    }
  });
  let ended = 0;
  burst.addEventListener("animationend", () => { if(++ended === total) burst.remove(); });
  fxLayer().appendChild(burst);
}

export function buzz(pattern){
  if(navigator.vibrate) navigator.vibrate(pattern);
}
