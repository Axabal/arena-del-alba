export const OGRE_BREATH={start:-.15,range:3,nearWidth:.3,farWidth:1.7};

export function fanPoint(z,t,side=0){
  const d=z.start+(z.range-z.start)*t,w=z.nearWidth+(z.farWidth-z.nearWidth)*t;
  const c=Math.cos(z.angle),s=Math.sin(z.angle);
  return {x:z.x+c*d-s*w*side,y:z.y+s*d+c*w*side};
}
export function fanPolygon(z){return [fanPoint(z,0,-1),fanPoint(z,1,-1),fanPoint(z,1,1),fanPoint(z,0,1)];}
function insidePolygon(p,vertices){
  let sign=0;
  for(let i=0;i<vertices.length;i++){
    const a=vertices[i],b=vertices[(i+1)%vertices.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    if(Math.abs(cross)<1e-9)continue;
    if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);
  }
  return true;
}
export function fanHitsCircle(z,p,r){
  const vertices=fanPolygon(z);if(insidePolygon(p,vertices))return true;
  return vertices.some((a,i)=>{const b=vertices[(i+1)%vertices.length],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=r;
  });
}
export function fanHitsBox(z,o){
  const a=fanPolygon(z),b=[{x:o.x-o.w/2,y:o.y-o.h/2},{x:o.x+o.w/2,y:o.y-o.h/2},{x:o.x+o.w/2,y:o.y+o.h/2},{x:o.x-o.w/2,y:o.y+o.h/2}];
  for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
    const p=polygon[i],q=polygon[(i+1)%polygon.length],nx=p.y-q.y,ny=q.x-p.x;
    const aa=a.map(v=>v.x*nx+v.y*ny),bb=b.map(v=>v.x*nx+v.y*ny);
    if(Math.max(...aa)<Math.min(...bb)||Math.max(...bb)<Math.min(...aa))return false;
  }
  return true;
}
