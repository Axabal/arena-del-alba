import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './rooms.js';
import { createGame,stepGame,snapshotFor } from '../public/shared/engine.js';

const publicRoot=path.resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
export async function createArenaServer({port=Number(process.env.PORT)||3000,host='0.0.0.0',allowedOrigins=process.env.ALLOWED_ORIGINS||''}={}){
  const origins=new Set(String(allowedOrigins).split(',').map(s=>s.trim()).filter(Boolean).map(s=>{const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('ALLOWED_ORIGINS debe contener orígenes HTTP(S) exactos.');return u.origin;}));
  const manager=new RoomManager(),sockets=new Map();
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'");
    if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:manager.rooms.size}));}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    try{
      let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname==='/')pathname='/index.html';
      const target=path.resolve(publicRoot,'.'+pathname);
      if(!target.startsWith(publicRoot+path.sep)&&target!==path.join(publicRoot,'index.html')){res.writeHead(403);return res.end();}
      const ext=path.extname(target);if(!mime[ext]){res.writeHead(404);return res.end();}
      const content=await readFile(target);res.writeHead(200,{'Content-Type':mime[ext],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
    }catch{res.writeHead(404);res.end('No encontrado');}
  });
  const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096,perMessageDeflate:false});
  const send=(ws,value)=>{if(ws?.readyState===WebSocket.OPEN&&ws.bufferedAmount<256000)ws.send(JSON.stringify(value));};
  const broadcast=r=>{if(r)for(const p of r.members)send(sockets.get(p.id),{type:'room',room:manager.publicRoom(r)});};
  wss.on('connection',(ws,req)=>{
    const origin=req.headers.origin;
    if(origin){try{const u=new URL(origin);if(!['http:','https:'].includes(u.protocol)||(u.host!==req.headers.host&&!origins.has(u.origin))){ws.close(1008,'Origen no válido');return;}}catch{ws.close(1008);return;}}
    if(wss.clients.size>1200){ws.close(1013,'Servidor completo');return;}
    const token=new URL(req.url,'http://localhost').searchParams.get('token');
    const s=manager.connect(token),previous=sockets.get(s.id);sockets.set(s.id,ws);if(previous&&previous!==ws)previous.close(4000,'Sesión abierta en otra pestaña');
    send(ws,{type:'hello',id:s.id,token:s.token,roomCode:s.roomCode});
    if(s.roomCode){const r=manager.rooms.get(s.roomCode);if(r&&!r.hostId)r.hostId=s.id;broadcast(r);if(r?.game)send(ws,{type:'state',game:snapshotFor(r.game,manager.member(s).team),countdown:Math.max(0,(r.startAt-Date.now())/1000)});}
    let budget=0,windowStart=Date.now();ws.alive=true;ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});
    ws.on('message',raw=>{
      if(sockets.get(s.id)!==ws)return;
      const now=Date.now();if(now-windowStart>=1000){windowStart=now;budget=0;}if(++budget>100){ws.close(1008,'Demasiados mensajes');return;}
      try{
        let m;try{m=JSON.parse(raw);}catch{throw new Error('El mensaje no es válido.');}
        if(!m||typeof m!=='object'||Array.isArray(m))throw new Error('El mensaje no es válido.');
        let r;
        switch(m.type){
          case 'create':r=manager.create(s,m.name,m.mode);break;
          case 'join':r=manager.join(s,m.code,m.name);break;
          case 'choose':r=manager.choose(s,m);break;
          case 'ready':r=manager.ready(s,m.ready);break;
          case 'mode':r=manager.mode(s,m.mode);break;
          case 'start':r=manager.start(s);break;
          case 'loaded':r=manager.loaded(s);break;
          case 'back':r=manager.back(s);break;
          case 'leave':{const old=manager.rooms.get(s.roomCode);manager.leave(s);broadcast(old);send(ws,{type:'left'});return;}
          case 'input':{
            r=manager.room(s);if(r.phase!=='playing'||Date.now()<r.startAt)return;
            const v=m.input;if(!v||![v.mx,v.my,v.angle].every(Number.isFinite))return;
            r.inputs[s.id]={mx:Math.max(-1,Math.min(1,v.mx)),my:Math.max(-1,Math.min(1,v.my)),angle:v.angle%(Math.PI*2),attack:v.attack===true,ult:v.ult===true,received:now};return;
          }
          case 'ping':send(ws,{type:'pong',sent:m.sent});return;
          default:throw new Error('Tipo de mensaje desconocido.');
        }
        broadcast(r);
      }catch(error){send(ws,{type:'error',message:error.message});}
    });
    ws.on('close',()=>{if(sockets.get(s.id)!==ws)return;sockets.delete(s.id);manager.disconnect(s);broadcast(manager.rooms.get(s.roomCode));});
  });
  let frame=0;
  const interval=setInterval(()=>{
    const now=Date.now();frame++;
    for(const r of manager.rooms.values()){
      if(r.phase==='loading'&&(r.members.every(p=>p.loaded||p.bot)||now>=r.loadDeadline)){
        for(const p of r.members)if(!p.loaded){p.bot=true;const session=[...manager.sessions.values()].find(s=>s.id===p.id);if(session){session.roomCode=null;send(sockets.get(p.id),{type:'left'});send(sockets.get(p.id),{type:'error',message:'Se agotó el tiempo de carga. Un bot ocupa tu plaza.'});}p.connected=false;}
        r.game=createGame({mode:r.mode,mapId:r.mapId,players:r.members.map(p=>({...p})),seed:now%2147483647});r.phase='playing';r.startAt=now+3000;broadcast(r);
      }
      if(r.phase==='playing'){
        for(const [id,input]of Object.entries(r.inputs))if(now-input.received>250)r.inputs[id]={mx:0,my:0,angle:input.angle,attack:false,ult:false,received:now};
        if(now>=r.startAt)stepGame(r.game,1/30,r.inputs);
        if(r.game.phase==='finished'){r.phase='finished';broadcast(r);}
      }
      if(r.game&&(frame%2===0||r.phase==='finished'&&frame%30===0))for(const p of r.members)if(p.connected)send(sockets.get(p.id),{type:'state',game:snapshotFor(r.game,p.team),countdown:Math.max(0,(r.startAt-now)/1000)});
    }
  },1000/30);
  const maintenance=setInterval(()=>{manager.cleanup();for(const ws of wss.clients){if(ws.alive===false){ws.terminate();continue;}ws.alive=false;ws.ping();}},15000);
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});
  return {server,manager,async close(){clearInterval(interval);clearInterval(maintenance);for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=await createArenaServer();console.log(`Arena del Alba · http://localhost:${app.server.address().port}`);
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();process.exit(0);});
}
