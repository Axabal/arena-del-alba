import {HEROES,MODES,COMBAT_RULES,PLAYER_RADIUS as R,MATCH_SECONDS,OVERTIME_SECONDS} from './config.js';
import {createMap} from './maps.js';
import {OGRE_BREATH,fanHitsCircle,fanHitsBox} from './zones.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const alive=p=>p.hp>0&&p.respawn<=0;
const inside=(p,o,r=0)=>Math.abs(p.x-o.x)<o.w/2+r&&Math.abs(p.y-o.y)<o.h/2+r;
function random(g){g._seed=(Math.imul(g._seed,1664525)+1013904223)>>>0;return g._seed/4294967296;}
function event(g,type,x,y,extras={}){g.events.push({id:++g._id,type,x,y,time:g.elapsed,...extras});if(g.events.length>100)g.events.shift();}
function score(g,team){g.scores[team]++;if(g.overtime&&g._firstOvertimeScore===null)g._firstOvertimeScore=team;}
function finish(g,winner){g.phase='finished';g.winner=winner;event(g,'finish',14,9,{team:winner});}
function flagPoint(g,resetting=null){const safe=g.map.flagPoints.filter(p=>!g.map.obstacles.some(o=>inside(p,o,.35))&&g.map.spawns.every(s=>dist(p,s)>1.7));const free=safe.filter(p=>!g.flags.some(f=>f!==resetting&&!f.carrier&&dist(p,f)<.7));const choices=free.length?free:safe;return choices[Math.floor(random(g)*choices.length)];}
function newFlag(g){const h=flagPoint(g);g.flags.push({id:`flag${++g._id}`,x:h.x,y:h.y,homeX:h.x,homeY:h.y,carrier:null,groundTime:0});}
export function createGame({mode='deathmatch',mapId='meadow',players=[],seed=1}={}){
  const map=createMap(mapId);mode=Object.hasOwn(MODES,mode)?mode:'deathmatch';
  const g={mode,map,players:[],projectiles:[],zones:[],flags:[],orbs:mode==='orb'?[{team:0,x:5,y:9,hp:120,maxHp:120},{team:1,x:23,y:9,hp:120,maxHp:120}]:[],scores:[0,0],elapsed:0,remaining:MATCH_SECONDS,overtime:false,phase:'playing',winner:null,events:[],tick:0,_seed:finite(seed,1)>>>0,_id:0,_flagTimer:0,_overtimeScores:null,_firstOvertimeScore:null};
  const counts=[0,0];
  g.players=players.map((p,i)=>{const hero=Object.hasOwn(HEROES,p.hero)?p.hero:'knight',h=HEROES[hero],team=p.team===1?1:0,s=map.spawns[team],offset=(counts[team]++-1)*.75;return {id:String(p.id??i),name:String(p.name||h.name).slice(0,24),team,hero,bot:!!p.bot,x:s.x,y:s.y+offset,hp:h.hp,maxHp:h.hp,charge:0,respawn:0,shield:2,cooldown:0,angle:team?Math.PI:0,carrying:null,stats:{kills:0,deaths:0,assists:0,damage:0,objectives:0},lastCombatAt:0,lastHitAt:-100,revealedUntil:0,recentDamage:{},burst:null,dash:null,botThink:random(g)*.25,botInput:{},path:[],pathUntil:0};});
  if(mode==='flags'){newFlag(g);newFlag(g);}return g;
}
function canStand(g,p,x,y){
  if(x<R||y<R||x>g.map.width-R||y>g.map.height-R)return false;
  if(dist({x,y},g.map.spawns[1-p.team])<1.7+R)return false;
  return !g.map.obstacles.some(o=>inside({x,y},o,R));
}
function move(g,p,dx,dy){const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.15));for(let i=0;i<n;i++){if(canStand(g,p,p.x+dx/n,p.y))p.x+=dx/n;if(canStand(g,p,p.x,p.y+dy/n))p.y+=dy/n;}}
function drop(g,p){if(!p.carrying)return;const f=g.flags.find(f=>f.id===p.carrying);if(f){f.x=p.x;f.y=p.y;f.carrier=null;f.groundTime=0;}p.carrying=null;}
function hurt(g,target,amount,owner,ultimate=false){
  if(amount<=0||target.team===owner.team||target.hp<=0||target.shield>0)return 0;
  const effective=Math.min(target.hp,amount);target.hp=Math.max(0,target.hp-amount);
  if(target.hero){target.lastCombatAt=g.elapsed;target.lastHitAt=g.elapsed;target.revealedUntil=g.elapsed+1.5;target.recentDamage[owner.id]=g.elapsed;owner.stats.damage+=effective;if(!ultimate)owner.charge=Math.min(HEROES[owner.hero].charge,owner.charge+effective);}
  event(g,'damage',target.x,target.y,{value:effective,team:owner.team,target:target.id??`orb${target.team}`,owner:owner.id});
  if(target.hero&&target.hp===0){target.respawn=5;target.dash=null;target.burst=null;target.shield=0;drop(g,target);target.stats.deaths++;owner.stats.kills++;for(const p of g.players)if(p.id!==owner.id&&p.team===owner.team&&g.elapsed-(target.recentDamage[p.id]??-100)<6)p.stats.assists++;target.recentDamage={};if(g.mode==='deathmatch')score(g,owner.team);event(g,'death',target.x,target.y,{team:target.team,killer:owner.id,target:target.id});}
  return effective;
}
function coverDamage(g,o,damage){if(o.permanent||o.hp<=0)return 0;const effective=Math.min(o.hp,damage);o.hp=Math.max(0,o.hp-damage);event(g,'damage',o.x,o.y,{value:effective,target:o.id});return effective;}
function ownerOf(g,id){return g.players.find(p=>p.id===id);}
function targets(g,team){return [...g.players.filter(p=>p.team!==team&&alive(p)),...g.orbs.filter(o=>o.team!==team&&o.hp>0)];}
function lineClear(g,a,b,permanentOnly=false){const d=dist(a,b),n=Math.max(1,Math.ceil(d/.15));for(let i=1;i<n;i++){const p={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};if(g.map.obstacles.some(o=>(!permanentOnly||o.permanent)&&o.hp!==0&&inside(p,o)))return false;}return true;}
function blast(g,x,y,r,damage,owner,kind='explosion',cast=null){event(g,'explosion',x,y,{team:owner.team,kind,r});for(const t of targets(g,owner.team))if(dist({x,y},t)<=r+(t.hero?R:.7)&&lineClear(g,{x,y},t,true)){const id=t.id??`orb${t.team}`,available=cast?Math.max(0,COMBAT_RULES.princeCastDamageCap-(cast.damage[id]||0)):damage;const dealt=hurt(g,t,Math.min(damage,available),owner,true);if(cast)cast.damage[id]=(cast.damage[id]||0)+dealt;}for(const o of g.map.obstacles)if(dist({x,y},o)<=r+Math.max(o.w,o.h)/2)coverDamage(g,o,damage);}
function shoot(g,p,angle,kind,damage,range,ultimate=false,cast=null){const speed=kind==='wave'?11:kind==='drain'?12:14;g.projectiles.push({id:`shot${++g._id}`,x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,team:p.team,owner:p.id,kind,damage,ultimate,remaining:range,cast,hit:[],r:kind==='wave'?.48:.12});}
function attack(g,p,ult){const h=HEROES[p.hero];if(ult&&p.charge<h.charge)return;if(!ult&&p.cooldown>0)return;p.shield=0;p.lastCombatAt=g.elapsed;p.revealedUntil=g.elapsed+1.5;if(ult)p.charge=0;else p.cooldown=h.cooldown;event(g,'attack',p.x,p.y,{team:p.team,owner:p.id,hero:p.hero,ultimate:ult,angle:p.angle});
  if(!ult){if(['knight','ogre','bull'].includes(p.hero)){for(const t of targets(g,p.team)){const a=Math.atan2(t.y-p.y,t.x-p.x),delta=Math.atan2(Math.sin(a-p.angle),Math.cos(a-p.angle));if(dist(p,t)<=h.range+(t.hero?R:.7)&&Math.abs(delta)<=.95&&lineClear(g,p,t))hurt(g,t,h.damage,p,false);}}
    else if(p.hero==='jester'){shoot(g,p,p.angle,'jester',2,5);p.burst={count:2,next:.13,angle:p.angle};}else shoot(g,p,p.angle,p.hero==='prince'?'arrow':'magic',h.damage,h.range);return;}
  if(p.hero==='knight')shoot(g,p,p.angle,'wave',7,8,true);
  if(p.hero==='warlock')shoot(g,p,p.angle,'drain',8,8,true);
  if(p.hero==='ogre')g.zones.push({id:`zone${++g._id}`,x:p.x,y:p.y,angle:p.angle,shape:'fan',...OGRE_BREATH,r:3,team:p.team,owner:p.id,kind:'poison',remaining:5,next:1,pulses:0});
  if(p.hero==='jester'){const range=3;let x=p.x,y=p.y;for(let d=.1;d<=range;d+=.1){const q={x:p.x+Math.cos(p.angle)*d,y:p.y+Math.sin(p.angle)*d};if(q.x<.3||q.x>27.7||q.y<.3||q.y>17.7||g.map.obstacles.some(o=>o.permanent&&inside(q,o)))break;x=q.x;y=q.y;}g.zones.push({id:`zone${++g._id}`,x,y,r:2,team:p.team,owner:p.id,kind:'box',remaining:.8,next:1,pulses:0});}
  if(p.hero==='bull')p.dash={remaining:3,angle:p.angle,hit:[]};
  if(p.hero==='prince'){const cast={id:`cast${++g._id}`,damage:Object.create(null)};for(let i=-2;i<=2;i++)shoot(g,p,p.angle+i*.24,'royal',7,3,true,cast);}
}
function projectileStep(g,s,dt){const owner=ownerOf(g,s.owner);if(!owner)return false;const travel=Math.min(s.remaining,Math.hypot(s.vx,s.vy)*dt),steps=Math.max(1,Math.ceil(travel/.1)),speed=Math.hypot(s.vx,s.vy);for(let k=0;k<steps;k++){s.x+=s.vx/speed*travel/steps;s.y+=s.vy/speed*travel/steps;s.remaining-=travel/steps;if(s.x<0||s.x>28||s.y<0||s.y>18)return false;
    for(const o of g.map.obstacles){if(o.hp===0||!inside(s,o,s.r)||s.hit.includes(o.id))continue;if(o.permanent||!s.ultimate)return false;s.hit.push(o.id);if(s.kind==='royal'){blast(g,s.x,s.y,.55,s.damage,owner,'royal',s.cast);return false;}const effective=coverDamage(g,o,s.damage);if(s.kind==='drain'&&alive(owner))owner.hp=Math.min(owner.maxHp,owner.hp+effective);if(s.kind!=='wave'||o.hp>0)return false;}
    for(const t of targets(g,s.team)){const id=t.id??`orb${t.team}`;if(s.hit.includes(id)||dist(s,t)>s.r+(t.hero?R:.7))continue;s.hit.push(id);if(s.kind==='royal'){blast(g,s.x,s.y,.55,s.damage,owner,'royal',s.cast);return false;}const effective=hurt(g,t,s.damage,owner,s.ultimate);if(s.kind==='drain'&&alive(owner))owner.hp=Math.min(owner.maxHp,owner.hp+effective);if(s.kind!=='wave')return false;}
  }if(s.remaining<=.0001){if(s.kind==='royal')blast(g,s.x,s.y,.55,s.damage,owner,'royal',s.cast);return false;}return true;}
