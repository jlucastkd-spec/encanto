// Service worker do painel: recebe as notificações de novos pedidos.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: "Novo pedido", body: event.data?.text() }; }
  event.waitUntil((async () => {
    await self.registration.showNotification(d.title || "Novo pedido", {
      body: d.body || "",
      tag: d.tag,
      renotify: !!d.tag,
      icon: "/painel/icone-192.png",
      badge: "/painel/badge.png",
      vibrate: [200, 100, 200, 100, 300],
      requireInteraction: true,
      data: { url: d.url || "/painel/" },
    });
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    wins.forEach(w => w.postMessage({ tipo: "novo-pedido" }));
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/painel/";
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).pathname.startsWith("/painel")) { await w.focus(); w.postMessage({ tipo: "abrir", url }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
