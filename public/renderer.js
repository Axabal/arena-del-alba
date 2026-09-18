import { HEROES } from './shared/config.js';
import { drawPaintedHero, rigReady } from './hero-rig.js';
import { Effects } from './vfx.js';
import {groundArt,bushArt,obstacleArt,ambientDetails} from './terrain-art.js';
export {rigReady};

const palettes={meadow:{bg:'#9aaa8b',ground:'#c1cba1',edge:'#849875',path:'#d9cfac',grass:'#93aa7b',rock:'#a1a897',dark:'#7e8c77'},graveyard:{bg:'#535d6d',ground:'#8b9291',edge:'#596a6b',path:'#aaa999',grass:'#687f75',rock:'#9da8a2',dark:'#65757a'},beach:{bg:'#82b5b1',ground:'#e0d3b0',edge:'#c0b48c',path:'#ecdfbd',grass:'#8aa77a',rock:'#b4b5a1',dark:'#899986'}};
const heroColors={knight:'#91aeba',ogre:'#a4b27d',warlock:'#a899b8',jester:'#c8989a',bull:'#b7977d',prince:'#b6bf89'};
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function round(c,x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function star(c,x,y,r,color,rotation=0){const points=[];for(let i=0;i<8;i++){const a=i*Math.PI/4+rotation;const rr=i%2?r*.3:r;points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}poly(c,points,color);}

/** Original vector characters. Coordinates are centered at the feet. */
export function drawHero(c,hero,x,y,size=80,options={}){
  if(drawPaintedHero(c,hero,x,y,size,options))return;
  drawVectorFallback(c,hero,x,y,size,options);
}
function drawVectorFallback(c,hero,x,y,size=80,{time=0,walk=0,face=1,team=null,attack=0,alpha=1}={}){
  c.save();c.translate(x,y);c.scale(size/100,size/100);c.globalAlpha=alpha;
  ellipse(c,0,1,29,9,'#20362e23');
  if(team!==null){c.strokeStyle=team===0?'#80afc5':'#d39482';c.lineWidth=3;c.beginPath();c.ellipse(0,0,28,10,0,0,Math.PI*2);c.stroke();}
  c.scale(face,1);const bob=walk?Math.sin(time*13)*2:Math.sin(time*2)*.7;c.translate(0,bob);
  const leg=walk?Math.sin(time*13)*5:0,base=heroColors[hero]||'#a5b28d';
  round(c,-18,-20+leg,14,20,5,'#526157');round(c,6,-20-leg,14,20,5,'#526157');
  if(hero==='warlock'){poly(c,[[-19,-49],[20,-49],[29,-5],[-29,-5]],base);poly(c,[[-14,-45],[-1,-44],[-6,-5],[-24,-5]],'#9283a4');line(c,[[-19,-8],[20,-8]],'#d7cbb4',3);}
  else {round(c,-24,-49,48,35,12,base);round(c,-21,-21,42,7,2,'#637464');round(c,-5,-22,10,9,2,'#d7c49a');}
  const skin=hero==='ogre'?'#b4c18d':hero==='bull'?'#bea086':'#e6c8a7';
  if(hero==='knight'){
    round(c,-28,-72,53,39,15,'#a7bbc3');round(c,-25,-57,49,20,7,'#73919e');round(c,-21,-57,39,13,4,'#364e57');line(c,[[-12,-55],[-12,-47]],'#bdcdd0',3);line(c,[[0,-55],[0,-47]],'#bdcdd0',3);line(c,[[12,-55],[12,-47]],'#bdcdd0',3);
    poly(c,[[-7,-71],[-5,-88],[6,-91],[17,-85],[6,-75],[5,-70]],'#c29282');round(c,-31,-47,14,19,5,'#c0ccd0');round(c,18,-47,13,18,5,'#b8c9cc');
    c.save();c.translate(31,-33);c.rotate(attack?-.8: .2);poly(c,[[-4,0],[-3,-43],[3,-52],[8,-43],[7,0]],'#e7ece3');poly(c,[[2,-46],[5,-39],[5,-2],[2,-2]],'#b0c5c5');round(c,-10,-4,23,5,2,'#c3aa77');round(c,0,0,7,13,2,'#7c6f56');c.restore();
    poly(c,[[-34,-41],[-14,-37],[-16,-14],[-28,-6],[-38,-20]],'#839ead');poly(c,[[-29,-36],[-24,-33],[-22,-20],[-28,-16],[-33,-23]],'#dbe2d1');
  }else if(hero==='ogre'){
    round(c,-31,-65,59,42,18,skin);ellipse(c,-29,-50,9,11,skin);ellipse(c,29,-49,9,11,skin);round(c,-18,-37,37,14,7,'#8a996b');poly(c,[[-11,-37],[-8,-27],[-4,-37]],'#f6e9ce');poly(c,[[11,-37],[14,-28],[18,-37]],'#f6e9ce');round(c,-41,-42,17,28,8,skin);round(c,25,-42,19,28,8,skin);poly(c,[[-19,-63],[-13,-76],[-5,-64],[2,-77],[10,-63]],'#708965');
    line(c,[[-19,-49],[-9,-51]],'#55674b',3);line(c,[[8,-51],[18,-49]],'#55674b',3);ellipse(c,-12,-46,2.5,3,'#384638');ellipse(c,12,-46,2.5,3,'#384638');
  }else if(hero==='warlock'){
    ellipse(c,0,-56,21,24,skin);poly(c,[[-28,-57],[-11,-100],[0,-106],[21,-63],[30,-56]],base);poly(c,[[-24,-63],[25,-63],[30,-54],[-28,-54]],'#80718f');star(c,-6,-78,5,'#e6d9aa');ellipse(c,-6,-53,3,3,'#3e4748');ellipse(c,9,-53,3,3,'#3e4748');poly(c,[[-17,-45],[16,-45],[7,-22],[-3,-26]],'#e4e2d4');
    line(c,[[32,-3],[35,-77]],'#826d55',5);ellipse(c,35,-81,10,12,'#d9c7eb');ellipse(c,32,-85,4,4,'#f8eafd');star(c,35,-81,7,'#f3e9fa',time);round(c,20,-45,17,14,6,base);
  }else if(hero==='jester'){
    ellipse(c,0,-55,23,25,skin);poly(c,[[-24,-61],[-35,-89],[-12,-82],[0,-65]],'#ad8397');poly(c,[[-6,-68],[2,-99],[22,-87],[25,-62]],'#8a9caa');ellipse(c,-34,-87,5,5,'#dbc590');ellipse(c,20,-87,5,5,'#dbc590');poly(c,[[-26,-36],[-12,-26],[0,-34],[11,-25],[25,-36]],'#eee1c6');
    ellipse(c,-8,-56,3,4,'#655467');ellipse(c,9,-56,3,4,'#655467');ellipse(c,0,-47,4,4,'#c78f8c');line(c,[[-7,-39],[0,-36],[8,-40]],'#98726f',2);
    for(let i=0;i<3;i++){const a=time*1.6+i*2.094;ellipse(c,Math.cos(a)*39,-55+Math.sin(a)*26,7,7,['#b293a9','#e2c98e','#94b3b9'][i]);}
    round(c,-35,-43,15,19,6,'#cba2aa');round(c,20,-43,15,19,6,'#99adb8');
  }else if(hero==='bull'){
    round(c,-27,-68,54,41,17,skin);poly(c,[[-24,-58],[-38,-66],[-39,-84],[-29,-76],[-20,-71]],'#eee1c3');poly(c,[[24,-58],[38,-66],[39,-84],[29,-76],[20,-71]],'#eee1c3');round(c,-21,-46,43,19,9,'#d1b296');ellipse(c,-9,-37,3,2,'#836d58');ellipse(c,10,-37,3,2,'#836d58');line(c,[[-17,-56],[-7,-53]],'#584e43',3);line(c,[[7,-53],[17,-56]],'#584e43',3);ellipse(c,-12,-50,2,3,'#3b4138');ellipse(c,12,-50,2,3,'#3b4138');round(c,-35,-40,14,25,7,skin);round(c,22,-40,14,25,7,skin);poly(c,[[-14,-67],[-5,-79],[6,-75],[16,-67]],'#796651');
  }else{
    poly(c,[[-20,-47],[-30,-9],[17,-16],[24,-43]],'#8ea392');ellipse(c,0,-56,22,25,skin);poly(c,[[-24,-56],[-22,-75],[5,-84],[24,-72],[20,-57],[10,-69],[-9,-67]],'#ac9869');poly(c,[[-19,-76],[-23,-90],[-8,-84],[0,-95],[8,-84],[21,-91],[18,-77]],'#d9c48a');ellipse(c,0,-84,3,3,'#acb5bd');ellipse(c,-7,-55,2.5,3,'#4d584d');ellipse(c,10,-55,2.5,3,'#4d584d');line(c,[[-5,-43],[4,-41],[10,-44]],'#ae9477',2);
    c.strokeStyle='#ad885b';c.lineWidth=5;c.beginPath();c.ellipse(29,-33,15,28,0,-Math.PI/2,Math.PI/2);c.stroke();line(c,[[29,-61],[26,-33],[29,-5]],'#e7ddbd',1.5);line(c,[[15,-34],[56,-34]],'#856f51',3);poly(c,[[57,-34],[46,-39],[47,-29]],'#c7d3cb');round(c,18,-44,13,16,6,base);
  }
  c.restore();
}
export function portrait(canvas,hero,time=.6){const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth||150,h=canvas.clientHeight||120;canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);ellipse(c,w/2,h*.7,w*.37,h*.31,heroColors[hero]+'22');drawHero(c,hero,w/2,h*.93,h*.8,{time});}

