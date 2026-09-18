import {HEROES} from './shared/config.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export class Controls{
  constructor({canvas,renderer,getGame,getPlayer,isActive,unlock}){
    Object.assign(this,{canvas,renderer,getGame,getPlayer,isActive,unlock});this.keys=new Set();this.mx=0;this.my=0;this.angle=0;this.attack=false;this.ult=false;this.aim=null;this.pointerAim=false;
    const joy=document.querySelector('#joystick'),knob=document.querySelector('#joystick-knob');let joyId=null;
    const resetJoy=()=>{joyId=null;this.mx=0;this.my=0;knob.style.transform='';};this.resetJoy=resetJoy;
    joy.addEventListener('pointerdown',e=>{if(joyId!==null)return;this.unlock();joyId=e.pointerId;joy.setPointerCapture(e.pointerId);e.preventDefault();moveJoy(e);});
    const moveJoy=e=>{if(e.pointerId!==joyId)return;const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y),max=r.width*.33;this.mx=x/Math.max(max,len);this.my=y/Math.max(max,len);knob.style.transform=`translate(${this.mx*max}px,${this.my*max}px)`;};
    joy.addEventListener('pointermove',moveJoy);joy.addEventListener('pointerup',resetJoy);joy.addEventListener('pointercancel',resetJoy);
    this.bindAttack(document.querySelector('#attack-control'),false);this.bindAttack(document.querySelector('#ult-control'),true);
    canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!this.isActive())return;const p=this.getPlayer();if(!p)return;const r=canvas.getBoundingClientRect(),q=renderer.screenToWorld(e.clientX-r.left,e.clientY-r.top);this.angle=Math.atan2(q.y-p.y,q.x-p.x);this.pointerAim=true;});
    canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||!this.isActive())return;this.unlock();canvas.setPointerCapture(e.pointerId);this.attack=true;e.preventDefault();});
    canvas.addEventListener('pointerup',()=>this.attack=false);canvas.addEventListener('pointercancel',()=>this.attack=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('keydown',e=>{if(!this.isActive()||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();this.keys.add(e.code);if(e.code==='Space'&&!e.repeat){this.unlock();if(!this.pointerAim)this.autoAim(true);this.ult=true;}}});
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);});window.addEventListener('blur',()=>this.reset());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
  }
  bindAttack(button,ultimate){let id=null,start=null;const stop=()=>{id=null;start=null;this.aim=null;button.classList.remove('aiming');};
    button.addEventListener('pointerdown',e=>{if(!this.isActive()||id!==null)return;e.preventDefault();this.unlock();id=e.pointerId;start={x:e.clientX,y:e.clientY};button.setPointerCapture(id);button.classList.add('aiming');this.autoAim(ultimate);this.aim={angle:this.angle,range:this.range(ultimate),cancel:false};});
    button.addEventListener('pointermove',e=>{if(id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,len=Math.hypot(dx,dy);if(len>10){this.angle=Math.atan2(dy/.76,dx);this.aim={angle:this.angle,range:this.range(ultimate),cancel:len>170};button.style.opacity=len>170?'.3':'';}});
    button.addEventListener('pointerup',e=>{if(id!==e.pointerId)return;if(!this.aim?.cancel){if(ultimate)this.ult=true;else this.tapAttack=true;}button.style.opacity='';stop();});
    button.addEventListener('pointercancel',()=>{button.style.opacity='';stop();});
  }
  range(ultimate){const p=this.getPlayer();return ultimate?({knight:8,ogre:5,warlock:8,jester:3,bull:3,prince:3}[p?.hero]||3):(HEROES[p?.hero]?.range||1.5);}
  autoAim(ultimate=false){const g=this.getGame(),p=this.getPlayer();if(!g||!p)return;const range=this.range(ultimate),candidates=g.players.filter(v=>v.team!==p.team&&v.hp>0&&Math.hypot(v.x-p.x,v.y-p.y)<=range+.3);if(!candidates.length&&g.mode==='orb')candidates.push(...g.orbs.filter(v=>v.team!==p.team&&v.hp>0&&Math.hypot(v.x-p.x,v.y-p.y)<=range+.7));const target=candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(target)this.angle=Math.atan2(target.y-p.y,target.x-p.x);}
  sample(){let mx=this.mx,my=this.my;mx+=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0);my+=(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0);const n=Math.max(1,Math.hypot(mx,my));if(!this.pointerAim&&!this.aim&&(Math.abs(mx)+Math.abs(my)>.1)&&!this.tapAttack&&!this.ult)this.angle=Math.atan2(my,mx);const out={mx:clamp(mx/n,-1,1),my:clamp(my/n,-1,1),angle:this.angle,attack:this.attack||!!this.tapAttack,ult:this.ult};this.tapAttack=false;this.ult=false;return out;}
  reset(){this.keys.clear();this.resetJoy();this.attack=false;this.tapAttack=false;this.ult=false;this.aim=null;this.pointerAim=false;}
}
