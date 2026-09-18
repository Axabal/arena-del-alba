export const MAPS=[{id:'meadow',name:'Pradera del Alba'},{id:'graveyard',name:'Jardín de las Sombras'},{id:'beach',name:'Costa de Coral'}];
export function createMap(id='meadow') {
  const known=MAPS.find(m=>m.id===id)||MAPS[0];
  const layouts={
    meadow:[[7,5,2,1,0],[10,7,1,2,0],[7,13,2,1,0],[11,12,1,2,1],[12,3,2,1,1]],
    graveyard:[[7,4,1,2,1],[7,14,1,2,1],[10,6,2,1,0],[10,12,2,1,0],[12,9,1,2,0]],
    beach:[[7,6,1,3,0],[7,12,1,3,0],[11,4,3,1,1],[11,14,3,1,1],[11,8,1,1,0]]
  };
  let n=0;const obstacles=[];
  for(const [x,y,w,h,p] of layouts[known.id])for(const cx of [x,28-x])obstacles.push({id:`wall${n++}`,x:cx,y,w,h,hp:p?null:6,maxHp:p?null:6,permanent:!!p});
  const bushLayouts={meadow:[[8,9,2.7,3],[12,5,2,2],[12,15,2,2]],graveyard:[[8,9,2,3],[12,3,2,2],[12,15,2,2]],beach:[[10,10,3,2],[5,3,3,2],[5,15,3,2]]};
  const bushes=bushLayouts[known.id].flatMap(([x,y,w,h])=>[{x,y,w,h},{x:28-x,y,w,h}]);
  return {...known,width:28,height:18,obstacles,bushes,spawns:[{x:2,y:9},{x:26,y:9}],portals:[{x:4,y:9},{x:24,y:9}],flagPoints:[{x:14,y:6},{x:14,y:12},{x:14,y:9}]};
}
