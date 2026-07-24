/* PharmaScope service worker - strategie sure :
   - Pages : reseau d'abord (les mises a jour passent toujours), cache en secours hors ligne
   - Scripts CDN versionnes : cache d'abord (immuables), reseau en secours
   - Tout le reste (Supabase, ANSM...) : reseau uniquement, jamais mis en cache */
var CACHE = "pharmascope-v1";
var CDN_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net"];

self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return r;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  if (CDN_HOSTS.indexOf(url.hostname) >= 0) {
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        if (hit) return hit;
        return fetch(e.request).then(function (r) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          return r;
        });
      })
    );
  }
});
