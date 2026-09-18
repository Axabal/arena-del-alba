export function websocketAddress(serverUrl,pageUrl,token=''){
  const page=new URL(pageUrl),url=new URL(serverUrl||page.origin);
  if(!['https:','http:','wss:','ws:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['/','/ws'].includes(url.pathname))throw new Error('La dirección del servidor no es válida.');
  url.protocol=url.protocol==='https:'?'wss:':url.protocol==='http:'?'ws:':url.protocol;
  if(page.protocol==='https:'&&url.protocol!=='wss:')throw new Error('El juego necesita una conexión segura con el servidor.');
  url.pathname='/ws';if(token)url.searchParams.set('token',token);return url.href;
}
