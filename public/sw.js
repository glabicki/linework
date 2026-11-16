// Keeps Linework opening underground: the app shell and its files come from cache when there's no signal.
const CACHE = "linework-v2";
// One bar of signal can leave a request hanging. Past this, the saved copy opens instead.
const PATIENCE = 3000;

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/"]))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const keep = (req, res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  // Build files never change under the same name: cache first.
  if (new URL(req.url).pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => keep(req, res))));
    return;
  }

  // Pages and everything else: the network if it answers in time, otherwise the saved copy.
  const saved = () => caches.match(req).then(hit => hit || (req.mode === "navigate" ? caches.match("/") : undefined));
  e.respondWith(new Promise(resolve => {
    let settled = false;
    const finish = res => { if (!settled && res) { settled = true; resolve(res); } };
    const net = fetch(req).then(res => keep(req, res));
    // Slow network: use the saved copy if there is one, and keep waiting if there isn't.
    const timer = setTimeout(() => saved().then(finish), PATIENCE);
    net.then(res => { clearTimeout(timer); finish(res); })
      .catch(() => { clearTimeout(timer); saved().then(hit => finish(hit || Response.error())); });
  }));
});