function dashStep(g,p,dt){const d=p.dash;if(!d)return;const length=Math.min(d.remaining,12*dt),n=Math.ceil(length/.1);for(let k=0;k<n;k++){const dx=Math.cos(d.angle)*length/n,dy=Math.sin(d.angle)*length/n,q={x:p.x+dx,y:p.y+dy};for(const o of g.map.obstacles)if(inside(q,o,R)&&!o.permanent)coverDamage(g,o,13);g.map.obstacles=g.map.obstacles.filter(o=>o.hp!==0);if(!canStand(g,p,q.x,q.y)){p.dash=null;return;}p.x=q.x;p.y=q.y;d.remaining-=length/n;for(const t of targets(g,p.team)){const id=t.id??`orb${t.team}`;if(!d.hit.includes(id)&&dist(p,t)<.9){d.hit.push(id);const dealt=hurt(g,t,13,p,true);if(t.hero&&dealt>0&&alive(t))move(g,t,Math.cos(d.angle)*1.2,Math.sin(d.angle)*1.2);}}}if(d.remaining<=.001)p.dash=null;}
function respawn(g,p){const s=g.map.spawns[p.team];let spot=s;for(const [dx,dy] of [[0,0],[0,-.85],[0,.85],[-.65,0],[.65,0]]){const q={x:s.x+dx,y:s.y+dy};if(canStand(g,p,q.x,q.y)&&!g.players.some(o=>o.id!==p.id&&alive(o)&&dist(o,q)<R*2)){spot=q;break;}}p.x=spot.x;p.y=spot.y;p.hp=p.maxHp;p.lastCombatAt=g.elapsed;p.respawn=0;p.shield=2;p.cooldown=0;event(g,'respawn',p.x,p.y,{team:p.team,target:p.id});}
export function visiblePlayers(g,team){return g.players.filter(p=>p.team===team||!alive(p)||p.revealedUntil>g.elapsed||!g.map.bushes.some(b=>inside(p,b))||g.players.some(a=>a.team===team&&alive(a)&&dist(a,p)<=2));}
function input(raw={}){if(!raw||typeof raw!=='object')raw={};let mx=clamp(finite(raw.mx),-1,1),my=clamp(finite(raw.my),-1,1);const len=Math.hypot(mx,my);if(len>1){mx/=len;my/=len;}return {mx,my,angle:finite(raw.angle),attack:raw.attack===true,ult:raw.ult===true};}
function route(g,p,target){const sx=Math.floor(p.x),sy=Math.floor(p.y),tx=clamp(Math.floor(target.x),0,27),ty=clamp(Math.floor(target.y),0,17),start=sy*28+sx,goal=ty*28+tx;const queue=[start],prev=new Map([[start,-1]]);let found=start,best=Math.hypot(sx-tx,sy-ty);for(let i=0;i<queue.length;i++){const v=queue[i],x=v%28,y=Math.floor(v/28),d=Math.hypot(x-tx,y-ty);if(d<best){best=d;found=v;}if(v===goal)break;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,w=ny*28+nx;if(nx<0||nx>27||ny<0||ny>17||prev.has(w)||!canStand(g,p,nx+.5,ny+.5))continue;prev.set(w,v);queue.push(w);}}if(prev.has(goal))found=goal;const path=[];while(found!==start&&found!==-1){path.push({x:found%28+.5,y:Math.floor(found/28)+.5});found=prev.get(found)??-1;}return path.reverse();}
function botInput(g,p,dt){p.botThink-=dt;if(p.botThink>0)return p.botInput;p.botThink=.18+random(g)*.12;const visible=visiblePlayers(g,p.team).filter(t=>t.team!==p.team&&alive(t)&&t.shield<=0),enemies=visible.sort((a,b)=>dist(a,p)-dist(b,p));let target=enemies[0],goal=target||{x:14,y:9},attackTarget=target;
  if(g.mode==='flags'){if(p.carrying)goal=g.map.portals[p.team];else {const f=g.flags.filter(f=>!f.carrier).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(f)goal=f;else {const carrier=visible.find(e=>e.carrying);if(carrier)goal=carrier;}}}
  if(g.mode==='orb'){const own=g.orbs[p.team],enemy=g.orbs[1-p.team],threat=enemies.find(e=>dist(e,own)<5);goal=threat||enemy;if(!target||dist(p,target)>HEROES[p.hero].range+1)attackTarget=enemy;}
  const h=HEROES[p.hero];let attackNow=attackTarget&&dist(p,attackTarget)<=h.range+.2&&lineClear(g,p,attackTarget);if(g.mode==='deathmatch'&&target&&attackNow)goal=p;
  let waypoint=goal;if(!lineClear(g,p,goal)||!canStand(g,p,goal.x,goal.y)){if(g.elapsed>=p.pathUntil||!p.path.length){p.path=route(g,p,goal);p.pathUntil=g.elapsed+.8;}while(p.path.length&&dist(p,p.path[0])<.25)p.path.shift();waypoint=p.path[0]||goal;}else p.path=[];
  const d=dist(p,waypoint),mx=d>.15?(waypoint.x-p.x)/d:0,my=d>.15?(waypoint.y-p.y)/d:0;
  const aim=attackTarget||goal;let angle=Math.atan2(aim.y-p.y,aim.x-p.x)+(random(g)-.5)*.08;
  // The ogre breathes close ahead; only the jester still throws a zone farther away.
  const ud=dist(p,aim),ultRange={knight:8,ogre:OGRE_BREATH.range,warlock:8,jester:3,bull:3,prince:3}[p.hero],ult=p.charge>=h.charge&&ud<=ultRange+.5&&(p.hero!=='jester'||ud>=1.2)&&lineClear(g,p,aim,true);
  return p.botInput=input({mx,my,angle,attack:!!attackNow,ult});
}
function objectives(g,dt){if(g.mode==='flags'){g._flagTimer+=dt;if(g._flagTimer>=15){g._flagTimer-=15;if(g.flags.filter(f=>!f.carrier).length<3)newFlag(g);}for(const f of [...g.flags]){if(f.carrier){const p=ownerOf(g,f.carrier);if(!p||!alive(p)){f.carrier=null;continue;}f.x=p.x;f.y=p.y;if(dist(p,g.map.portals[p.team])<.9){score(g,p.team);p.stats.objectives++;p.carrying=null;g.flags.splice(g.flags.indexOf(f),1);event(g,'objective',p.x,p.y,{team:p.team,value:1});}}else {f.groundTime+=dt;if(f.groundTime>=15){const point=flagPoint(g,f);f.x=f.homeX=point.x;f.y=f.homeY=point.y;f.groundTime=0;}const p=g.players.find(p=>alive(p)&&!p.carrying&&dist(p,f)<.65);if(p){f.carrier=p.id;p.carrying=f.id;f.groundTime=0;event(g,'pickup',p.x,p.y,{team:p.team,owner:p.id,visibleTo:[0,1].filter(team=>visiblePlayers(g,team).some(v=>v.id===p.id))});}}}}
  if(g.mode==='orb'&&g.orbs.some(o=>o.hp<=0)){finish(g,g.orbs.every(o=>o.hp<=0)?null:g.orbs[0].hp<=0?1:0);return;}
  if(g.overtime&&g.mode!=='orb'&&g._firstOvertimeScore!==null){finish(g,g._firstOvertimeScore);return;}
  if(g.remaining<=0){const values=g.mode==='orb'?g.orbs.map(o=>o.hp):g.scores;if(values[0]!==values[1])finish(g,values[0]>values[1]?0:1);else if(g.overtime)finish(g,null);else {g.overtime=true;g.remaining=OVERTIME_SECONDS;g._overtimeScores=[...g.scores];event(g,'overtime',14,9);}}
}
export function stepGame(g,dt,inputs={}){if(g.phase!=='playing')return;dt=clamp(finite(dt),0,.1);if(!dt)return;g.elapsed+=dt;g.remaining=Math.max(0,g.remaining-dt);g.tick++;
  const inactive=new Set(g.players.filter(p=>!alive(p)));
  for(const p of inactive){p.respawn=Math.max(0,p.respawn-dt);if(p.respawn<=.000001)respawn(g,p);}
  for(const p of g.players){if(inactive.has(p)||!alive(p))continue;p.shield=Math.max(0,p.shield-dt);p.cooldown=Math.max(0,p.cooldown-dt);const cmd=p.bot?botInput(g,p,dt):input(inputs?.[p.id]);p.angle=cmd.angle;if(p.dash)dashStep(g,p,dt);else move(g,p,cmd.mx*HEROES[p.hero].speed*dt,cmd.my*HEROES[p.hero].speed*dt);if(p.burst){p.burst.next-=dt;if(p.burst.next<=0){shoot(g,p,p.burst.angle,'jester',2,5);p.burst.count--;p.burst.next+=.13;if(!p.burst.count)p.burst=null;}}if(cmd.ult&&p.charge>=HEROES[p.hero].charge)attack(g,p,true);else if(cmd.attack)attack(g,p,false);}
  g.projectiles=g.projectiles.filter(s=>projectileStep(g,s,dt));
  for(const z of g.zones){z.remaining-=dt;const owner=ownerOf(g,z.owner);if(!owner)continue;if(z.kind==='box'&&z.remaining<=.000001)blast(g,z.x,z.y,z.r,10,owner,'box');if(z.kind==='poison'){z.next-=dt;while(z.next<=.000001&&z.pulses<5){z.next+=1;z.pulses++;for(const t of targets(g,z.team))if(fanHitsCircle(z,t,t.hero?R:.7)&&lineClear(g,z,t,true))hurt(g,t,2,owner,true);for(const o of g.map.obstacles)if(!o.permanent&&fanHitsBox(z,o)&&lineClear(g,z,o,true))coverDamage(g,o,2);event(g,'pulse',z.x,z.y,{team:z.team,r:z.r,shape:z.shape,angle:z.angle,start:z.start,range:z.range,nearWidth:z.nearWidth,farWidth:z.farWidth});}}}
  for(const p of g.players){if(!alive(p))continue;const recovery=Math.min(dt,Math.max(0,g.elapsed-p.lastCombatAt-COMBAT_RULES.regenDelay));if(recovery>1e-8)p.hp=Math.min(p.maxHp,p.hp+p.maxHp*COMBAT_RULES.regenFractionPerSecond*recovery);}
  g.zones=g.zones.filter(z=>z.remaining>.000001);g.map.obstacles=g.map.obstacles.filter(o=>o.hp!==0);objectives(g,dt);
}
export function snapshotFor(g,team){const players=(g.phase==='finished'?g.players:visiblePlayers(g,team)).map(({recentDamage,burst,dash,botThink,botInput,path,pathUntil,...p})=>p);const visibleIds=new Set(players.map(p=>p.id));const flags=g.flags.filter(f=>!f.carrier||visibleIds.has(f.carrier));const events=g.events.filter(e=>!e.visibleTo||e.visibleTo.includes(team)).map(({visibleTo,...e})=>e);const {_seed,_id,_flagTimer,_overtimeScores,_firstOvertimeScore,...publicState}=g;return JSON.parse(JSON.stringify({...publicState,players,flags,events}));}
