# Equilibrio de combate · v0.2

Se ha tomado como referencia el método de ajustar por separado salud, daño y cadencia de ataque que aparece en las [notas oficiales de Brawl Stars del 30 de abril de 2025](https://supercell.com/en/games/brawlstars/blog/news/maintenance-april-30/). No existe una proporción universal de vida/daño: también cuentan alcance, acierto, recuperación, ultis y ataques de varios rivales a la vez.

## Cambios aplicados

- Vida: Caballero 40, Ogro 65, Brujo 38, Bufón 32, Toro 60 y Príncipe 42.
- Se mantiene el daño y la cadencia de los ataques normales. Las ultis requieren 14, 24, 22, 18, 26 y 24 puntos de daño normal efectivo, respectivamente.
- Recuperación del 8 % de vida máxima por segundo tras cinco segundos sin atacar ni recibir daño. No cura a muertos ni orbes.
- Las cinco flechas de la ulti del Príncipe conservan 7 puntos por flecha, con un máximo conjunto de 14 sobre cada objetivo por lanzamiento.
- Se mantienen cinco segundos de reaparición y dos segundos de protección que termina al atacar.

## Mediciones

Modelo de los 36 cruces entre héroes: ataques normales que siempre aciertan, primer golpe en t=0, sin tiempo de vuelo, ultis, curación ni fuego concentrado. Tiempo medio para derrotar al objetivo: **2,88 → 8,31 segundos**. Rango: **1–5,6 → 5–14,7 segundos**. Son cálculos comparativos, no la duración garantizada de una pelea real.

Simulación del motor completo: 90 partidas por versión (3 mapas × 3 modos × 10 semillas), seis bots, mismas composiciones, pasos de 1/30 s. Todas terminaron sin valores inválidos.

| Modo | Muertes totales por minuto, antes | Ahora | Reducción |
|---|---:|---:|---:|
| Combate | 29,34 | 23,52 | 19,8 % |
| Banderas | 28,92 | 22,06 | 23,7 % |
| Orbe | 29,97 | 20,63 | 31,2 % |

Las tasas suman las muertes de los seis héroes. Los ataques conjuntos y ultis explican que triplicar aproximadamente la resistencia en duelo no reduzca tres veces las muertes de equipos. Las partidas de orbe se acortaron ligeramente: los atacantes sobreviven más y presionan el objetivo, cuya vida sigue en 120. Harán falta partidas humanas para ajustar esa diferencia y las composiciones; no se afirma equilibrio competitivo definitivo.

## Ajuste 0.2.1

A petición del jugador, el ataque normal del Brujo pasa de alcance 1,5 a 8 unidades, igual que la flecha del Príncipe. Conserva 4 de daño y 0,8 segundos entre ataques. Las simulaciones anteriores corresponden a la versión 0.2, antes de ampliar ese alcance.

## Ajuste 0.2.2

La ulti del Ogro deja de depositar un círculo a 5 unidades. Ahora deja un abanico fijo orientado al lanzar: comienza junto al cuerpo (0,15 unidades por detrás del centro), llega 3 unidades hacia delante y aumenta de 0,6 a 3,4 unidades de anchura total. Conserva cinco pulsos de 2 de daño en cinco segundos y una carga de 24 de daño. Los bordes consideran el tamaño del objetivo; las paredes permanentes bloquean el daño. Los bots pueden utilizarla contra enemigos cercanos. La geometría visible y la de colisión comparten la misma definición. Las simulaciones de la versión 0.2 no evalúan este ajuste.
