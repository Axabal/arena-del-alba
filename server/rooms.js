import { randomBytes, randomInt } from 'node:crypto';

const HERO_IDS=['knight','ogre','warlock','jester','bull','prince'];
const MODE_IDS=['deathmatch','flags','orb'];
const cleanName=v=>String(v||'Aventurero').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,18)||'Aventurero';
const fail=message=>{throw new Error(message);};

export class RoomManager {
  constructor({now=()=>Date.now()}={}){this.now=now;this.rooms=new Map();this.sessions=new Map();}
  connect(token){
    const old=typeof token==='string'?this.sessions.get(token):null;
    if(old&&(old.connected||this.now()-old.disconnectedAt<60000)){
      old.connected=true;old.disconnectedAt=null;
      const room=this.rooms.get(old.roomCode), member=room?.members.find(p=>p.id===old.id);
      if(member){member.connected=true;member.bot=false;const player=room.game?.players.find(p=>p.id===old.id);if(player)player.bot=false;}
      else old.roomCode=null;
      return old;
    }
    const s={id:randomBytes(8).toString('hex'),token:randomBytes(24).toString('hex'),connected:true,roomCode:null,disconnectedAt:null};
    this.sessions.set(s.token,s);return s;
  }
  room(s){return this.rooms.get(s.roomCode)||fail('No estás en una sala.');}
  member(s){return this.room(s).members.find(p=>p.id===s.id)||fail('Jugador no encontrado.');}
  create(s,name,mode){
    if(!MODE_IDS.includes(mode))fail('Modo de juego no válido.');
    if(this.rooms.size>=200)fail('El servidor está lleno. Inténtalo más tarde.');
    this.leave(s);let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(this.rooms.has(code));
    const r={code,mode,hostId:s.id,phase:'lobby',mapId:null,members:[],created:this.now(),touched:this.now(),game:null,inputs:{}};
    this.rooms.set(code,r);this.join(s,code,name);return r;
  }
  join(s,code,name){
    code=String(code||'').trim().toUpperCase();const r=this.rooms.get(code);
    if(!r)fail('No encontramos esa sala. Comprueba el código.');
    if(r.phase!=='lobby')fail('La partida ya ha empezado.');
    if(s.roomCode===code)return r;
    if(r.members.length>=6)fail('La sala está completa.');
    this.leave(s);const counts=[0,1].map(t=>r.members.filter(p=>p.team===t).length),team=counts[0]<=counts[1]?0:1;
    const hero=HERO_IDS.find(h=>!r.members.some(p=>p.team===team&&p.hero===h));
    r.members.push({id:s.id,name:cleanName(name),team,hero,ready:false,bot:false,connected:true,loaded:false});s.roomCode=code;r.touched=this.now();return r;
  }
  choose(s,{team,hero}={}){
    const r=this.room(s),p=this.member(s);if(r.phase!=='lobby')fail('La selección está cerrada.');
    if(![0,1].includes(team)||!HERO_IDS.includes(hero))fail('Equipo o héroe no válido.');
    if(r.members.filter(m=>m.id!==p.id&&m.team===team).length>=3)fail('Ese equipo está completo.');
    if(r.members.some(m=>m.id!==p.id&&m.team===team&&m.hero===hero))fail('Ese héroe ya está elegido en tu equipo.');
    p.team=team;p.hero=hero;p.ready=false;r.touched=this.now();return r;
  }
  ready(s,value){const r=this.room(s);if(r.phase!=='lobby')fail('La partida ya ha empezado.');this.member(s).ready=value===true;return r;}
  mode(s,mode){const r=this.room(s);if(r.hostId!==s.id)fail('Solo el anfitrión puede cambiar el modo.');if(r.phase!=='lobby'||!MODE_IDS.includes(mode))fail('Modo no válido.');r.mode=mode;for(const p of r.members)p.ready=p.bot;return r;}
  start(s){
    const r=this.room(s);if(r.hostId!==s.id)fail('Solo el anfitrión puede iniciar.');if(r.phase!=='lobby')fail('La partida ya ha empezado.');
    if(r.members.some(p=>!p.bot&&!p.ready))fail('Todos los jugadores deben estar listos.');
    for(const team of [0,1])while(r.members.filter(p=>p.team===team).length<3){
      const choices=HERO_IDS.filter(h=>!r.members.some(p=>p.team===team&&p.hero===h));
      const hero=choices[randomInt(choices.length)];r.members.push({id:`bot-${randomBytes(4).toString('hex')}`,name:['Musgo','Bruma','Trébol','Nube','Duna','Coco'][r.members.length],team,hero,bot:true,ready:true,loaded:true,connected:false});
    }
    r.mapId=['meadow','graveyard','beach'][randomInt(3)];r.phase='loading';r.loadDeadline=this.now()+15000;r.touched=this.now();return r;
  }
  loaded(s){const r=this.room(s);if(r.phase==='loading')this.member(s).loaded=true;return r;}
  back(s){
    const r=this.room(s);if(r.hostId!==s.id)fail('Solo el anfitrión puede volver a la sala.');if(r.phase!=='finished')fail('La partida aún no ha terminado.');
    r.phase='lobby';r.game=null;r.inputs={};r.members=r.members.filter(p=>!p.bot&&p.connected);
    for(const session of this.sessions.values())if(session.roomCode===r.code&&!r.members.some(p=>p.id===session.id))session.roomCode=null;
    for(const p of r.members){p.ready=false;p.loaded=false;}return r;
  }
  disconnect(s){
    s.connected=false;s.disconnectedAt=this.now();const r=this.rooms.get(s.roomCode);if(!r)return;r.touched=this.now();
    const p=r.members.find(p=>p.id===s.id);if(p){p.connected=false;p.bot=true;p.ready=true;}
    const gp=r.game?.players.find(p=>p.id===s.id);if(gp)gp.bot=true;delete r.inputs[s.id];
    if(r.hostId===s.id)r.hostId=r.members.find(p=>p.connected)?.id||null;
  }
  leave(s){
    const r=this.rooms.get(s.roomCode);if(!r)return;
    if(r.phase==='lobby'){r.members=r.members.filter(p=>p.id!==s.id);}else{const p=r.members.find(p=>p.id===s.id);if(p){p.bot=true;p.connected=false;}const gp=r.game?.players.find(p=>p.id===s.id);if(gp)gp.bot=true;delete r.inputs[s.id];}
    if(r.hostId===s.id)r.hostId=r.members.find(p=>p.connected)?.id||null;
    s.roomCode=null;r.touched=this.now();if(!r.members.some(p=>p.connected))this.rooms.delete(r.code);
  }
  cleanup(){
    const now=this.now();for(const [token,s]of this.sessions)if(!s.connected&&now-s.disconnectedAt>=60000){const r=this.rooms.get(s.roomCode);if(r?.phase==='lobby')r.members=r.members.filter(p=>p.id!==s.id);this.sessions.delete(token);}
    for(const [code,r]of this.rooms){if(!r.members.some(p=>p.connected)&&now-r.touched>65000)this.rooms.delete(code);}
  }
  publicRoom(r){return {code:r.code,mode:r.mode,hostId:r.hostId,phase:r.phase,mapId:r.mapId,members:r.members.map(({id,name,team,hero,ready,bot,connected})=>({id,name,team,hero,ready,bot,connected}))};}
}
