# Arena del Alba · edición 0.2.1

Juego web original de arena 3 contra 3, en español, con seis héroes, tres mapas, tres modos, bots y salas privadas online. Se puede añadir a la pantalla de inicio en Android y iPhone cuando se publica con HTTPS.

## Novedades de la edición 0.2

Más resistencia, recuperación fuera de combate, límite al daño acumulado de la ulti del Príncipe, seis héroes ilustrados y articulados, escenarios con texturas, fuego violeta y ondas de energía, carga real de recursos y ventanas de victoria/derrota.

Para actualizar una instalación anterior, cierra todas las pestañas del juego y vuelve a abrirlo. El pie de la portada debe indicar **0.2.1**.

## Abrir en este ordenador

1. Abre `INICIAR.cmd` en Windows. Necesita Node.js 24 o posterior. Si falta, el iniciador indica dónde obtenerlo.
2. Abre **http://localhost:3000**.
3. Elige **Practicar con bots**, modo, héroe, **Estoy listo** y **Completar con bots y jugar**.
4. Mantén el servidor encendido mientras juegas. Para detenerlo, pulsa Ctrl+C en su ventana.

También se puede ejecutar con:

```sh
npm ci
npm start
```

El servidor sirve la web y las conexiones de las partidas desde el mismo puerto. Si ese puerto ya está ocupado, usa otra variable `PORT` antes de iniciarlo.

## Jugar con amigos

Crea una sala en **Jugar con amigos** y comparte su código o enlace. Cada persona elige equipo, héroe y pulsa **Estoy listo**. El anfitrión inicia y las plazas vacías se rellenan con bots. No se repite un héroe dentro del mismo equipo.

**La dirección localhost solo funciona en el ordenador que ejecuta el juego. No es un enlace público.** Para jugar desde casas distintas hay que publicar este proyecto en un servidor. El código online está implementado y probado; esta entrega no incluye una cuenta de alojamiento contratada ni una URL pública.

En una misma red local se puede abrir `http://IP-LOCAL-DEL-ORDENADOR:3000` si la red y el cortafuegos lo permiten. Todos deben usar esa misma dirección. La instalación PWA requiere HTTPS, salvo la excepción de localhost en el propio ordenador. No abras puertos del router para probarlo.

## Publicar el juego completo

Para GitHub + Netlify con un servidor de partidas separado, consulta [PUBLICAR.md](PUBLICAR.md). La preparación y las pruebas locales están hechas; las cuentas, URLs y el despliegue remoto siguen pendientes.


Elige un alojamiento para contenedores o Node.js que admita **WebSockets persistentes**, HTTPS y procesos de larga duración. No sirve publicar únicamente la carpeta `public` si se quiere multijugador.

Configuración:

- Instalación: `npm ci --omit=dev`.
- Arranque: `node server/index.js`.
- Puerto: variable `PORT` que proporcione el alojamiento, o 3000 por defecto.
- Ruta de comprobación: `/health`.
- Conexión online: `/ws`, con proxy que permita Upgrade de WebSocket y conserve la cabecera Host.
- Una sola instancia del servidor en esta versión: las salas viven en su memoria.
- HTTPS para toda la web; el navegador usará WSS automáticamente.
- No se necesitan claves de API ni cuentas de ChatGPT para jugar.

Se incluye un `Dockerfile` si el proveedor admite contenedores. Antes de aceptar un plan, revisa su precio y límites. No hay costes de IA durante las partidas.

Con la dirección pública ya publicada: abre dos móviles en redes diferentes, crea una sala, entra con el otro, prueba una partida completa y una reconexión. Esa prueba real entre redes aún debe realizarse al publicar.

## Añadir el icono al móvil

- **iPhone:** abrir la URL HTTPS en Safari → Compartir → Añadir a pantalla de inicio → Abrir como app web, si aparece.
- **Android:** abrir en Chrome → menú → Instalar aplicación / Añadir a pantalla de inicio.

En el juego hay un botón **Llévalo en el bolsillo** con estas instrucciones. Si se gira a vertical en un teléfono, aparece un aviso. No dependemos del bloqueo de orientación, que no está disponible por igual en todos los navegadores.

La caché guarda una versión coherente de los recursos. No se fuerza una recarga durante una partida. Al publicar cambios, incrementa `CACHE` en `public/sw.js`; la nueva versión se activa al cerrar todas las pestañas anteriores. No se cachean partidas ni mensajes online. La instalación se ha comprobado a nivel de manifest, recursos y service worker, no en un iPhone físico.

## Controles

