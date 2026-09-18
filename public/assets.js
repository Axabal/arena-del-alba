import {loadRig} from './hero-rig.js';
import {loadTerrain} from './terrain-art.js';
import {imageResource} from './image-resource.js';
const splash=imageResource('/assets/arena-splash-v2.png','No se pudo cargar el escenario. Vuelve a intentarlo.');
export function prepareAssets(progress=()=>{}){
  let complete=0;progress(0,'Cargando ilustraciones…');
  const monitor=p=>p.then(()=>{complete++;progress(complete/3,complete===3?'Recursos listos':'Preparando héroes y escenario…');});
  return Promise.all([monitor(loadRig()),monitor(splash.load()),monitor(loadTerrain())]);
}
