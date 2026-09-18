import test from 'node:test';
import assert from 'node:assert/strict';
import { createArenaServer } from '../server/index.js';
import WebSocket from 'ws';

function waitMessage(ws,predicate,timeout=10000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',listener);reject(new Error('Timed out waiting for server message'));},timeout);function listener(raw){const value=JSON.parse(raw);if(predicate(value)){clearTimeout(timer);ws.off('message',listener);resolve(value);}}ws.on('message',listener);});}
async function client(url){const ws=new WebSocket(url);const greeting=await waitMessage(ws,m=>m.type==='hello');return {ws,greeting,send:o=>ws.send(JSON.stringify(o))};}
test('six real websocket clients share a match and reconnect to the same hero',async t=>{
  const app=await createArenaServer({port:0});const port=app.server.address().port;const cs=[];
  t.after(async()=>{for(const c of cs)c.ws.terminate();await app.close();});
  for(let i=0;i<6;i++)cs.push(await client(`ws://127.0.0.1:${port}/ws`));
  let pending=waitMessage(cs[0].ws,m=>m.type==='room');cs[0].send({type:'create',name:'Ana',mode:'deathmatch'});const {room}=await pending;
  for(let i=1;i<6;i++){pending=waitMessage(cs[i].ws,m=>m.type==='room');cs[i].send({type:'join',code:room.code,name:`Amigo ${i}`});await pending;}
  pending=waitMessage(cs[0].ws,m=>m.type==='room'&&m.room.members.every(p=>p.ready));for(const c of cs)c.send({type:'ready',ready:true});await pending;
  const loading=cs.map(c=>waitMessage(c.ws,m=>m.type==='room'&&m.room.phase==='loading'));cs[0].send({type:'start'});await Promise.all(loading);
  const snapshots=cs.map(c=>waitMessage(c.ws,m=>m.type==='state'));for(const c of cs)c.send({type:'loaded'});
  const states=await Promise.all(snapshots);assert.equal(new Set(states.map(s=>s.game.map.id)).size,1);assert.ok(states.every(s=>s.game.players.some(p=>p.id===cs[0].greeting.id)));
  assert.equal(states[0].game.players.length,6);
  const id=cs[0].greeting.id,token=cs[0].greeting.token;cs[0].ws.close();await new Promise(r=>setTimeout(r,100));
  const resumed=await client(`ws://127.0.0.1:${port}/ws?token=${token}`);cs.push(resumed);assert.equal(resumed.greeting.id,id);
  const state=await waitMessage(resumed.ws,m=>m.type==='state');assert.equal(state.game.players.find(p=>p.id===id).bot,false);
  const live=app.manager.rooms.get(room.code);live.startAt=Date.now()-100;live.game.remaining=.05;live.game.scores=[2,1];
  const finishes=cs.slice(1,6).concat(resumed).map(c=>waitMessage(c.ws,m=>m.type==='state'&&m.game.phase==='finished'));
  const completed=await Promise.all(finishes);assert.ok(completed.every(m=>m.game.winner===0&&m.game.players.length===6));
});
test('HTTP does not expose server files and rejects malformed websocket input safely',async t=>{
  const app=await createArenaServer({port:0});t.after(()=>app.close());const base=`http://127.0.0.1:${app.server.address().port}`;
  assert.equal((await fetch(`${base}/server/index.js`)).status,404);
  assert.equal((await fetch(`${base}/health`)).status,200);
  const c=await client(base.replace('http:','ws:')+'/ws');t.after(()=>c.ws.terminate());
  const result=waitMessage(c.ws,m=>m.type==='error');c.ws.send('{broken');assert.match((await result).message,/mensaje/i);
});
test('removed disconnected member resumes after rematch without crashing server',async t=>{
  const app=await createArenaServer({port:0}),url=`ws://127.0.0.1:${app.server.address().port}/ws`,cs=[];t.after(async()=>{for(const c of cs)c.ws.terminate();await app.close();});
  const a=await client(url),b=await client(url);cs.push(a,b);let pending=waitMessage(a.ws,m=>m.type==='room');a.send({type:'create',name:'Ana',mode:'flags'});const {room}=await pending;
  pending=waitMessage(b.ws,m=>m.type==='room');b.send({type:'join',code:room.code,name:'Bea'});await pending;b.ws.close();await new Promise(r=>setTimeout(r,50));
  const r=app.manager.rooms.get(room.code);r.phase='finished';const session=[...app.manager.sessions.values()].find(s=>s.id===a.greeting.id);app.manager.back(session);
  app.manager.ready(session,true);app.manager.start(session);r.members.forEach(p=>p.loaded=true);await new Promise(resolve=>setTimeout(resolve,50));
  const returned=await client(url+'?token='+b.greeting.token);cs.push(returned);assert.equal(returned.greeting.roomCode,null);
  assert.equal((await fetch(`http://127.0.0.1:${app.server.address().port}/health`)).status,200);
});
