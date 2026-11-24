const CACHE = "stem-assiut-clubs-v46";
const SHELL = ["./", "index.html", "style.css", "app.js", "config.js", "manifest.webmanifest",
  "icons/chemistry_logo.png", "icons/physics_logo.png", "icons/math_logo.png", "icons/mechanics_logo.png", "icons/deutsch_logo.png", "icons/capstone_logo.png", "icons/english_logo.png", "icons/app-icon-192.png", "icons/club_logo.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Instant start: files come from the cache at once and are refreshed in the background (stale-while-revalidate).
// version.json and sw.js always go to the network, so the app's own self-update still notices a new release.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const fresh = /\/(version\.json|sw\.js)$/.test(url.pathname);
  if (fresh) {
    e.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req, { cache: "no-cache" }).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  }));
});
