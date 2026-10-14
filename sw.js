const CACHE_PREFIX='maratkyzy-autumn2026-';
const CACHE=CACHE_PREFIX+'v1';
const FILES=['./','./index.html','./styles.css','./app.js','./data.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./raspisanie.ics'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 if(u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(hit=>hit||fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
  return response;
 }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
