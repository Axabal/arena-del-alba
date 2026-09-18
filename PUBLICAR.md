# Publicar con GitHub y Netlify

Estado: proyecto preparado y probado localmente. El repositorio público creado por el usuario es https://github.com/Axabal/arena-del-alba. La subida del código y el despliegue público están pendientes. No se ha contratado ningún servicio de pago.

## Qué hace cada servicio

- GitHub guarda el código completo de esta carpeta, incluido servidor y gráficos. Puede ser un repositorio privado.
- Netlify publica la web desde `dist`, generada automáticamente por `npm run build:web`.
- Un alojamiento Node con WebSockets persistentes ejecuta `npm start`. Render es una opción compatible; no se ha contratado ni desplegado aquí.

Netlify no ejecuta el proceso permanente de partidas actual. No se debe colocar el servidor en una función Netlify ni redirigir `/ws` mediante un proxy HTTP convencional. La conexión segura del navegador va directamente al alojamiento de partidas.

## 1. Repositorio GitHub

Sube el contenido de **esta carpeta** como raíz del repositorio. No subas `node_modules`, `dist`, archivos `.env`, logs ni los ZIP de entrega. `.gitignore` ya los excluye donde corresponde. El nombre sugerido es `arena-del-alba`.

## 2. Servidor de partidas (opción Render)

Crea un Web Service desde ese repositorio:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/health` |
| Variables | `NODE_ENV=production`, `NODE_VERSION=24` |
| Instancias | Una |

El programa utiliza automáticamente el `PORT` asignado por el proveedor. Guarda su dirección HTTPS cuando el servicio esté listo.

El plan Free es para pruebas: se suspende tras 15 minutos sin tráfico y el siguiente acceso puede tardar alrededor de un minuto. Tiene cuotas y puede suspenderse al agotarlas. No selecciones un plan de pago ni actives cargos adicionales sin decidirlo antes. No hay una compra configurada en este proyecto.

## 3. Web en Netlify

Importa el mismo repositorio. `netlify.toml` configura automáticamente el comando y la carpeta de publicación.

Añade en las variables de compilación:

- `GAME_SERVER_URL`: la dirección HTTPS REAL del servidor de partidas (puede terminar en `/ws` o en `/`).

Ejecuta el despliegue. Sin esa variable la compilación falla con una explicación para evitar publicar una web que no pueda jugar online. La URL es pública; no es una contraseña. Nunca pongas tokens del proveedor en esta variable.

## 4. Autorizar la web y probar

En el servidor configura:

- `ALLOWED_ORIGINS`: la dirección HTTPS REAL de la web Netlify, sin rutas, comodines ni parámetros. Para varios dominios exactos, sepáralos por comas.

Aplica el cambio del servidor. Comparte únicamente la dirección de Netlify. Abre dos móviles en redes distintas, crea una sala, únete con el otro, completa una partida y prueba una reconexión. La práctica con bots también está disponible.

Si cambias el dominio de Netlify, actualiza `ALLOWED_ORIGINS`. Si cambia la dirección del servidor, actualiza `GAME_SERVER_URL` y vuelve a compilar Netlify. Las vistas previas con direcciones distintas necesitan autorización explícita si deben conectarse al servidor.

El servidor guarda las partidas en memoria: un reinicio o despliegue termina las salas actuales. Publica actualizaciones cuando no haya partidas.

## Funcionamiento local

`npm start` sigue sirviendo todo desde el mismo ordenador. El archivo `public/runtime-config.js` conserva una dirección vacía, que significa usar el servidor local. El build de Netlify modifica solo `dist/runtime-config.js`.

## Documentación oficial consultada

- [Netlify: WebSockets y servicios externos](https://www.netlify.com/blog/web-sockets-in-a-serverless-world/)
- [Netlify: configuración del despliegue](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
- [Render: WebSockets](https://render.com/docs/websocket)
- [Render: límites del plan gratuito](https://render.com/docs/free)
