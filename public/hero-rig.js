import {imageResource} from './image-resource.js';
// Painted parts are sampled from the generated atlas and assembled at articulated joints.
// Artwork remains a single lossless texture; coordinates describe its non-uniform margins.
const ORDER = ['knight', 'ogre', 'warlock', 'jester', 'bull', 'prince'];
const SOURCE = '/assets/heroes-rig-v2.png';
const rects = [
  [[24,3,193,228],[226,23,204,211],[431,12,208,224],[636,15,198,223],[831,12,213,228],[1051,8,202,229]],
  [[25,236,196,193],[227,233,201,204],[438,237,188,195],[656,237,171,198],[842,237,198,199],[1043,234,202,204]],
  [[47,433,131,209],[263,432,150,231],[466,435,151,211],[690,435,124,219],[891,434,148,229],[1118,433,121,210]],
  [[34,619,181,235],[261,667,160,201],[439,619,165,253],[661,667,171,199],[888,664,144,208],[1063,634,182,231]],
  [[73,868,101,181],[272,870,130,180],[452,866,166,183],[687,871,124,179],[897,875,128,178],[1100,869,128,183]],
  [[71,1050,108,181],[271,1052,132,187],[453,1050,161,187],[686,1050,132,188],[895,1056,133,184],[1101,1051,130,186]],
];
const resource=imageResource(SOURCE,'No se pudo cargar el arte de los héroes. Vuelve a intentarlo.');
const image=resource.image;
const pieces = new Map();
let ready = false;
export function loadRig(){return resource.load().then(()=>{ready=true;});}
export const rigReady=loadRig();
rigReady.catch(()=>{});

function sourcePart(hero, row) {
  const col = ORDER.indexOf(hero), key = `${col}:${row}`;
  if (pieces.has(key)) return pieces.get(key);
  const [x,y,w,h] = rects[row][col < 0 ? 0 : col];
  const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
  const c = canvas.getContext('2d');
  // Sword/staff reach upwards beside another row. Clip out the neighbour's hand.
  if (row===3 && col===0) {
    c.beginPath();c.moveTo(0,0);c.lineTo(55,0);c.lineTo(83,68);c.lineTo(w,105);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.clip();
  }
  if (row===3 && col===2) {
    c.beginPath();c.moveTo(0,0);c.lineTo(93,0);c.lineTo(100,59);c.lineTo(w,110);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.clip();
  }
  c.drawImage(image,x,y,w,h,0,0,w,h);
  pieces.set(key,canvas);return canvas;
}
function part(c,hero,row,x,y,w,h,angle=0,px=.5,py=.05) {
  const src=sourcePart(hero,row); c.save(); c.translate(x,y); c.rotate(angle);
  c.drawImage(src,-w*px,-h*py,w,h); c.restore();
}
function jointed(c,hero,row,x,y,w,h,upperAngle,bend,split=.51) {
  const src=sourcePart(hero,row), cut=Math.floor(src.height*split), upper=h*split;
  c.save();c.translate(x,y);c.rotate(upperAngle);
  c.drawImage(src,0,0,src.width,cut+5,-w*.5,-3,w,upper+5);
  c.translate(0,upper-3);c.rotate(bend);
  c.drawImage(src,0,cut-5,src.width,src.height-cut+5,-w*.5,-5,w,h-upper+5);
  c.restore();
}
export function drawPaintedHero(c,hero,x,y,size,opts={}) {
  if (!ready) return false;
  const {time=0,walk=0,face=1,team=null,attack=0,hit=0,death=0,spawn=0,victory=false}=opts;
  const stride=Math.sin(time*11), pace=Math.max(0,Math.min(1,walk));
  const heavy=hero==='ogre'||hero==='bull', width=heavy?1.13:1;
  const strike=Math.sin(Math.min(1,Number(attack))*Math.PI);
  c.save();c.translate(x,y);c.scale(size/100,size/100);
  c.fillStyle='#10142455';c.beginPath();c.ellipse(0,0,heavy?27:21,8,0,0,Math.PI*2);c.fill();
  if(team!==null){c.strokeStyle=team===0?'#5ed4ff':'#ff8e69';c.lineWidth=2.8;c.beginPath();c.ellipse(0,0,heavy?28:23,9,0,0,Math.PI*2);c.stroke();}
  if(death>0){c.globalAlpha=Math.max(0,1-death);c.translate(0,-3);c.rotate(face*death*1.4);c.scale(1,1-death*.6);}
  if(spawn>0){c.globalAlpha=.5+Math.sin(time*24)*.3;c.translate(0,-12*spawn);}
  c.scale(face,1);c.translate(0,-Math.abs(stride)*2*pace+Math.sin(time*2.6)*.65);
  c.rotate(stride*.025*pace+(hit>0?Math.sin(time*60)*hit*.06:0));
  // Hip and knee rotations are separate, alternating with footfall phase.
  const hip=stride*.32*pace,kneeA=Math.max(0,-stride)*.48*pace,kneeB=Math.max(0,stride)*.48*pace;
  jointed(c,hero,5,9*width,-31,heavy?20:17,31,-hip,kneeB,.49);
  jointed(c,hero,4,-9*width,-31,heavy?20:17,31,hip,kneeA,.49);
  // Rear shoulder and elbow. Attack flexes the elbow rather than moving the whole figure.
  const leftAngle=hero==='prince'&&attack?-.6:-.1-stride*.23*pace-strike*.7;
  jointed(c,hero,2,-19*width,-65,heavy?23:20,37,leftAngle,Math.max(0,stride)*.18*pace+strike*.35,.48);
  part(c,hero,1,0,-69,46*width,44,Math.sin(time*2.6)*.012,.5,.05);
  const headW=hero==='warlock'?61:hero==='bull'?60:hero==='ogre'?58:50;
  const headH=hero==='warlock'?48:43;
  part(c,hero,0,0,-101,headW,headH,-strike*.07+stride*.018*pace,.5,.03);
  // Front shoulder and weapon. Weapons stay connected to the hand through the swing.
  let rightAngle=.08+stride*.22*pace;
  if(hero==='knight')rightAngle-=strike*1.55;
  else if(hero==='ogre'||hero==='bull')rightAngle-=strike*1.3;
  else if(hero==='prince')rightAngle-=strike*.6;
  else rightAngle-=strike*.95;
  if(victory)rightAngle=-1.3+Math.sin(time*4)*.16;
  if(['knight','warlock','prince'].includes(hero)) {
    // These cells include a weapon above the hand; the attachment is lower in the image.
    part(c,hero,3,20*width,-59,hero==='prince'?36:32,hero==='warlock'?49:44,rightAngle,.47,.38);
  } else jointed(c,hero,3,20*width,-63,heavy?25:24,37,rightAngle,-strike*.3,.5);
  if(hit>.1){c.globalCompositeOperation='screen';c.globalAlpha=hit*.28;c.fillStyle='#ffebc2';c.beginPath();c.ellipse(0,-53,19,26,0,0,Math.PI*2);c.fill();}
  c.restore();return true;
}
export function assetStatus(){return {loaded:ready,total:1,ready:ready?1:0};}
