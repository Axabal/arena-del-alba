// Keep successful images and concurrent requests; a failed attempt is retryable.
export function imageResource(source,message){
  const image=new Image();let loaded=false,pending=null;
  function load(){
    if(loaded)return Promise.resolve(image);
    if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      const finish=(ok)=>{clearTimeout(timer);image.onload=image.onerror=null;pending=null;if(ok){loaded=true;resolve(image);}else reject(new Error(message));};
      const timer=setTimeout(()=>{image.src='';finish(false);},10000);
      image.onload=()=>finish(image.naturalWidth>0);image.onerror=()=>finish(false);
      image.src=source;
    });
    return pending;
  }
  return {image,load};
}
