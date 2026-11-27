const $=id=>document.getElementById(id);let D,cur=null,playing=null,queue=[],watch=null,wake=null,lastSw=0;
const played=new Set(JSON.parse(localStorage.getItem('ra_played')||'[]'));
const km=(a,b,c,d)=>{const r=Math.PI/180,x=(d-b)*r*Math.cos((a+c)*r/2),y=(c-a)*r;return 6371000*Math.sqrt(x*x+y*y)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function mark(id){played.add(id);localStorage.setItem('ra_played',JSON.stringify([...played]))}
const srcs=s=>s.sources.map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(', ');
function town(k){return D.towns.find(t=>t.key===k)}
function buildQueue(t){queue=t.stories.filter(s=>!played.has(s.id)&&(!playing||playing.id!==s.id));renderQueue(t)}
function renderQueue(t){$('queueSec').hidden=!t;if(!t)return;$('qTown').textContent=t.name;
 $('queue').innerHTML=queue.length?queue.map(s=>`<li>${esc(s.title)} <button class="pl" data-id="${s.id}">Play</button><div class="small src">Sources: ${srcs(s)}</div></li>`).join(''):'<li>You have heard every story here. Pick another town or reset below.</li>'}
function play(s,t){playing=s;const p=$('player');p.src='audio/'+s.id+'.m4a';p.play().catch(()=>{});
 $('now').hidden=false;$('nowTown').textContent=t.name;$('nowTitle').textContent=s.title;$('nowBlurb').textContent=s.blurb;
 $('nowCredit').innerHTML=(s.flag?esc(s.flag)+' ':'')+'Sources: '+s.sources.map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(', ')+(s.music?`. Music: <a href="${esc(s.music[1])}" target="_blank" rel="noopener">${esc(s.music[0])}</a>`:'');
 if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:s.title,artist:t.name+', NJ',album:'Ridealong'})}
 mark(s.id);if(cur&&cur.key===t.key)buildQueue(t)}
function next(){if(!cur)return;buildQueue(cur);if(queue.length)play(queue[0],cur)}
function setTown(t,auto){if(cur&&cur.key===t.key)return;cur=t;$('pick').value=t.key;
 $('status').textContent=(auto?'You are in ':'Town: ')+t.name+'.';$('saveCur').hidden=false;$('saveCur').textContent='Save '+t.name+' offline';$('saveCur').dataset.k=t.key;buildQueue(t);
 if($('player').paused||$('player').ended||!playing){if(queue.length)play(queue[0],t)}}
function onPos(pos){const {latitude:la,longitude:lo,accuracy:ac}=pos.coords;
 const ds=D.towns.map(t=>[t,km(la,lo,t.lat,t.lon)]).sort((a,b)=>a[1]-b[1]);const [t,d]=ds[0];
 ds.slice(0,3).forEach(x=>{if(x[1]<15000&&navigator.onLine&&!x[0]._pf){x[0]._pf=1;saveIds(x[0].stories.map(s=>s.id),x[0].name)}});if(d<=Math.max(t.r,ac)){setTown(t,true)}else{$('status').textContent=`Between towns. Nearest: ${t.name}, ${(d/1609).toFixed(1)} miles. (accuracy ${Math.round(ac)} m)`}}
async function keepAwake(){try{if('wakeLock' in navigator)wake=await navigator.wakeLock.request('screen')}catch(e){}}
$('start').onclick=()=>{if(!navigator.geolocation){$('status').textContent='This browser has no location. Pick a town instead.';return}
 $('status').textContent='Asking for location...';keepAwake();$('player').play().catch(()=>{});$('player').pause();
 if(watch!==null)navigator.geolocation.clearWatch(watch);
 watch=navigator.geolocation.watchPosition(onPos,e=>{$('status').textContent='Location blocked ('+e.message+'). Pick a town below, or allow location for this site in Settings.'},{enableHighAccuracy:true,maximumAge:5000});$('start').textContent='Drive mode on'};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&watch!==null)keepAwake()});
$('pick').onchange=e=>{const t=town(e.target.value);if(t){cur=null;setTown(t,false)}};
$('skip').onclick=next;$('player').addEventListener('ended',next);
if('mediaSession' in navigator){navigator.mediaSession.setActionHandler('nexttrack',next)}
document.addEventListener('click',e=>{const b=e.target.closest('button.pl');if(!b)return;const id=b.dataset.id;
 for(const t of D.towns){const s=t.stories.find(x=>x.id===id);if(s){if(!cur||cur.key!==t.key){cur=t;$('pick').value=t.key}play(s,t);break}}});
fetch('data.json',{cache:'no-store'}).then(r=>r.json()).then(d=>{D=d;
 $('pick').innerHTML+=[...D.towns].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<option value="${t.key}">${esc(t.name)}</option>`).join('');
 $('towns').innerHTML=[...D.towns].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<details><summary>${esc(t.name)} (${t.stories.length})</summary><button class="pl sv" data-k="${t.key}">Save this town offline</button><ul>${t.stories.map(s=>`<li>${esc(s.title)} <button class="pl" data-id="${s.id}">Play</button><div class="small src">Sources: ${srcs(s)}</div></li>`).join('')}</ul></details>`).join('')});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update());let rl=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(rl&&!window.__rl){window.__rl=1;location.reload()}rl=true})}

async function saveIds(ids,label){const c=await caches.open('ra-audio');let n=0;$('dlstat').textContent=label+': 0/'+ids.length;
 for(const id of ids){const u='audio/'+id+'.m4a';try{if(!(await c.match(u))){const r=await fetch(u);if(r.ok)await c.put(u,r)}}catch(e){}n++;$('dlstat').textContent=label+': '+n+'/'+ids.length}
 $('dlstat').textContent=label+': saved '+n+' stories';try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
$('dlall').onclick=()=>D&&saveIds(D.towns.flatMap(t=>t.stories.map(s=>s.id)),'All stories');
document.addEventListener('click',e=>{const b=e.target.closest('button.sv,#saveCur');if(!b||!D)return;const t=town(b.dataset.k);if(t)saveIds(t.stories.map(s=>s.id),t.name)});
