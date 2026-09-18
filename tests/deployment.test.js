import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {createArenaServer} from '../server/index.js';

test('separate website origin is allowed explicitly, other websites are rejected',async t=>{
  const app=await createArenaServer({port:0,allowedOrigins:'https://arena-test.netlify.app'});
  t.after(()=>app.close());const url=`ws://127.0.0.1:${app.server.address().port}/ws`;
  const outcome=origin=>new Promise((resolve,reject)=>{
    const ws=new WebSocket(url,{origin});const timer=setTimeout(()=>{ws.terminate();reject(new Error('No handshake'));},1500);
    ws.once('message',raw=>{clearTimeout(timer);ws.close();resolve(JSON.parse(raw).type==='hello');});
    ws.once('close',()=>{clearTimeout(timer);resolve(false);});ws.once('error',reject);
  });
  assert.equal(await outcome('https://arena-test.netlify.app'),true);
  assert.equal(await outcome('https://arena-test.netlify.app.attacker.example'),false);
  assert.equal(await outcome('https://unrelated.example'),false);
  assert.equal(await outcome(`http://127.0.0.1:${app.server.address().port}`),true);
});

test('websocket addresses support local and hosted games without mixed content or token injection',async()=>{
  const {websocketAddress}=await import('../public/connection.js');
  assert.equal(websocketAddress('','http://localhost:3000/','a&b'),'ws://localhost:3000/ws?token=a%26b');
  assert.equal(websocketAddress('https://game.example','https://arena.netlify.app/'),'wss://game.example/ws');
  assert.throws(()=>websocketAddress('ws://game.example','https://arena.netlify.app/'),/segura/);
  assert.throws(()=>websocketAddress('https://user:password@game.example','https://arena.netlify.app/'),/servidor/);
  assert.throws(()=>websocketAddress('https://game.example/?token=abc','https://arena.netlify.app/'),/servidor/);
});
