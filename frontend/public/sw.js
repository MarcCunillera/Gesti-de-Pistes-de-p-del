// ── Pàdel Service Worker ─────────────────────────────────────────────────────
// Versió: canviar el número força una actualització de la caché
const CACHE_VERSION = "padel-v1";
const STATIC_CACHE  = CACHE_VERSION + "-static";

// Recursos estàtics a pre-caché en el moment de la instal·lació
const PRECACHE_URLS = ["/", "/index.html", "/Escut_de_Torrelameu.svg"];

// ── Instal·lació ─────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // activa immediatament sense esperar
  );
});

// ── Activació (neteja caché antiga) ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("padel-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // pren el control de les tabs obertes
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticions no-GET i extensions de browser
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API requests must always hit the network. Reservation state cannot be stale.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // ── Recursos estàtics (JS, CSS, imatges): Cache-first ────────────────────
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|ttf)$/) ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Navegació (HTML): Stale-while-revalidate → sempre serveix /index.html ──
  if (request.mode === "navigate") {
    event.respondWith(navigateFetch(request));
    return;
  }
});

// ─── Estratègies ─────────────────────────────────────────────────────────────

/** Cache-first: retorna de caché si existeix, sinó baixa i guarda */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/** Per navegació: network-first però sempre retorna index.html si falla */
async function navigateFetch(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match("/index.html");
    if (cached) return cached;
    return new Response("<h1>Sense connexió</h1>", {
      headers: { "Content-Type": "text/html" },
    });
  }
}
