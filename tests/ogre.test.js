import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,snapshotFor} from '../public/shared/engine.js';
import {HEROES} from '../public/shared/config.js';
function scene(points){
  const g=createGame({players:[{id:'ogre',hero:'ogre',team:0},...points.map((_,i)=>({id:`enemy${i}`,hero:'ogre',team:1}))]});
  g.map.obstacles=[];g.map.bushes=[];
  g.players.forEach((p,i)=>{p.x=i?points[i-1][0]:10;p.y=i?points[i-1][1]:9;p.shield=0;});
  g.players[0].charge=HEROES.ogre.charge;return g;
}
function advance(g,seconds){for(let i=0;i<Math.round(seconds*30);i++)stepGame(g,1/30);}
function cast(g,angle=0){stepGame(g,1/30,{ogre:{ult:true,angle}});}
test('ogre breath starts nearby, widens ahead, excludes rear and former distant landing area',()=>{
  const g=scene([[10.7,9],[12.6,10.3],[10.4,10.4],[8.8,9],[15,9]]);cast(g);advance(g,1);
  assert.deepEqual(g.players.slice(1).map(p=>p.hp),[63,63,65,65,65]);
});
test('ogre fan rotates with aim, stays where cast and delivers five pulses without friendly fire or charge',()=>{
  const g=scene([[10,11],[11.2,11.5]]);g.players[2].team=0;cast(g,Math.PI/2);
  const zone=structuredClone(g.zones[0]);g.players[0].x=5;g.players[0].y=3;
  advance(g,5.1);assert.equal(g.players[1].hp,55);assert.equal(g.players[2].hp,65);assert.equal(g.players[0].charge,0);assert.equal(g.zones.length,0);
  assert.equal(zone.shape,'fan');assert.equal(zone.x,10);assert.equal(zone.y,9);assert.equal(zone.angle,Math.PI/2);
});
test('permanent walls block breath damage and destructible cover is only damaged inside the fan',()=>{
  const g=scene([[12,9]]);g.map.obstacles=[{id:'wall',x:11,y:9,w:.25,h:2,permanent:true,hp:null},{id:'near',x:10.4,y:9,w:.2,h:.2,permanent:false,hp:6},{id:'outside',x:10.4,y:11,w:.2,h:.2,permanent:false,hp:6}];
  cast(g);advance(g,3);assert.equal(g.players[1].hp,65);assert.ok(!g.map.obstacles.some(o=>o.id==='near'));assert.equal(g.map.obstacles.find(o=>o.id==='outside').hp,6);assert.equal(g.map.obstacles.find(o=>o.id==='wall').hp,null);
});
test('ogre bots cast breath against nearby opponents and snapshots include the fan geometry',()=>{
  const g=scene([[11.3,9]]);const p=g.players[0];p.bot=true;p.botThink=0;stepGame(g,1/30);
  assert.equal(p.charge,0);assert.equal(g.zones.length,1);assert.equal(snapshotFor(g,0).zones[0].shape,'fan');
});
