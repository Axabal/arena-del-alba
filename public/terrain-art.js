import {imageResource} from './image-resource.js';
const resource=imageResource('/assets/terrain-atlas-v2.png','No se pudieron cargar las texturas. Vuelve a intentarlo.');
const art=resource.image;let ready=false;
export function loadTerrain(){return resource.load().then(()=>{ready=true;});}
export const terrainReady=loadTerrain();terrainReady.catch(()=>{});
const col=id=>id==='graveyard'?1:id==='beach'?2:0;
function crop(row,column){const s=art.width/3,pad=row===0?23:7;return [column*s+pad,row*s+pad,s-pad*2,s-pad*2];}
export function groundArt(c,map,project,scale){
  if(!ready)return false;const src=crop(0,col(map.id));
  c.save();c.globalAlpha=map.id==='graveyard'?.77:.7;
  for(let y=0;y<18;y+=6)for(let x=0;x<28;x+=7){const q=project(x,y),w=7*scale,h=6*scale*.76;c.save();c.translate(q.x+(x/7%2?w:0),q.y+(y/6%2?h:0));c.scale(x/7%2?-1:1,y/6%2?-1:1);c.drawImage(art,...src,0,0,w,h);c.restore();}
  c.restore();return true;
}
export function bushArt(c,map,b,project,scale,time){
  if(!ready)return false;const q=project(b.x,b.y),src=crop(2,col(map.id)),w=b.w*scale*1.1,h=b.h*scale*.76;
  c.save();c.translate(q.x,q.y);c.rotate(Math.sin(time*1.3+b.x)*.014);c.drawImage(art,...src,-w/2,-h*.76,w,h*1.1);c.restore();return true;
}
export function obstacleArt(c,map,a,project,scale,time){
  if(!ready)return false;const src=crop(1,col(map.id)),cols=Math.ceil(a.w/1.5),rows=Math.ceil(a.h/1.8),cw=a.w/cols,ch=a.h/rows;
  for(let row=0;row<rows;row++)for(let i=0;i<cols;i++){
    const q=project(a.x-a.w/2+cw*(i+.5),a.y-a.h/2+ch*(row+.5)),w=(cw+.24)*scale,h=(ch*.76+.6)*scale;
    c.fillStyle='#14223155';c.beginPath();c.ellipse(q.x+scale*.06,q.y+ch*scale*.3,w*.52,scale*.22,0,0,Math.PI*2);c.fill();
    c.drawImage(art,...src,q.x-w/2,q.y-h+ch*scale*.4,w,h);
  }
  const q=project(a.x,a.y+a.h/2);
  if(a.permanent){c.fillStyle='#23304cb3';c.beginPath();c.arc(q.x,q.y+2,4,0,Math.PI*2);c.fill();c.fillStyle='#d6d8dc';c.font='7px sans-serif';c.textAlign='center';c.fillText('◆',q.x,q.y+4);}
  else if(a.hp<a.maxHp){c.fillStyle='#162237bb';c.fillRect(q.x-a.w*scale/2,q.y+4,a.w*scale,4);c.fillStyle='#e9bf78';c.fillRect(q.x-a.w*scale/2,q.y+4,a.w*scale*a.hp/a.maxHp,3);}
  return true;
}
export function ambientDetails(c,map,project,s,time){
  const left=project(0,0),right=project(28,18);
  c.save();
  if(map.id==='beach'){
    c.strokeStyle='#b5eeea80';c.lineWidth=2;
    for(let j=0;j<3;j++){c.beginPath();for(let x=left.x-20;x<right.x+20;x+=10){const y=right.y+12+j*11+Math.sin(x*.03-time*1.7+j)*4;x===left.x-20?c.moveTo(x,y):c.lineTo(x,y);}c.stroke();}
  }else{
    for(const xx of [1,9,19,27]){const q=project(xx,.3);const r=s*.44,g=c.createRadialGradient(q.x,q.y,0,q.x,q.y,r*3);g.addColorStop(0,'#ffb85030');g.addColorStop(1,'#ffa03700');c.fillStyle=g;c.fillRect(q.x-r*3,q.y-r*3,r*6,r*6);c.fillStyle='#554c51';c.fillRect(q.x-4,q.y-5,8,11);for(let k=0;k<3;k++){c.fillStyle=['#d96523','#ffc253','#fff2b9'][k];c.beginPath();c.moveTo(q.x-6+k,q.y-4);c.quadraticCurveTo(q.x-5,q.y-15,q.x+Math.sin(time*12+xx)*4,q.y-22+k*4);c.quadraticCurveTo(q.x+8-k,q.y-13,q.x+6-k,q.y-4);c.fill();}}
  }
  const vignette=c.createRadialGradient((left.x+right.x)/2,(left.y+right.y)/2,s*7,(left.x+right.x)/2,(left.y+right.y)/2,s*17);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,map.id==='graveyard'?'#11132a88':'#16243b35');c.fillStyle=vignette;c.fillRect(left.x,left.y,right.x-left.x,right.y-left.y);c.restore();
}