function tree(c,x,y,s,palm=false,color='#8fa77e'){
  ellipse(c,x+5*s,y+4*s,17*s,7*s,'#253e2820');line(c,[[x,y],[x-2*s,y-36*s]],'#9c8c65',6*s);
  if(palm){for(let i=0;i<6;i++){const a=i*Math.PI/3;const dx=Math.cos(a)*30*s,dy=Math.sin(a)*13*s;poly(c,[[x-2*s,y-36*s],[x+dx*.5,y-47*s+dy*.5],[x+dx,y-34*s+dy],[x+dx*.4,y-39*s+dy*.4]],i%2?'#87a678':'#9eb486');}}
  else {ellipse(c,x,y-37*s,23*s,21*s,color);ellipse(c,x-8*s,y-46*s,13*s,13*s,'#a4ba8c');ellipse(c,x+10*s,y-32*s,15*s,14*s,color);}
}
export function drawHome(canvas,time=0){
  const dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=w*dpr;canvas.height=h*dpr;}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const s=Math.min(w/620,h/500);c.translate(w/2,h*.51);c.scale(s,s);
  ellipse(c,0,128,230,37,'#344b3020');ellipse(c,0,25,282,209,'#e8ebdd');
  for(let i=0;i<9;i++){const a=i*2.3;star(c,Math.cos(a)*270,Math.sin(a)*180,3+i%3,'#b7c39e',time*.12);}
  poly(c,[[-239,14],[-149,-111],[124,-104],[244,18],[199,106],[-44,144],[-216,88]],'#8f9e77');
  poly(c,[[-239,14],[-149,-128],[124,-121],[244,1],[199,84],[-44,122],[-216,69]],'#c6cdab');
  poly(c,[[-224,12],[-143,-113],[119,-107],[226,3],[187,74],[-40,110],[-204,62]],'#b5c29b');
  poly(c,[[-188,28],[-128,1],[-52,18],[27,-44],[93,-41],[156,7],[132,36],[50,17],[-27,64],[-110,62]],'#d9cfaa');
  for(let i=0;i<26;i++){const x=Math.sin(i*8.4)*200,y=Math.cos(i*5.2)*76;line(c,[[x,y],[x+2,y-4],[x+5,y]],'#98ad842b',3);}
  tree(c,-165,-30,1.25);tree(c,177,-13,1.15,true);tree(c,110,-88,.8);
  round(c,-108,-68,42,28,6,'#879680');round(c,-108,-77,42,25,6,'#a6b197');poly(c,[[-108,-68],[-96,-76],[-66,-74],[-75,-64]],'#b9c1a4');
  drawHero(c,'ogre',-59,-42,92,{time,face:1});drawHero(c,'warlock',49,-66,90,{time});drawHero(c,'prince',140,34,94,{time,face:-1});drawHero(c,'jester',-153,62,91,{time});drawHero(c,'bull',62,94,98,{time,face:-1});drawHero(c,'knight',-38,63,120,{time});
  for(const [x,y]of [[-206,59],[196,65],[-88,111]]){ellipse(c,x,y,13,6,'#9eb489');ellipse(c,x-5,y-4,9,7,'#a7bc8d');ellipse(c,x+7,y-5,8,6,'#b7c89b');}
  star(c,88,-163,10,'#a1b489',.1);star(c,-214,-112,6,'#c0c99f',.1);
}

