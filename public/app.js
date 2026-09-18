import {GAME_SERVER_URL} from './runtime-config.js';
import {websocketAddress} from './connection.js';
import {HEROES,MODES} from './shared/config.js';
import {MAPS} from './shared/maps.js';
import {createGame,stepGame,snapshotFor} from './shared/engine.js';
import {drawHome,portrait,ArenaRenderer,rigReady} from './renderer.js';
import {Controls} from './controls.js';
import {GameAudio} from './audio.js';
import {prepareAssets} from './assets.js';
import {mountPresentation,loadingInfo,loadingProgress,loadingCountdown,battleIntro,resultStyle,drawResults} from './presentation.js';
mountPresentation();

const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const symbols={deathmatch:'⚔',flags:'⚑',orb:'◈'};
const names={deathmatch:'Combate 3 contra 3',flags:'Recoger banderas',orb:'Destruir el orbe'};
const explanations={deathmatch:'Cada eliminación suma un punto. Al terminar los tres minutos, gana el equipo con más puntos. En caso de empate, la siguiente eliminación decide.',flags:'Recoge las banderas que aparecen en el centro y llévalas a tu portal. Si caes, la bandera queda en el suelo. Gana el equipo con más entregas.',orb:'Protege tu orbe y destruye el del equipo rival. Si ambos resisten, gana el equipo cuyo orbe conserve más vida.'};
let screen='home',online=false,mode='deathmatch',room=null,myId='local',networkId=null,localGame=null,viewGame=null,ws=null,connectPromise=null,countdown=0,lastNetworkAt=0,lastPing=0,autoReconnect=true,resultsShown=false;
let loadingFor=null,loadEpoch=0,assetsLoaded=false;
let settings={sound:true,invert:true,low:false,controlsVersion:2};try{const saved=JSON.parse(localStorage.getItem('alba-settings')||'{}');settings={...settings,...saved,invert:saved.controlsVersion===2?saved.invert!==false:true,controlsVersion:2};$('nickname').value=localStorage.getItem('alba-name')||'Aventurero';}catch{}
const audio=new GameAudio();audio.enabled=settings.sound;const renderer=new ArenaRenderer($('game-canvas'));renderer.low=settings.low;
const me=()=>viewGame?.players.find(p=>p.id===myId);
const controls=new Controls({canvas:$('game-canvas'),renderer,getGame:()=>viewGame,getPlayer:me,isActive:()=>screen==='match'&&countdown<=0,unlock:()=>audio.unlock()});
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500);}
function show(next){screen=next;for(const id of ['home','setup','lobby','loading','match','results'])$(id).classList.toggle('hidden',id!==next);document.body.classList.toggle('in-match',next==='match'||next==='loading');$('match').classList.toggle('inverted',settings.invert);if(next!=='match')controls.reset();window.scrollTo(0,0);}
async function beginLoading(mapId,isNetwork=false){
  const epoch=++loadEpoch;assetsLoaded=false;loadingFor=isNetwork?room?.code:'local';loadingInfo(MAPS.find(m=>m.id===mapId)?.name||'Preparando la arena',names[mode]);show('loading');
  try{await prepareAssets((progress,label)=>{if(epoch===loadEpoch)loadingProgress(progress,label);});if(epoch!==loadEpoch)return;assetsLoaded=true;loadingProgress(1,isNetwork?'Esperando al resto del equipo…':'La arena está lista');if(isNetwork)send({type:'loaded'});}
  catch(error){if(epoch!==loadEpoch)return;loadingFor=null;assetsLoaded=false;toast(error.message);if(isNetwork){leave();}else{localGame=null;viewGame=null;show('lobby');renderLobby();}}

}
function enterMatch(){loadingFor=null;resultsShown=false;audio.lastEvent=0;renderer.effects.reset();controls.reset();controls.angle=me()?.team?Math.PI:0;show('match');battleIntro();}
function dialog(content){$('dialog-content').innerHTML=content;$('info-dialog').showModal();}
function howTo(){dialog(`<span class="eyebrow">BIENVENIDO A LA ARENA</span><h2>Fácil de empezar.<br>Difícil de soltar.</h2><h3>En el móvil</h3><p>Mueve el joystick de la <b>${settings.invert?'izquierda':'derecha'}</b>. A la ${settings.invert?'derecha':'izquierda'}, toca un ataque para apuntar automáticamente o arrastra desde él para apuntar tú. Suelta para disparar; arrastra más de 170 píxeles para cancelar. Puedes mover y atacar a la vez.</p><h3>En el ordenador</h3><p><b>WASD o flechas</b> para moverte, ratón para apuntar, <b>clic</b> para atacar y <b>espacio</b> para la ulti.</p><h3>Tu equipo cuenta contigo</h3><p>Reapareces cinco segundos después de caer. Después de cinco segundos sin atacar ni recibir daño, recuperas un 8 % de tu vida máxima cada segundo. Las ultis se cargan al dañar héroes enemigos con ataques normales. Solo las ultis rompen coberturas. Los arbustos te ocultan hasta que ataques, recibas daño o un rival se acerque.</p><p class="notice">Partidas de 3 minutos. Si hay empate, hasta 90 segundos extra. El modo individual tiene cinco bots. En online, los huecos se completan con bots al iniciar.</p>`);}
function installation(){dialog(`<span class="eyebrow">TU ARENA DE BOLSILLO</span><h2>Un enlace. Y a jugar.</h2><h3>iPhone · Safari</h3><p>Abre el enlace en Safari. Pulsa <b>Compartir → Añadir a pantalla de inicio</b>. Activa «Abrir como app web» si aparece.</p><h3>Android · Chrome</h3><p>Abre el menú de Chrome y pulsa <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</p><p class="notice">El juego online necesita conexión. Para compartirlo fuera de este ordenador hay que publicar la web y el servidor con HTTPS. Una dirección «localhost» solo funciona en este ordenador.</p>`);}
function settingsDialog(){dialog(`<h2>A tu manera.</h2><label class="setting-row">Sonido<input id="setting-sound" type="checkbox" ${settings.sound?'checked':''}></label><label class="setting-row">Joystick a la izquierda<input id="setting-invert" type="checkbox" ${settings.invert?'checked':''}></label><label class="setting-row">Gráficos ligeros<input id="setting-low" type="checkbox" ${settings.low?'checked':''}></label><p class="notice">Por defecto, el joystick está a la izquierda y los ataques a la derecha. Los gráficos ligeros reducen detalles y resolución.</p>`);for(const key of ['sound','invert','low'])$(`setting-${key}`).onchange=e=>{settings[key]=e.target.checked;audio.enabled=settings.sound;renderer.low=settings.low;$('match').classList.toggle('inverted',settings.invert);try{localStorage.setItem('alba-settings',JSON.stringify(settings));}catch{}};}
$('help-button').onclick=howTo;$('settings-button').onclick=settingsDialog;$('install-button').onclick=installation;$('close-dialog').onclick=()=>$('info-dialog').close();$('info-dialog').onclick=e=>{if(e.target===$('info-dialog'))$('info-dialog').close();};
function renderModes(){
  $('mode-options').innerHTML=Object.keys(MODES).map(id=>`<button class="mode-option ${id===mode?'selected':''}" data-mode="${id}"><span class="symbol">${symbols[id]}</span><span><strong>${names[id]}</strong><small>${MODES[id].description}</small></span><i class="radio"></i></button>`).join('');
  for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>{mode=b.dataset.mode;renderModes();};
  $('mode-glyph').textContent=symbols[mode];$('mode-title').textContent=names[mode];$('mode-description').textContent=explanations[mode];
}
function setup(isOnline){audio.unlock();online=isOnline;show('setup');$('setup-eyebrow').textContent=online?'UNA SALA PARA TU GENTE':'AFINA TU PUNTERÍA';$('create-button').innerHTML=online?'Crear sala <b>→</b>':'Elegir héroe <b>→</b>';$('join-area').classList.toggle('hidden',!online);renderModes();}
$('solo-button').onclick=()=>setup(false);$('online-button').onclick=()=>setup(true);document.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>{mode=b.dataset.preview;setup(false);});
function saveName(){const name=$('nickname').value.trim().slice(0,18)||'Aventurero';try{localStorage.setItem('alba-name',name);}catch{}return name;}
function send(message){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(message));else if(message.type!=='input')toast('La conexión no está disponible.');}
async function connect(){
  autoReconnect=true;if(ws?.readyState===WebSocket.OPEN){myId=networkId;return;}if(connectPromise)return connectPromise;
  connectPromise=new Promise((resolve,reject)=>{
    let token='';try{token=sessionStorage.getItem('alba-token')||'';}catch{}
    if(GAME_SERVER_URL)toast('Conectando con la arena… El primer acceso puede tardar un minuto.');
    ws=new WebSocket(websocketAddress(GAME_SERVER_URL,location.href,token));const socket=ws;
    const timeout=setTimeout(()=>{socket.close();reject(new Error('No se pudo conectar al servidor.'));},GAME_SERVER_URL?75000:8000);
    socket.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}
      if(m.type==='hello'){clearTimeout(timeout);myId=m.id;networkId=m.id;try{sessionStorage.setItem('alba-token',m.token);}catch{}if(room&&online&&!m.roomCode){room=null;viewGame=null;localGame=null;show('home');toast('Tu reserva ha terminado. Puedes crear o unirte a otra sala.');}resolve();}
      else if(m.type==='room'){room=m.room;mode=room.mode;if(room.phase==='lobby'){show('lobby');renderLobby();}else if(room.phase==='loading'&&loadingFor!==room.code){loadingFor=room.code;beginLoading(room.mapId,true);}else if(room.phase==='finished'&&screen==='results'){updateRematch();}}
      else if(m.type==='state'){viewGame=m.game;lastNetworkAt=performance.now();countdown=m.countdown||0;if(viewGame.phase!=='finished'){if(!assetsLoaded){if(loadingFor!==room?.code)beginLoading(viewGame.map.id,true);}else if(countdown>0){if(screen!=='loading'){loadingInfo(viewGame.map.name,names[viewGame.mode]);show('loading');loadingProgress(1,'Equipos listos');}loadingCountdown(countdown);}else if(screen!=='match'){enterMatch();}}if(viewGame.phase==='finished'&&!resultsShown)showResults();}
      else if(m.type==='error')toast(m.message);
      else if(m.type==='left'){loadEpoch++;loadingFor=null;assetsLoaded=false;room=null;localGame=null;viewGame=null;resultsShown=false;show('home');}
      else if(m.type==='pong')lastPing=Math.round(performance.now()-m.sent);
    };
    socket.onerror=()=>{clearTimeout(timeout);reject(new Error('No se pudo conectar. Comprueba que el servidor está en marcha.'));};
    socket.onclose=e=>{clearTimeout(timeout);if(socket!==ws)return;connectPromise=null;loadingFor=null;if(e.code===4000){autoReconnect=false;toast('Esta sesión se ha abierto en otra pestaña.');show('home');return;}if(online&&room&&autoReconnect){toast('Reconectando… Un bot cubre tu plaza.');setTimeout(()=>connect().catch(()=>{}),1200);}reject(new Error('Conexión cerrada.'));};
  }).finally(()=>{connectPromise=null;});return connectPromise;
}
$('create-button').onclick=async()=>{const name=saveName();if(online){$('create-button').disabled=true;try{await connect();send({type:'create',name,mode});}catch(e){toast(e.message);}finally{$('create-button').disabled=false;}}else{myId='local';room={code:'LOCAL',mode,hostId:myId,phase:'lobby',members:[{id:myId,name,team:0,hero:'knight',ready:false,bot:false,connected:true}]};show('lobby');renderLobby();}};
$('join-button').onclick=async()=>{if(!$('room-code').value.trim()){toast('Introduce el código de seis caracteres.');return;}$('join-button').disabled=true;try{await connect();send({type:'join',code:$('room-code').value.trim(),name:saveName()});}catch(e){toast(e.message);}finally{$('join-button').disabled=false;}};
function choose(team,hero){if(online)send({type:'choose',team,hero});else{const p=room.members[0];p.team=team;p.hero=hero;p.ready=false;renderLobby();}}
function renderLobby(){
  if(!room)return;const self=room.members.find(p=>p.id===myId);if(!self)return;const isHost=room.hostId===myId;
  $('lobby-code').textContent=room.code;$('lobby-mode').textContent=`${names[room.mode]} · ${online?'SALA PRIVADA':'TÚ + CINCO BOTS'}`;
  $('teams').innerHTML=[0,1].map(team=>{const players=room.members.filter(p=>p.team===team);return `<div class="team-card ${team?'red':''}"><div class="team-header"><span>${team?'◆ EQUIPO CORAL':'✦ EQUIPO BRUMA'} · ${players.length}/3</span><button data-team="${team}" ${self.team===team?'disabled':''}>${self.team===team?'TU EQUIPO':'Unirme →'}</button></div><div class="team-slots">${Array.from({length:3},(_,i)=>{const p=players[i];return p?`<div class="player-slot ${p.id===myId?'self':''}"><strong>${esc(p.name)}${p.id===myId?' · TÚ':''}</strong><small>${esc(HEROES[p.hero].name)}</small><span class="ready-mark">${p.bot?'BOT · LISTO':p.ready?'✓ LISTO':'ELIGIENDO…'}</span></div>`:'<div class="player-slot empty"><strong>＋</strong><small>Plaza para un bot</small><span class="ready-mark">O UN AMIGO</span></div>';}).join('')}</div></div>`;}).join('');
  document.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{const team=Number(b.dataset.team),hero=Object.keys(HEROES).find(h=>!room.members.some(p=>p.id!==myId&&p.team===team&&p.hero===h));if(hero)choose(team,hero);});
  $('hero-roster').innerHTML=Object.values(HEROES).map(h=>{const taken=room.members.some(p=>p.team===self.team&&p.id!==myId&&p.hero===h.id);return `<button data-hero="${h.id}" class="hero-card ${self.hero===h.id?'selected':''}" ${taken?'disabled':''}>${taken?'<span class="picked">ELEGIDO</span>':self.hero===h.id?'<span class="picked">✓ TU HÉROE</span>':''}<canvas aria-hidden="true"></canvas><strong>${h.name}</strong><small>♥ ${h.hp} &nbsp; · &nbsp; ${h.speed>3.5?'ÁGIL':h.speed<3?'TANQUE':'EQUILIBRADO'}</small></button>`;}).join('');
  document.querySelectorAll('[data-hero]').forEach(b=>{portrait(b.querySelector('canvas'),b.dataset.hero);b.onclick=()=>choose(self.team,b.dataset.hero);});
  const h=HEROES[self.hero];$('hero-details').innerHTML=`<strong>${h.name}</strong> · ${h.description}<br><b>✦</b> ${h.ultimate}. Carga: ${h.charge} de daño.`;
  $('ready-button').textContent=self.ready?'✓ Estoy listo':'Estoy listo ✓';$('ready-button').classList.toggle('primary',self.ready);$('ready-button').disabled=room.phase!=='lobby';
  $('start-button').classList.toggle('hidden',!isHost);$('start-button').disabled=room.phase!=='lobby'||room.members.some(p=>!p.bot&&!p.ready);$('start-button').innerHTML=room.members.length<6?'Completar con bots y jugar <b>→</b>':'¡A la arena! <b>→</b>';
}
$('ready-button').onclick=()=>{const p=room.members.find(p=>p.id===myId);if(online)send({type:'ready',ready:!p.ready});else{p.ready=!p.ready;renderLobby();}};
$('start-button').onclick=()=>{audio.unlock();if(online)send({type:'start'});else startSolo();};
function startSolo(){const members=room.members.filter(p=>!p.bot);for(const team of [0,1])while(members.filter(p=>p.team===team).length<3){const free=Object.keys(HEROES).filter(h=>!members.some(p=>p.team===team&&p.hero===h));members.push({id:`bot${members.length}`,name:['Musgo','Bruma','Duna','Trébol','Coco','Nube'][members.length],hero:free[Math.floor(Math.random()*free.length)],team,bot:true});}const mapId=MAPS[Math.floor(Math.random()*MAPS.length)].id;localGame=createGame({mode:room.mode,mapId,players:members,seed:Date.now()%2147483647});viewGame=snapshotFor(localGame,members.find(p=>p.id===myId).team);countdown=3;resultsShown=false;audio.lastEvent=0;controls.reset();controls.angle=me()?.team?Math.PI:0;loadingFor='local';beginLoading(mapId,false);}
async function leave(){if(online&&ws?.readyState===WebSocket.OPEN&&room)send({type:'leave'});autoReconnect=false;loadEpoch++;loadingFor=null;assetsLoaded=false;room=null;localGame=null;viewGame=null;resultsShown=false;show('home');}
document.querySelectorAll('.back-home').forEach(b=>b.onclick=leave);$('leave-lobby').onclick=leave;$('cancel-loading').onclick=leave;
$('exit-match').onclick=()=>{controls.reset();dialog('<h2>¿Salir de la partida?</h2><p>En online, un bot ocupará tu lugar para que tus amigos puedan seguir jugando.</p><button class="button primary" id="confirm-leave">Salir de la arena →</button>');$('confirm-leave').onclick=()=>{$('info-dialog').close();leave();};};
$('invite-button').onclick=async()=>{if(!online){toast('Esta es una partida de práctica. Crea una sala online para invitar.');return;}const url=new URL(location.href);url.search='';url.searchParams.set('sala',room.code);try{await navigator.clipboard.writeText(url.href);toast('Enlace de invitación copiado.');}catch{dialog(`<h2>Invita a tu equipo.</h2><p>Código de sala: <b>${esc(room.code)}</b></p><input readonly value="${esc(url.href)}" aria-label="Enlace de invitación">`);}if(location.hostname==='localhost'||location.hostname==='127.0.0.1')toast('Enlace local copiado. Para amigos fuera de este ordenador hace falta publicar el servidor.');};
function showResults(){resultsShown=true;controls.reset();const p=me(),winner=viewGame.winner;$('result-title').textContent=winner===null?'Una batalla muy igualada.':winner===p?.team?'¡La victoria es vuestra!':'Esta vez no pudo ser.';$('result-subtitle').textContent=`${names[viewGame.mode]} · ${viewGame.map.name} · ${viewGame.mode==='orb'?viewGame.orbs.map(o=>`${Math.ceil(o.hp)} PV`).join(' — '):viewGame.scores.join(' — ')}`;
  $('result-rows').innerHTML=[...viewGame.players].sort((a,b)=>a.team-b.team||b.stats.kills-a.stats.kills).map(a=>`<tr class="${a.id===myId?'self':''}"><td>${a.team?'◆':'✦'} ${esc(a.name)}<small style="display:block;font-weight:normal;color:#8b9681;margin-top:4px">${HEROES[a.hero].name}</small></td><td>${a.stats.kills}</td><td>${a.stats.deaths}</td><td>${a.stats.assists}</td><td>${Math.round(a.stats.damage)}</td><td>${a.stats.objectives}</td></tr>`).join('');$('rematch-button').disabled=online&&room?.hostId!==myId;$('rematch-button').textContent=online&&room?.hostId!==myId?'Esperando al anfitrión…':'Otra ronda ↻';audio.tone(winner===p?.team?780:220,.4);resultStyle(winner===null?'draw':winner===p?.team?'win':'lose');show('results');}
