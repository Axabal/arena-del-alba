const TAU=Math.PI*2;
const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function glow(c,x,y,r,inner,outer='transparent'){
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
}
export class Effects {
  constructor(){this.particles=[];this.seen=0;this.lastTick=0;this.trails=new Map();this.shake=0;}
  reset(){this.particles=[];this.seen=0;this.trails.clear();this.shake=0;this.lastTick=0;}
  emit(x,y,count,color,kind='spark',power=1,seed=0){
    for(let i=0;i<count;i++){const a=rand(seed+i*3)*TAU,speed=(.3+rand(seed+i*3+1)*2.3)*power;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:0,life:.25+rand(seed+i+30)*.65,color,kind,size:.025+rand(seed+i+50)*.065});}
    if(this.particles.length>360)this.particles.splice(0,this.particles.length-360);
  }
  update(g,dt,low=false){
    if(g.tick<this.lastTick)this.reset();this.lastTick=g.tick;
    for(const e of g.events){if(e.id<=this.seen)continue;this.seen=Math.max(this.seen,e.id);if(g.elapsed-e.time>.35)continue;
      if(e.type==='damage')this.emit(e.x,e.y,low?3:8,'#ffe2a2','spark',.6,e.id);
      if(e.type==='death'){this.emit(e.x,e.y,low?8:24,'#dac8a7','dust',1,e.id);this.shake=.1;}
      if(e.type==='explosion'){this.emit(e.x,e.y,low?12:38,'#ffae43','fire',1.9,e.id);this.emit(e.x,e.y,low?5:15,'#7c6963','smoke',1.3,e.id+10);this.shake=.22;}
      if(e.type==='respawn')this.emit(e.x,e.y,low?8:25,'#a4efff','magic',1,e.id);
      if(e.type==='attack'&&e.ultimate){this.emit(e.x,e.y,low?6:17,'#c6a7ff','magic',.9,e.id);this.shake=.07;}
    }
    for(const shot of g.projectiles){let trail=this.trails.get(shot.id);if(!trail){trail=[];this.trails.set(shot.id,trail);}trail.push({x:shot.x,y:shot.y});if(trail.length>(low?5:12))trail.shift();}
    const ids=new Set(g.projectiles.map(s=>s.id));for(const id of this.trails.keys())if(!ids.has(id))this.trails.delete(id);
    for(const p of this.particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.kind==='dust'||p.kind==='smoke'){p.vx*=.98;p.vy-=dt*.4;}else p.vy+=dt*.7;}
    this.particles=this.particles.filter(p=>p.age<p.life);this.shake=Math.max(0,this.shake-dt);
  }
  drawProjectiles(c,g,project,s,time){
    c.save();
    for(const shot of g.projectiles){const q=project(shot.x,shot.y),angle=Math.atan2(shot.vy*.76,shot.vx),trail=this.trails.get(shot.id)||[],magical=['magic','drain'].includes(shot.kind),royal=shot.kind==='royal';
      if(trail.length>1){c.save();c.globalCompositeOperation='lighter';c.lineCap='round';for(let i=1;i<trail.length;i++){const a=project(trail[i-1].x,trail[i-1].y),b=project(trail[i].x,trail[i].y);c.strokeStyle=magical?`rgba(183,75,255,${i/trail.length*.6})`:royal?`rgba(255,154,48,${i/trail.length*.55})`:`rgba(174,233,255,${i/trail.length*.35})`;c.lineWidth=(i/trail.length)*s*.2;c.beginPath();c.moveTo(a.x,a.y-s*.2);c.lineTo(b.x,b.y-s*.2);c.stroke();}c.restore();}
      c.save();c.translate(q.x,q.y-s*.2);c.rotate(angle);
      if(magical||royal){
        c.globalCompositeOperation='lighter';glow(c,0,0,s*.62,magical?'#973cff99':'#ff861d99');
        for(let i=0;i<5;i++){const wobble=Math.sin(time*23+i*1.7+shot.x)*.07*s,tail=-(.35+.08*i)*s;c.fillStyle=magical?['#57198c','#8b28cf','#d562ff','#ffc8ff','#ffffff'][i]:['#ae331c','#ec681d','#ffa52f','#ffe69c','#fffcec'][i];c.beginPath();c.moveTo(.2*s,0);c.quadraticCurveTo(-.04*s,-(.18-i*.025)*s,tail,wobble-.08*s);c.quadraticCurveTo(-.2*s,wobble,.02*s,(.18-i*.025)*s);c.quadraticCurveTo(.3*s,.06*s,.2*s,0);c.fill();}
        for(let i=0;i<4;i++){const seed=shot.x*19+i,px=-(.15+rand(seed)*.6)*s,py=(rand(seed+3)-.5)*.5*s;glow(c,px,py,s*.07,'#ffd39e');}
        if(shot.kind==='drain'){c.strokeStyle='#d4ffdc';c.lineWidth=1.5;c.beginPath();for(let j=0;j<12;j++){const x=-j*s*.04,y=Math.sin(j*1.3+time*30)*s*.13;j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
      }else if(shot.kind==='wave'){
        c.globalCompositeOperation='lighter';for(let k=0;k<3;k++){c.strokeStyle=['#67c9ff66','#96eaffaa','#fff8d9'][k];c.lineWidth=(7-k*2);c.beginPath();c.arc(-s*.3,0,s*(.65-k*.06),-1.25,1.25);c.stroke();}for(let i=0;i<5;i++){c.strokeStyle='#d1ffffbb';c.lineWidth=1;c.beginPath();c.moveTo(-s*.2,-s*.4+i*s*.2);c.lineTo(-s*(.5+rand(i+time)*.4),-s*.4+i*s*.2);c.stroke();}
      }else if(shot.kind==='jester'){
        c.rotate(time*12);glow(c,0,0,s*.35,'#ffb76466');c.fillStyle='#605069';c.strokeStyle='#261e37';c.lineWidth=1.8;c.beginPath();c.arc(0,0,s*.17,0,TAU);c.fill();c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5;c.fillStyle='#e9c57c';c.beginPath();c.moveTo(Math.cos(a-.3)*s*.13,Math.sin(a-.3)*s*.13);c.lineTo(Math.cos(a)*s*.25,Math.sin(a)*s*.25);c.lineTo(Math.cos(a+.3)*s*.13,Math.sin(a+.3)*s*.13);c.fill();}
      }else {c.strokeStyle='#ede2bd';c.lineWidth=2;c.beginPath();c.moveTo(-.45*s,0);c.lineTo(.2*s,0);c.stroke();c.fillStyle='#d9f5fa';c.beginPath();c.moveTo(.35*s,0);c.lineTo(.1*s,-.11*s);c.lineTo(.1*s,.11*s);c.fill();c.strokeStyle='#97c3e9';c.beginPath();c.moveTo(-.3*s,0);c.lineTo(-.44*s,-.13*s);c.moveTo(-.3*s,0);c.lineTo(-.44*s,.13*s);c.stroke();}
      c.restore();
    }c.restore();
  }
  drawParticles(c,project,s){c.save();for(const p of this.particles){const q=project(p.x,p.y),t=p.age/p.life;c.globalAlpha=(1-t)*.85;if(p.kind==='smoke'||p.kind==='dust'){c.globalCompositeOperation='source-over';c.fillStyle=p.color;c.beginPath();c.ellipse(q.x,q.y-(p.kind==='smoke'?t*s*.7:0),(p.size+t*.16)*s,(p.size+t*.09)*s,0,0,TAU);c.fill();}else{c.globalCompositeOperation='lighter';glow(c,q.x,q.y,p.size*s*2,p.color);c.fillStyle='#fff4ca';c.fillRect(q.x,q.y,Math.max(1,p.size*s*.6),Math.max(1,p.size*s*.6));}}c.restore();}
  drawZones(c,g,project,s,time,low=false){c.save();for(const z of g.zones){const q=project(z.x,z.y);if(z.kind==='poison'){const n=low?6:17;for(let i=0;i<n;i++){const a=i*2.399+time*.3,r=z.r*s*Math.sqrt((i+.5)/n);c.globalAlpha=.13+.13*Math.sin(time*2+i)**2;glow(c,q.x+Math.cos(a)*r,q.y+Math.sin(a)*r*.76-s*.2*Math.sin(time+i),s*.7,'#b4df66');}c.globalAlpha=.6;c.strokeStyle='#d1e891';c.lineWidth=1.5;for(let i=0;i<6;i++){const a=i*1.047+time*.3;c.beginPath();c.arc(q.x+Math.cos(a)*z.r*s*.6,q.y+Math.sin(a)*z.r*s*.4,3+Math.sin(time*5+i)*2,0,TAU);c.stroke();}}else{glow(c,q.x,q.y,z.r*s,'#ef872033');for(let i=0;i<8;i++){const a=i*TAU/8+time*2;c.strokeStyle='#ffe9a4';c.lineWidth=2;c.beginPath();c.moveTo(q.x+Math.cos(a)*z.r*s*.9,q.y+Math.sin(a)*z.r*s*.76*.9);c.lineTo(q.x+Math.cos(a)*z.r*s,q.y+Math.sin(a)*z.r*s*.76);c.stroke();}}}c.restore();}
}
