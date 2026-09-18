import {cp,mkdir,readFile,readdir,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {websocketAddress} from '../public/connection.js';

const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'dist');
const configured=(process.env.GAME_SERVER_URL||'').trim();
if(!configured)throw new Error('Falta GAME_SERVER_URL: indica en Netlify la URL HTTPS del servidor de partidas.');
const endpoint=websocketAddress(configured,'https://deployment.invalid/');
await mkdir(output,{recursive:true});await cp(path.join(root,'public'),output,{recursive:true});
await writeFile(path.join(output,'runtime-config.js'),`export const GAME_SERVER_URL=${JSON.stringify(endpoint)};\n`);
const hash=createHash('sha256');
async function fingerprint(dir){for(const name of (await readdir(dir)).sort()){const item=path.join(dir,name);if((await stat(item)).isDirectory())await fingerprint(item);else if(name!=='sw.js'&&name!=='_headers'){hash.update(path.relative(output,item));hash.update(await readFile(item));}}}
await fingerprint(output);const sw=await readFile(path.join(output,'sw.js'),'utf8');
await writeFile(path.join(output,'sw.js'),sw.replace(/const CACHE='[^']+';/,`const CACHE='alba-${hash.digest('hex').slice(0,16)}';`));
await writeFile(path.join(output,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n  X-Frame-Options: SAMEORIGIN\n  Cache-Control: no-cache\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${new URL(endpoint).origin}; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'\n`);
console.log('Web preparada en dist. Conexión de partidas: '+endpoint);