function updateRematch(){const waiting=online&&room?.hostId!==myId;$('rematch-button').disabled=waiting;$('rematch-button').textContent=waiting?'Esperando al anfitrión…':'Otra ronda ↻';}
$('rematch-button').onclick=()=>{if(online)send({type:'back'});else{room.members=room.members.filter(p=>!p.bot);room.members.forEach(p=>p.ready=false);show('lobby');renderLobby();}};
function updateHud(){const p=me();if(!p)return;const g=viewGame,h=HEROES[p.hero];$('timer').textContent=`${Math.floor(Math.ceil(g.remaining)/60)}:${String(Math.ceil(g.remaining)%60).padStart(2,'0')}`;$('hud-mode').textContent=g.overtime?'PRÓRROGA':g.mode==='deathmatch'?'COMBATE':g.mode==='flags'?'BANDERAS':'ORBE';$('score-blue').textContent=g.mode==='orb'?Math.ceil(g.orbs[0].hp):g.scores[0];$('score-red').textContent=g.mode==='orb'?Math.ceil(g.orbs[1].hp):g.scores[1];$('hud-hero').textContent=h.name;$('hud-health').textContent=`${Math.ceil(p.hp)}/${p.maxHp}`;$('health-fill').style.width=`${p.hp/p.maxHp*100}%`;
  const charged=p.charge>=h.charge;$('ult-control').classList.toggle('charged',charged);$('ulti-label').textContent=charged?'¡LISTA!':`${Math.floor(p.charge/h.charge*100)}%`;$('attack-control').style.filter=p.cooldown>0?'brightness(.8)':'';$('match-banner').innerHTML=countdown>0?`${Math.ceil(countdown)}<small>${esc(g.map.name)}</small>`:p.respawn>0?`<span class="respawn-title">HAS CAÍDO EN COMBATE</span>${Math.ceil(p.respawn)}<small>Regresas a tu base · Conservas tu ulti</small>`:'';
  $('objective-hint').textContent=p.carrying?'⚑ ¡Lleva la bandera a tu portal!':g.mode==='flags'?'Recoge banderas y entrégalas en tu portal':g.mode==='orb'?'Destruye el orbe enemigo · Protege el tuyo':g.overtime?'La siguiente eliminación gana':'Cada eliminación suma · Lucha con tu equipo';$('network-status').textContent=online?(ws?.readyState===WebSocket.OPEN?`${lastPing||'…'} ms`:'CONECTANDO'):'PRÁCTICA';
}
let previous=performance.now(),accumulator=0,lastSend=0,lastHud=0,lastPortrait=0;
function frame(now){const dt=Math.min(.1,(now-previous)/1000);previous=now;
  if(screen==='home')drawHome($('hero-canvas'),now/1000);
  if(screen==='lobby'&&now-lastPortrait>60){document.querySelectorAll('[data-hero]').forEach(b=>portrait(b.querySelector('canvas'),b.dataset.hero,now/1000));lastPortrait=now;}
  if(screen==='results')drawResults(viewGame,myId,now/1000);
  if(screen==='loading'&&!online&&assetsLoaded){countdown=Math.max(0,countdown-dt);loadingCountdown(countdown);if(countdown<=0)enterMatch();}
  if(screen==='match'&&viewGame){
    if(!online){if(countdown>0)countdown=Math.max(0,countdown-dt);else{accumulator+=dt;while(accumulator>=1/30){stepGame(localGame,1/30,{[myId]:controls.sample()});accumulator-=1/30;}viewGame=snapshotFor(localGame,localGame.players.find(p=>p.id===myId).team);}}
    else if(now-lastSend>=1000/30){send({type:'input',input:controls.sample()});lastSend=now;}
    renderer.render(viewGame,myId,now/1000,controls.aim?.cancel?null:controls.aim);audio.events(viewGame,myId);
    if(now-lastHud>70){updateHud();lastHud=now;}if(viewGame.phase==='finished'&&!resultsShown)showResults();
    if(online&&now-lastNetworkAt>4000&&ws?.readyState===WebSocket.OPEN){$('network-status').textContent='SIN SEÑAL';}
  }
  requestAnimationFrame(frame);
}requestAnimationFrame(frame);
setInterval(()=>{if(online&&ws?.readyState===WebSocket.OPEN)send({type:'ping',sent:performance.now()});},2500);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&online)send({type:'input',input:{mx:0,my:0,angle:0,attack:false,ult:false}});});
window.addEventListener('resize',()=>{if(screen==='lobby')document.querySelectorAll('[data-hero]').forEach(b=>portrait(b.querySelector('canvas'),b.dataset.hero));});
if('serviceWorker'in navigator&&window.isSecureContext)navigator.serviceWorker.register('/sw.js').catch(()=>{});
const invite=new URL(location.href).searchParams.get('sala');if(invite){setup(true);$('room-code').value=invite.slice(0,6);toast('Introduce tu apodo y pulsa Entrar para unirte.');}
