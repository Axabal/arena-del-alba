import {drawHero} from './renderer.js';
const $=id=>document.getElementById(id);
export function mountPresentation(){
  const loading=document.createElement('section');loading.id='loading';loading.className='screen hidden';
  loading.innerHTML=`<div class="loading-vignette"></div><button id="cancel-loading" class="loading-cancel">Salir ×</button><div class="loading-brand">✦ <span>ARENA DEL ALBA</span></div><div class="loading-card"><span class="eyebrow">EL CAMPO DE BATALLA TE ESPERA</span><h2 id="loading-map">Preparando la arena</h2><p id="loading-mode"></p><div class="loading-duel"><span>✦ BRUMA</span><b>VS</b><span>CORAL ◆</span></div><div class="load-track"><i id="load-fill"></i></div><div class="load-meta"><span id="load-label">Cargando ilustraciones…</span><strong id="load-percent">0 %</strong></div><p class="loading-tip">Retírate tras una cobertura. Después de 5 segundos sin combatir, recuperas vida.</p></div><div id="loading-countdown"></div>`;
  $('app').insertBefore(loading,$('match'));
  const result=$('results');const panel=document.createElement('div');panel.className='result-panel';while(result.firstChild)panel.appendChild(result.firstChild);result.appendChild(panel);
  const canvas=document.createElement('canvas');canvas.id='results-heroes';canvas.setAttribute('aria-label','Héroes de la partida');panel.insertBefore(canvas,panel.querySelector('.results-table-wrap'));
  const intro=document.createElement('div');intro.id='battle-intro';intro.className='battle-intro hidden';intro.innerHTML='<span>LA ARENA OS ESPERA</span><strong>¡A COMBATIR!</strong>';$('match').appendChild(intro);
}
export function loadingInfo(mapName,modeName){$('loading-map').textContent=mapName;$('loading-mode').textContent=modeName;$('loading-countdown').textContent='';}
export function loadingProgress(progress,label){$('load-fill').style.width=`${Math.round(progress*100)}%`;$('load-percent').textContent=`${Math.round(progress*100)} %`;$('load-label').textContent=label;}
export function loadingCountdown(seconds){$('loading-countdown').textContent=seconds>0?String(Math.ceil(seconds)):'';if(seconds>0)$('load-label').textContent='Equipos listos. Entrando en la arena…';}
let introTimer;
export function battleIntro(){const el=$('battle-intro');clearTimeout(introTimer);el.classList.remove('hidden');el.style.animation='none';void el.offsetWidth;el.style.animation='';introTimer=setTimeout(()=>el.classList.add('hidden'),1700);}
export function resultStyle(outcome){$('results').dataset.outcome=outcome;$('result-title').textContent=outcome==='win'?'VICTORIA':outcome==='lose'?'DERROTA':'EMPATE';}
export function drawResults(game,myId,time){
  const canvas=$('results-heroes'),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||!game)return;
  const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=w*dpr;canvas.height=h*dpr;}
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const me=game.players.find(p=>p.id===myId),team=game.winner??me?.team??0,players=game.players.filter(p=>p.team===team);
  players.forEach((p,i)=>{const x=w/2+(i-1)*Math.min(w*.23,160),y=h-17,size=Math.min(h*.86,w*.26);drawHero(c,p.hero,x,y,size,{time,team:p.team,victory:game.winner!==null,walk:.15});});
}
