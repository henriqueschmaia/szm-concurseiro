/* Service worker do SZM Concurseiro â€” offline + atualizaÃ§Ã£o automÃ¡tica */
const CACHE = "szm-v48";
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
      .then((cache) => Promise.all(
        SHELL.map((url) => fetch(url, { cache: "reload" })
          .then((res) => { if (res && res.ok) return cache.put(url, res); })
          .catch(() => null))
      ))
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

  // API da IA e outros domÃ­nios: sempre rede
  if (url.origin !== self.location.origin) return;

  // O documento principal: rede primeiro, para a versÃ£o nova aparecer assim que vocÃª atualizar
  const ehDocumento = req.mode === "navigate" || req.destination === "document";
  if (ehDocumento) {
    evento.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copia));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Demais arquivos: responde do cache e atualiza em segundo plano
  evento.respondWith(
    caches.match(req).then((emCache) => {
      const daRede = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return res;
        })
        .catch(() => emCache);
      return emCache || daRede;
    })
  );
});












































