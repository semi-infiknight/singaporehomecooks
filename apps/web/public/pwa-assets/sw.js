const CACHE_NAME = "shc-web-v3";
const APP_SHELL = ["/", "/manifest.json", "/icon.png", "/apple-touch-icon.png"];

function resolvePushUrl(data) {
  if (!data || typeof data !== "object") return "/";
  if (typeof data.url === "string" && data.url.startsWith("/")) return data.url;
  const orderId = data.orderId ? String(data.orderId) : "";
  if (!orderId) return "/";
  if (data.type === "chat") return `/chat/${orderId}`;
  return `/orders/${orderId}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() || { title: "Singapore Home Cooks", body: "You have a new update." };
  const routeData = payload.data && typeof payload.data === "object" ? payload.data : {};
  const url = resolvePushUrl(routeData);
  event.waitUntil(
    self.registration.showNotification(payload.title || "Singapore Home Cooks", {
      body: payload.body || "You have a new update.",
      icon: "/icon.png",
      badge: "/icon.png",
      data: { ...routeData, url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = resolvePushUrl(event.notification.data || {});
  event.waitUntil(clients.openWindow(target));
});
