// DO service worker. Network-only on purpose: every task lives in Supabase, so
// caching pages would risk showing stale data. It exists so browsers treat DO as
// an installable app.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
