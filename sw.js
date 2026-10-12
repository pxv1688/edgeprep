/* Edge service worker: makes the site installable and usable offline.
   Network first, so a deploy shows up on the next load; the cache is only the offline fallback. */
var CACHE = "edge-v3";
var CORE = [
  "./", "index.html", "app.html", "about.html", "leaderboard.html", "login.html", "privacy.html", "terms.html", "404.html",
  "assets/edge.css", "assets/data.js", "assets/generators.js", "assets/app.js", "assets/config.js", "assets/auth.js", "assets/site.js", "assets/landing.js", "assets/embed.js", "learn.html",
  "favicon.svg", "manifest.webmanifest", "assets/img/icon-192.png", "assets/img/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !font) return; /* Supabase and other APIs always go to the network */
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, {ignoreSearch: true}).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("app.html");
        return new Response("", {status: 504, statusText: "Offline"});
      });
    })
  );
});
