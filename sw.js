const CACHE = "mimic-v1";
const NETWORK_WAIT_MS = 3000;

const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./art/candle.webp",
  "./art/d10-ghost.webp",
  "./art/d10-iron.webp",
  "./art/d12-ghost.webp",
  "./art/d12-iron.webp",
  "./art/d6-ghost.webp",
  "./art/d6-iron.webp",
  "./art/d8-ghost.webp",
  "./art/d8-iron.webp",
  "./art/skull.webp",
  "./src/data/abilities.js",
  "./src/data/conditions.js",
  "./src/data/constants.js",
  "./src/data/sampleCharacter.js",
  "./src/data/spellSources.js",
  "./src/data/spells.js",
  "./src/main.js",
  "./src/rules/format.js",
  "./src/rules/lists.js",
  "./src/rules/markdown.js",
  "./src/rules/play.js",
  "./src/rules/sheet.js",
  "./src/rules/spells.js",
  "./src/store/character.js",
  "./src/store/notes.js",
  "./src/store/play.js",
  "./src/store/spellLibrary.js",
  "./src/store/state.js",
  "./src/store/storage.js",
  "./src/styles/app.css",
  "./src/styles/conditions.css",
  "./src/ui/button.css",
  "./src/ui/button.js",
  "./src/ui/dots.css",
  "./src/ui/dots.js",
  "./src/ui/field.css",
  "./src/ui/field.js",
  "./src/ui/frame.css",
  "./src/ui/frame.js",
  "./src/ui/fx.css",
  "./src/ui/fx.js",
  "./src/ui/index.css",
  "./src/ui/tokens/animations.css",
  "./src/ui/tokens/colors.css",
  "./src/ui/tokens/fonts.css",
  "./src/ui/tokens/space.css",
  "./src/ui/tokens/textures.css",
  "./src/ui/tokens/typography.css",
  "./src/views/abilities.js",
  "./src/views/app.js",
  "./src/views/attacks.js",
  "./src/views/combat.js",
  "./src/views/conditionTray.js",
  "./src/views/hpTray.js",
  "./src/views/scroll.js",
  "./src/views/controls.js",
  "./src/views/dom.js",
  "./src/views/drawers/drawer.js",
  "./src/views/drawers/restDrawer.js",
  "./src/views/drawers/spellDrawer.js",
  "./src/views/drawers/spellSearchDrawer.js",
  "./src/views/equipment.js",
  "./src/views/features.js",
  "./src/views/hpBar.js",
  "./src/views/hud.js",
  "./src/views/identity.js",
  "./src/views/notice.js",
  "./src/views/notes.js",
  "./src/views/personality.js",
  "./src/views/proficiencies.js",
  "./src/views/spellDetail.js",
  "./src/views/spells.js",
  "./fonts/bookinsanity-bold.otf",
  "./fonts/bookinsanity-italic.otf",
  "./fonts/bookinsanity.otf",
  "./fonts/mr-eaves-small-caps.otf",
  "./fonts/scaly-sans-bold.otf",
  "./fonts/scaly-sans-caps.otf",
  "./fonts/scaly-sans.otf",
  "./icons/apple-touch-180.png",
  "./icons/favicon-64.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(new Request(url, {cache: "reload"})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  const opened = caches.open(CACHE);
  const fresh = opened.then(cache => fetch(req, {cache: "no-cache"}).then(res => {
    if(res.ok) cache.put(req, res.clone());
    return res;
  }));
  const fallback = () => opened.then(cache => cache.match(req)
    .then(hit => hit || (req.mode === "navigate" ? cache.match("./index.html") : Response.error())));
  const slow = new Promise(done => setTimeout(done, NETWORK_WAIT_MS))
    .then(() => opened).then(cache => cache.match(req)).then(hit => hit || fresh);

  e.waitUntil(fresh.catch(() => {}));
  e.respondWith(Promise.race([fresh, slow]).catch(fallback));
});
