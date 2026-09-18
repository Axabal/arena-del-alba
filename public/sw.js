const CACHE='alba-v2-20260918-r6';
const SHELL=['/','/index.html','/style.css','/upgrade.css','/fonts.css','/app.js','/connection.js','/runtime-config.js','/renderer.js','/hero-rig.js','/vfx.js','/terrain-art.js','/assets.js','/image-resource.js','/presentation.js','/controls.js','/audio.js','/shared/config.js','/shared/maps.js','/shared/engine.js','/shared/zones.js','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/assets/heroes-rig-v2.png','/assets/terrain-atlas-v2.png','/assets/arena-splash-v2.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
// A new worker waits until all existing game tabs close; never interrupt a match.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/ws'||url.pathname==='/health')return;if(!SHELL.includes(url.pathname))return;event.respondWith(caches.match(url.pathname).then(hit=>hit||fetch(event.request)));});
