/* Service worker do SZM Concurseiro — deixa o app abrir sem internet */
const CACHE = "szm-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./logo-mark.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(
        chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // requisições para outros domínios (API da IA) vão direto para a rede
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    caches.match(req).then((emCache) => {
      if (emCache) return emCache;
      return fetch(req)
        .then((resposta) => {
          if (resposta && resposta.status === 200) {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copia));
          }
          return resposta;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
