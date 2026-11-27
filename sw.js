const V='ra-v4',A='ra-audio',SHELL=['./','index.html','app.js','style.css','data.json','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==A).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(e.request.headers.has('range')){e.respondWith(rangeFrom(e.request));return}
 if(!u.pathname.endsWith('.m4a')){e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(ca=>ca.put(e.request,c))}return res}).catch(()=>caches.match(e.request)));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&res.status===200){const c=res.clone();caches.open(A).then(ca=>ca.put(e.request,c))}return res})))});
async function rangeFrom(req){const url=req.url.split('#')[0];let r=await caches.match(url);if(!r){const full=await fetch(url);if(full.ok){caches.open(A).then(c=>c.put(url,full.clone()))}r=full}
 const buf=await r.arrayBuffer();const m=/bytes=(\d+)-(\d*)/.exec(req.headers.get('range'));const s=+m[1],e=m[2]?+m[2]:buf.byteLength-1;
 return new Response(buf.slice(s,e+1),{status:206,headers:{'Content-Type':'audio/mp4','Content-Range':`bytes ${s}-${e}/${buf.byteLength}`,'Content-Length':e-s+1}})}