**Móvil:** joystick derecho para moverse; ataque y ulti a la izquierda. Tocar apunta automáticamente a un enemigo visible en alcance; arrastrar apunta manualmente y soltar dispara. Arrastrar más de 170 píxeles cancela. Multitáctil para moverse y apuntar a la vez. La distribución puede invertirse en ajustes.

**Ordenador:** WASD o flechas para moverse, ratón para apuntar, clic izquierdo para atacar, espacio para ulti.

## Reglas

- Partida de 180 segundos; empate: prórroga de hasta 90.
- Muerte: cinco segundos antes de reaparecer con toda la vida y dos segundos de protección, cancelada al atacar.
- No hay fuego amigo. Tras cinco segundos sin atacar ni recibir daño, recuperas el 8 % de tu vida máxima por segundo. Se conserva la carga de ulti al morir.
- Solo el daño efectivo de ataques normales a héroes enemigos carga la ulti. Ni orbes, ni coberturas, ni ultis generan carga.
- Solo las ultis destruyen las coberturas marcadas como destructibles. Los límites permanentes no se destruyen.
- La vegetación oculta a rivales a más de dos unidades de un aliado. Atacar o recibir daño revela durante 1,5 segundos.
- **Combate:** cada eliminación suma uno. En la prórroga gana la primera eliminación; sin eliminaciones, empate.
- **Banderas:** llevar una bandera al portal propio suma uno. Muerte: se cae. Una entrega decide la prórroga; si no hay entregas, empate.
- **Orbe:** cada uno tiene 120 de vida. Destruirlo gana. Al acabar el tiempo gana quien conserve más vida en su orbe; si están iguales se aplica la prórroga y la misma comparación. Destrucción simultánea: empate.

| Héroe | Vida | Normal | Ulti | Carga |
|---|---:|---|---|---:|
| Caballero | 40 | Espada: 3 | Onda: 7 | 14 |
| Ogro | 65 | Puño: 6 | Cinco pulsos de 2 | 24 |
| Brujo | 38 | Bola morada: 4; alcance 8 | Drenaje: 8; cura daño efectivo | 22 |
| Bufón | 32 | Tres bolas de 2 | Caja explosiva: 10 | 18 |
| Toro | 60 | Cabezazo: 5 | Embestida: 13 y empuje | 26 |
| Príncipe | 42 | Flecha: 3 | Cinco flechas de 7; máximo 14 por objetivo y lanzamiento | 24 |

Los valores están en `public/shared/config.js`; mapas en `maps.js`; reglas y bots en `engine.js`. El Ogro y el Bufón lanzan su ulti a una distancia fija en la dirección elegida. Los tiempos, zonas y alcances iniciales están documentados en el código. Consulta BALANCE.md para las mediciones del cambio. El equilibrio aún necesita partidas con personas.

## Pruebas y límites de esta entrega

```sh
npm test
```

Las pruebas ejercitan combate real, coberturas, carga, curación, ultis, reaparición, visibilidad, banderas, orbes, desempates, validación de salas, seis clientes WebSocket y reconexión.

Se probaron también flujos de navegador de escritorio y un móvil horizontal emulado, sin errores JavaScript. No equivalen a ensayos en teléfonos Android/iPhone físicos. No se afirma un rendimiento medido de 60 FPS en móviles reales.

El servidor valida las acciones y simula el juego a 30 pasos por segundo; envía estados a 15 por segundo. El cliente interpola personajes y dibuja con `requestAnimationFrame`. No incluye predicción avanzada ni compensación de lag: conexiones con mucha latencia serán menos cómodas.

Si alguien se desconecta, entra un bot y se reserva su identidad 60 segundos. La identidad se guarda en esa pestaña; tras cerrar una pestaña o perder su sesión puede no recuperarse. Al reiniciar el servidor se pierden salas y partidas. No hay cuentas, rankings persistentes, compras ni escalado a múltiples servidores.

## Estructura

```text
public/              Interfaz, controles, gráficos originales y PWA
public/shared/       Reglas compartidas entre práctica y servidor
server/              Salas privadas, WebSockets y servidor de archivos
tests/               Pruebas automáticas de reglas y conexión
Dockerfile           Preparación de alojamiento
INICIAR.cmd          Iniciador para Windows
```

Los gráficos se dibujan con Canvas. Incluyen tres atlas/ilustraciones originales generados para el juego y servidos desde el propio proyecto. Los personajes son figuras 2D articuladas mediante piezas ilustradas, con movimiento de hombros, codos, caderas y rodillas; no son modelos 3D. El servidor utiliza Node.js y la biblioteca `ws`.