export class ArenaRenderer{
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');this.positions=new Map();this.lastTime=0;this.scale=1;this.ox=0;this.oy=0;this.low=false;this.effects=new Effects();}
  screenToWorld(x,y){return{x:(x-this.ox)/this.scale,y:(y-this.oy)/(this.scale*.76)};}
  project(x,y){return{x:this.ox+x*this.scale,y:this.oy+y*this.scale*.76};}
  render(g,myId,time,aim=null){
    const canvas=this.canvas,c=this.c,w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,this.low?1:2);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=w*dpr;canvas.height=h*dpr;}
    c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,w,h);const pal=palettes[g.map.id]||palettes.meadow;
    c.fillStyle=pal.bg;c.fillRect(0,0,w,h);
    this.scale=Math.min((w-34)/28,(h-98)/(18*.76))*(w<1000?1.75:1.5);
    const selfPosition=g.players.find(a=>a.id===myId)||{x:14,y:9},previousPosition=this.positions.get(myId);
    const focus=previousPosition&&Math.hypot(previousPosition.x-selfPosition.x,previousPosition.y-selfPosition.y)<3?previousPosition:selfPosition;
    const worldW=28*this.scale,worldH=18*this.scale*.76;
    this.ox=worldW>w?Math.max(w-worldW-15,Math.min(15,w/2-focus.x*this.scale)):(w-worldW)/2;
    this.oy=worldH>h-90?Math.max(h-worldH-30,Math.min(65,h/2-focus.y*this.scale*.76)):(h-worldH)/2+15;
    const s=this.scale,p=(x,y)=>this.project(x,y),tl=p(0,0),br=p(28,18),gw=br.x-tl.x,gh=br.y-tl.y;
    round(c,tl.x-7,tl.y+3,gw+14,gh+15,15,pal.edge);round(c,tl.x-3,tl.y-5,gw+6,gh+10,13,pal.ground);
    c.save();c.beginPath();c.roundRect(tl.x,tl.y,gw,gh,10);c.clip();
    groundArt(c,g.map,p,s);
    const road=p(0,7);round(c,road.x,road.y,28*s,4*s*.76,20,pal.path+'8c');
    // Hand-built inset pavers and chipped edges give the arena a material surface.
    for(let row=0;row<4;row++)for(let col=0;col<19;col++){const xx=col*1.55+(row%2)*.6,yy=7+row*.93,q=p(xx,yy),tw=1.4*s,th=.81*s*.76;const colors=g.map.id==='graveyard'?['#909496','#98999a','#7f888d']:g.map.id==='beach'?['#d9c79e','#e6d6ac','#cdbd99']:['#b7b6a0','#c5c1a6','#aaaE99'];round(c,q.x,q.y,tw,th,3,'#43504244');round(c,q.x,q.y-2,tw,th-1,3,colors[(row+col)%3]);line(c,[[q.x+4,q.y],[q.x+tw-5,q.y]],'#eeebd044',1);if((row+col)%5===0)line(c,[[q.x+tw*.6,q.y],[q.x+tw*.45,q.y+th*.5],[q.x+tw*.7,q.y+th]],'#62726144',1);}
    const center=p(14,9);c.strokeStyle=pal.dark+'24';c.lineWidth=1.5;c.setLineDash([4,9]);c.beginPath();c.moveTo(center.x,tl.y);c.lineTo(center.x,br.y);c.stroke();c.setLineDash([]);c.strokeStyle=pal.dark+'35';c.beginPath();c.ellipse(center.x,center.y,2*s,2*s*.76,0,0,Math.PI*2);c.stroke();
    for(let team=0;team<2;team++){const spawn=p(g.map.spawns[team].x,g.map.spawns[team].y),color=team===0?'#7dabbc':'#cb9283';ellipse(c,spawn.x,spawn.y,1.7*s,1.7*s*.76,color+'3d');c.strokeStyle=color+'aa';c.lineWidth=2;c.beginPath();c.ellipse(spawn.x,spawn.y,1.7*s,1.7*s*.76,0,0,Math.PI*2);c.stroke();star(c,spawn.x,spawn.y,.4*s,color,.7);}
    for(const b of g.map.bushes){if(bushArt(c,g.map,b,p,s,time))continue;const q=p(b.x-b.w/2,b.y-b.h/2);round(c,q.x,q.y,b.w*s,b.h*s*.76,8,pal.grass+'bf');if(!this.low)for(let j=0;j<Math.ceil(b.w*4);j++){const bx=q.x+(j*.73%b.w)*s,by=q.y+((j*.49)%b.h)*s*.76;ellipse(c,bx,by,.25*s,.2*s,pal.grass);line(c,[[bx-2,by],[bx,by-5],[bx+3,by]],'#c8d2ac66',1.3);}}
    if(g.mode==='flags')g.map.portals.forEach((portal,team)=>{const q=p(portal.x,portal.y),col=team?'#ce9280':'#83afbd';ellipse(c,q.x,q.y,.8*s,.5*s,col+'55');c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.ellipse(q.x,q.y-.35*s,.55*s,.8*s,0,0,Math.PI*2);c.stroke();star(c,q.x,q.y-.35*s,.23*s,'#f6f1d4',time);});
    for(const z of g.zones){const q=p(z.x,z.y),col=z.kind==='poison'?'#a1ab65':'#cb8d7f';ellipse(c,q.x,q.y,z.r*s,z.r*s*.76,col+'55');c.strokeStyle=col;c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.ellipse(q.x,q.y,z.r*s,z.r*s*.76,0,0,Math.PI*2);c.stroke();c.setLineDash([]);if(z.kind==='box'){round(c,q.x-.24*s,q.y-.48*s,.48*s,.48*s,3,'#b58e9c');line(c,[[q.x,q.y-.5*s],[q.x,q.y]],'#e7d3ad',3);star(c,q.x+.2*s,q.y-.55*s,.12*s,'#ffde92',time*5);}}
    if(aim){const me=g.players.find(p=>p.id===myId);if(me&&me.hp>0){const q=p(me.x,me.y),len=aim.range*s;c.save();c.translate(q.x,q.y);c.scale(1,.76);c.rotate(aim.angle);c.globalAlpha=.38;poly(c,[[0,-3],[len,-7],[len,7],[0,3]],'#fffce1');poly(c,[[len+9,0],[len-3,-12],[len-3,12]],'#fffce1');c.restore();}}
    const drawables=[...g.map.obstacles.map(o=>({type:'obstacle',y:o.y+o.h/2,item:o})),...g.players.filter(a=>a.hp>0||a.respawn>4.55).map(a=>({type:'player',y:a.y,item:a})),...(g.orbs||[]).map(o=>({type:'orb',y:o.y,item:o}))].sort((a,b)=>a.y-b.y);
    const now=time,dt=Math.min(.1,Math.max(.001,now-this.lastTime));this.lastTime=now;
    this.effects.update(g,dt,this.low);this.effects.drawZones(c,g,p,s,time,this.low);
    for(const obj of drawables){const a=obj.item,q=p(a.x,a.y);
      if(obj.type==='obstacle'){if(obstacleArt(c,g.map,a,p,s,time))continue;const ow=a.w*s,oh=a.h*s*.76,rise=.4*s;ellipse(c,q.x+3,q.y+oh/2,ow*.53,.2*s,'#283a2a20');round(c,q.x-ow/2,q.y-oh/2,ow,oh+rise,4,pal.dark);round(c,q.x-ow/2,q.y-oh/2-rise,ow,oh,5,pal.rock);line(c,[[q.x-ow/2+4,q.y-oh/2-rise+3],[q.x+ow/2-4,q.y-oh/2-rise+3]],'#d2d6bf66',2);
        if(g.map.id==='graveyard'){line(c,[[q.x,q.y-oh/2-rise+5],[q.x,q.y+oh/2-rise-5]],'#657579',3);line(c,[[q.x-.2*s,q.y-rise-.15*s],[q.x+.2*s,q.y-rise-.15*s]],'#657579',3);}else if(g.map.id==='beach'&&a.permanent){tree(c,q.x,q.y+oh*.25,s/36,true);}else {line(c,[[q.x-ow*.25,q.y-rise],[q.x,q.y-rise+oh*.15],[q.x+ow*.12,q.y-rise-oh*.15]],pal.dark+'60',1.5);}if(!a.permanent&&a.hp<6){line(c,[[q.x-ow/2,q.y+oh/2+rise+3],[q.x-ow/2+ow*a.hp/6,q.y+oh/2+rise+3]],'#edddab',2);}
      }else if(obj.type==='orb'){
        ellipse(c,q.x,q.y,.85*s,.45*s,a.team?'#bf8b80':'#7fabb6');round(c,q.x-.45*s,q.y-.3*s,.9*s,.4*s,3,'#9caa95');const yy=q.y-.78*s+Math.sin(time*2)*2;poly(c,[[q.x,yy-.6*s],[q.x+.44*s,yy],[q.x,yy+.5*s],[q.x-.44*s,yy]],a.team?'#d5a397':'#a1c3cd');poly(c,[[q.x,yy-.6*s],[q.x,yy+.5*s],[q.x-.44*s,yy]],a.team?'#ba817b':'#7d9eaf');star(c,q.x+.13*s,yy-.14*s,.13*s,'#f9efd8');round(c,q.x-.7*s,q.y-1.65*s,1.4*s,4,2,'#4b625580');round(c,q.x-.7*s,q.y-1.65*s,1.4*s*a.hp/a.maxHp,4,2,a.team?'#dba495':'#a1c9d0');
      }else{
        const old=this.positions.get(a.id)||{x:a.x,y:a.y};const distance=Math.hypot(a.x-old.x,a.y-old.y);const factor=distance>3?1:Math.min(1,dt*17);const px=old.x+(a.x-old.x)*factor,py=old.y+(a.y-old.y)*factor;this.positions.set(a.id,{x:px,y:py});const pp=p(px,py),self=a.id===myId;let attacking=g.events.some(e=>e.type==='attack'&&e.owner===a.id&&g.elapsed-e.time<.2);
        if(a.shield>0){ellipse(c,pp.x,pp.y-.35*s,.65*s,.75*s,'#e0eff536');c.strokeStyle='#eefaff88';c.lineWidth=1.5;c.beginPath();c.ellipse(pp.x,pp.y-.35*s,.65*s,.75*s,0,0,Math.PI*2);c.stroke();}
        const recentAttack=[...g.events].reverse().find(e=>e.type==='attack'&&e.owner===a.id&&g.elapsed-e.time<.38);
        const attackPhase=recentAttack?1-(g.elapsed-recentAttack.time)/.38:0;
        drawHero(c,a.hero,pp.x,pp.y,1.44*s,{time,walk:Math.min(1,distance*18),face:Math.cos(a.angle)>=0?1:-1,team:a.team,attack:attackPhase,hit:Math.max(0,1-(g.elapsed-(a.lastHitAt??-100))*5),death:a.hp<=0?(5-a.respawn)/.45:0,spawn:a.shield>1.6?(a.shield-1.6)/.4:0});
        if(a.hp<=0)continue;
        round(c,pp.x-.6*s,pp.y-1.62*s,1.2*s,6,2,'#172232dd');round(c,pp.x-.6*s+1,pp.y-1.62*s+1,(1.2*s-2)*Math.max(0,a.hp/a.maxHp),4,1,self?'#aade66':a.team===0?'#6ed3f2':'#ee9278');c.font=`bold ${Math.max(9,s*.25)}px Trebuchet MS`;c.textAlign='center';c.fillStyle='#f7f7e9';c.strokeStyle='#253140';c.lineWidth=3;c.strokeText(self?'TÚ':a.name,pp.x,pp.y-1.77*s);c.fillText(self?'TÚ':a.name,pp.x,pp.y-1.77*s);
        if(self){poly(c,[[pp.x-4,pp.y+11],[pp.x+4,pp.y+11],[pp.x,pp.y+6]],'#fff5cb');}
        if(a.carrying){line(c,[[pp.x+.45*s,pp.y],[pp.x+.45*s,pp.y-1.1*s]],'#ede4c7',2);poly(c,[[pp.x+.45*s,pp.y-1.1*s],[pp.x+.95*s,pp.y-.95*s],[pp.x+.45*s,pp.y-.72*s]],'#e6c781');}
      }
    }
    for(const f of g.flags.filter(f=>!f.carrier)){const q=p(f.x,f.y);ellipse(c,q.x,q.y,.35*s,.15*s,'#665d3e26');line(c,[[q.x,q.y],[q.x,q.y-.9*s]],'#796e50',2.5);poly(c,[[q.x,q.y-.9*s],[q.x+.5*s,q.y-.7*s],[q.x,q.y-.48*s]],'#ecce8a');star(c,q.x+.13*s,q.y-.72*s,.08*s,'#faf2d3');}
    this.effects.drawProjectiles(c,g,p,s,time);this.effects.drawParticles(c,p,s);
    for(const e of g.events){const age=g.elapsed-e.time;if(age<0||age>.7)continue;const q=p(e.x,e.y);c.save();c.globalAlpha=1-age/.7;if(e.type==='damage'){c.font=`bold ${Math.max(10,s*.43)}px Trebuchet MS`;c.textAlign='center';c.fillStyle='#fff0c7';c.strokeStyle='#695447';c.lineWidth=2;c.strokeText(`−${Number(e.value.toFixed(1))}`,q.x,q.y-s*(1+age));c.fillText(`−${Number(e.value.toFixed(1))}`,q.x,q.y-s*(1+age));}else if(['explosion','death','respawn','pulse'].includes(e.type)){c.strokeStyle=e.type==='respawn'?'#e5f5df':'#f0ce9a';c.lineWidth=3;c.beginPath();c.ellipse(q.x,q.y,(.2+age*(e.r||1)*2)*s,(.2+age*(e.r||1)*2)*s*.76,0,0,Math.PI*2);c.stroke();}else if(e.type==='attack'&&!e.ultimate&&['knight','ogre','bull'].includes(e.hero)&&age<.25){c.translate(q.x,q.y);c.scale(1,.76);c.rotate(e.angle);c.strokeStyle='#fff3d6';c.lineWidth=4;c.beginPath();c.arc(0,0,.9*s,-.9,.9);c.stroke();}c.restore();}
    c.restore();
    ambientDetails(c,g.map,p,s,time);
    c.fillStyle='#f5f1dc9c';c.font='9px Trebuchet MS';c.textAlign='left';c.fillText(g.map.name,tl.x+9,br.y+25);
  }
}
