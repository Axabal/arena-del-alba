export const HEROES = {
  knight: {id:'knight',name:'Caballero',hp:40,damage:3,charge:14,speed:3.2,cooldown:.65,range:1.5,color:'#62b7ff',description:'Espada precisa y resistencia equilibrada.',ultimate:'Onda de acero · 7 de daño, alcance 8'},
  ogre: {id:'ogre',name:'Ogro',hp:65,damage:6,charge:24,speed:2.5,cooldown:1,range:1.5,color:'#86d874',description:'Golpes contundentes y mucha vida.',ultimate:'Aliento tóxico · abanico cercano, alcance 3 · 5 pulsos de 2'},
  warlock: {id:'warlock',name:'Brujo',hp:38,damage:4,charge:22,speed:3.2,cooldown:.8,range:8,color:'#bd8bfa',description:'Bolas de fuego violeta de largo alcance.',ultimate:'Drenaje · 8 de daño y curación efectiva'},
  jester: {id:'jester',name:'Bufón',hp:32,damage:2,charge:18,speed:3.9,cooldown:1,range:5,color:'#ff7ca8',description:'Tres proyectiles seguidos por ataque.',ultimate:'Caja sorpresa · 10 de daño tras 0,8 s'},
  bull: {id:'bull',name:'Toro',hp:60,damage:5,charge:26,speed:3.2,cooldown:.85,range:1.5,color:'#ffa66c',description:'Cuerpo a cuerpo fuerte y veloz.',ultimate:'Embestida · alcance 3, daño 13 y empuje'},
  prince: {id:'prince',name:'Príncipe',hp:42,damage:3,charge:24,speed:3.9,cooldown:.7,range:8,color:'#ffe089',description:'Flechas de largo alcance.',ultimate:'Abanico real · 5 flechas de 7 · máximo 14 por objetivo'}
};
export const MODES = {deathmatch:{name:'Duelo por equipos',description:'3 minutos. Gana el equipo con más eliminaciones.'},flags:{name:'Captura de banderas',description:'Lleva las banderas del centro a tu portal.'},orb:{name:'Defiende el orbe',description:'Destruye el orbe rival y protege el tuyo.'}};
export const PLAYER_RADIUS=.32;
export const MATCH_SECONDS=180;
export const OVERTIME_SECONDS=90;

export const COMBAT_RULES = {regenDelay:5,regenFractionPerSecond:.08,princeCastDamageCap:14};
