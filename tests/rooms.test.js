import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/rooms.js';

test('same-team hero and team-capacity decisions are atomic', () => {
  const m=new RoomManager(), a=m.connect(), b=m.connect();
  const room=m.create(a,'Ana','deathmatch'); m.join(b,room.code,'Bea');
  m.choose(a,{team:0,hero:'knight'});
  assert.throws(()=>m.choose(b,{team:0,hero:'knight'}), /elegido/);
  m.choose(b,{team:1,hero:'knight'});
  const c=m.connect(), d=m.connect(); m.join(c,room.code,'C');m.join(d,room.code,'D');
  m.choose(c,{team:0,hero:'ogre'});m.choose(d,{team:0,hero:'warlock'});
  assert.throws(()=>m.choose(b,{team:0,hero:'prince'}), /completo/);
});
test('only host starts, all humans must be ready, bots fill distinct slots',()=>{
  const m=new RoomManager(),a=m.connect(),b=m.connect(),r=m.create(a,'Ana','flags');m.join(b,r.code,'Bea');
  assert.throws(()=>m.start(b), /anfitri/);
  assert.throws(()=>m.start(a), /listos/);
  m.ready(a,true);m.ready(b,true);m.start(a);
  assert.equal(r.phase,'loading'); assert.equal(r.members.length,6);
  for(const team of [0,1]){const ps=r.members.filter(p=>p.team===team);assert.equal(ps.length,3);assert.equal(new Set(ps.map(p=>p.hero)).size,3);}
});
test('resume identity is secret and a disconnect preserves player reservation',()=>{
  let time=0;const m=new RoomManager({now:()=>time}),a=m.connect(),r=m.create(a,'Ana','orb');
  const token=a.token,id=a.id;const pub=m.publicRoom(r);assert.equal(JSON.stringify(pub).includes(token),false);
  m.disconnect(a);time=20000;const resumed=m.connect(token);assert.equal(resumed.id,id);assert.equal(resumed.roomCode,r.code);
  m.disconnect(resumed);time=90000;m.cleanup();assert.notEqual(m.connect(token).id,id);
});
test('invalid mode and payload values are rejected without state changes',()=>{
  const m=new RoomManager(),a=m.connect();assert.throws(()=>m.create(a,'Ana','bad'));
  const r=m.create(a,'Ana','deathmatch');assert.throws(()=>m.choose(a,{team:2,hero:'knight'}));assert.equal(r.members[0].team,0);
});
test('disconnected member removed by rematch cannot resume a stale room membership',()=>{
  const m=new RoomManager(),a=m.connect(),b=m.connect(),r=m.create(a,'Ana','deathmatch');m.join(b,r.code,'Bea');
  m.disconnect(b);r.phase='finished';m.back(a);const resumed=m.connect(b.token);
  assert.equal(resumed.roomCode,null);
});
test('disconnected human removed at results is no longer a reserved human in lobby',()=>{
  const m=new RoomManager(),a=m.connect(),b=m.connect(),r=m.create(a,'Ana','flags');m.join(b,r.code,'Bea');
  m.disconnect(b);r.phase='finished';m.back(a);assert.equal(r.members.length,1);assert.equal(b.roomCode,null);
});
test('last disconnect preserves a long-running room for the full reconnect window',()=>{
  let time=0;const m=new RoomManager({now:()=>time}),a=m.connect(),r=m.create(a,'Ana','orb');
  time=180000;m.disconnect(a);time=195000;m.cleanup();assert.equal(m.rooms.has(r.code),true);
  time=230000;assert.equal(m.connect(a.token).roomCode,r.code);
});
