/* Вылеты — сервис-воркер: работа без интернета */
const V = 'vylety-2.1';
const FILES = ['./', './index.html', './app.js', './xl.js', './jszip.min.js', './zayavka.js', './shablon/rabochie.xlsx', './shablon/itr.docx', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'vylety-inbox').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // файл, присланный через «Поделиться» (Android)
  if (req.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const f = fd.get('file');
        if (f && f.size) {
          const c = await caches.open('vylety-inbox');
          await c.put('inbox', new Response(f, { headers: { 'X-Name': encodeURIComponent(f.name || 'file.vyl') } }));
        }
      } catch (err) { }
      return Response.redirect('./?inbox=1', 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(req, c)); }
    return res;
  })));
});
