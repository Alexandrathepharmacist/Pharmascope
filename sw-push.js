/* PharmaScope - alertes sur le telephone (v9.04).
   Ce petit programme ne fait QUE recevoir les alertes et ouvrir l'appli quand on les touche :
   il ne met rien en cache (l'appli reste toujours a jour). */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { texte: e.data ? e.data.text() : "" }; }
  var titre = d.titre || "PharmaScope";
  e.waitUntil(self.registration.showNotification(titre, {
    body: d.texte || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: d.tag || "pharmascope",
    renotify: true,
    data: { url: d.url || "./index.html" }
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "./index.html";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i];
      if (c.url.indexOf("/Pharmascope/") >= 0 && "focus" in c) {
        if ("navigate" in c) { return c.navigate(url).then(function (w) { return (w || c).focus(); }).catch(function () { return c.focus(); }); }
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
