/* 我的学习星球 Service Worker —— 每次发版必须 bump CACHE 版本号
 *
 * ⚠️⚠️ 2026-09-15：原来是 stale-while-revalidate（`return fallback || fresh`）——
 *   先把缓存端上去、后台再悄悄更新，于是**打开的当次永远是上一版，刷第二次才新**。
 *   自己开发时天天刷所以没感觉；孩子隔几天打开、或把链接发给别人，看到的就是旧内容
 *   （这也是为什么每次上线都得叮嘱「用无痕模式打开」）。
 *   改成「网络优先，但不干等」。另外预缓存改逐个 add 兜底、离线回退加 ignoreSearch。
 */
const CACHE = "learning-planet-v19";
const CORE = ["./", "./index.html", "./app.js", "./manifest.json", "./assets/baibai-base.png"];
const TIMEOUT = 1500;

self.addEventListener("install", e => e.waitUntil(
  caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
));

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(netFirstButDontHang(e.request));
});
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

/* 网络优先，但不干等：先走网络保证新鲜；超过 TIMEOUT 还没回来，就先拿缓存顶上（秒开），
   网络回来照样写缓存。离线时回退缓存，并且 ignoreSearch —— 否则换了 ?v= 版本号就全部落空。 */
function netFirstButDontHang(req) {
  return new Promise(resolve => {
    let settled = false;
    const give = res => { if (!settled && res) { settled = true; resolve(res); } };

    const timer = setTimeout(() => {
      if (settled) return;
      caches.match(req, { ignoreSearch: true }).then(give);   // 没缓存就继续等网络
    }, TIMEOUT);

    fetch(req).then(res => {
      clearTimeout(timer);
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      give(res);
    }).catch(async () => {
      clearTimeout(timer);
      const hit = await caches.match(req, { ignoreSearch: true })
        || (req.mode === "navigate" ? await caches.match("./index.html") : null);
      give(hit || new Response("", { status: 504, statusText: "offline" }));
    });
  });
}
