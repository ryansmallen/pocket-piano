const CACHE='pocket-piano-v2';
const FILES=['./','./index.html','./manifest.webmanifest'];
async function refresh(){
 const responses=await Promise.all(FILES.map(async path=>{
  const response=await fetch(new Request(new URL(path,self.registration.scope),{cache:'no-store'}));
  if(!response.ok)throw Error('Update download failed');
  return response;
 }));
 const cache=await caches.open(CACHE);
 await Promise.all(FILES.map((path,i)=>cache.put(path,responses[i])));
}
self.addEventListener('install',e=>e.waitUntil(refresh().then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('pocket-piano-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',e=>{
 if(e.data?.type==='CHECK_FOR_UPDATES')e.waitUntil(refresh().then(()=>e.ports[0]?.postMessage({ok:true}),()=>e.ports[0]?.postMessage({ok:false})));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  try{
   const response=await fetch(e.request,{cache:'no-store'});
   if(!response.ok)throw Error('Download failed');
   if(FILES.some(path=>new URL(path,self.registration.scope).href===e.request.url)){
    const cache=await caches.open(CACHE);await cache.put(e.request,response.clone());
   }
   return response;
  }catch(error){const cached=await caches.match(e.request,{cacheName:CACHE});if(cached)return cached;throw error}
 })());
});
