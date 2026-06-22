const CACHE_NAME = "hyperwallet-phase-1-v1";
const APP_SHELL = [
  "/",
  "/wallets",
  "/markets",
  "/alerts",
  "/leaderboard",
  "/notifications",
  "/settings",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => caches.match("/"));
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Hyperwallet", body: "New wallet or market activity" };

  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload = {
      title: "Hyperwallet",
      body: event.data ? event.data.text() : "New activity",
    };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client && typeof client.focus === "function") {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
