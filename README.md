# 👑 LA CARRERA DEL REY: matemática financiera, contabilidad e IVA

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/suruca1122/capital-rush)

> **Publicarlo gratis:** pulsa el botón de arriba, entra en Render con tu cuenta de GitHub y pulsa **Deploy Blueprint**. En unos minutos tendrás una dirección tipo `https://capital-rush-xxxx.onrender.com`.
> - Profesor: `…onrender.com/profe`
> - Alumnos: `…onrender.com` (o escanean el QR)

Juego multijugador en tiempo real para repasar **matemática financiera** (interés simple y compuesto, descuento simple y compuesto) y **contabilidad e IVA** (cuentas del PGC de Pymes, masas patrimoniales y calificación de operaciones de IVA).
Juegan de 2 a 14 alumnos a la vez desde el móvil o el ordenador. El profesor proyecta la carrera en la pantalla grande.

## Cómo se juega
1. El profesor abre **`/profe`**, elige temas, tiempo por pregunta, longitud de la carrera y dificultad, y pulsa **Crear partida**.
2. En pantalla aparecen un **código de 4 letras** y un **QR**. Los alumnos entran desde el móvil, escriben su nombre y eligen un **avatar gracioso** con un complemento (gafas, corona, chistera…).
3. Cuando están todos, el profesor pulsa **¡Empezar carrera!**: cuenta atrás 3, 2, 1, ¡YA!
4. Cada pregunta aparece a la vez en el proyector y en los móviles, con 4 opciones y **tiempo límite**.
5. Al acabar el tiempo (o cuando han respondido todos):
   - se muestra la respuesta correcta con la **fórmula y la resolución paso a paso**;
   - los que aciertan **avanzan en la pista**. **Cuanto más rápido responden, más avanzan**, y el más rápido recibe un **bonus ⚡**;
   - los que fallan se quedan en el sitio.
6. **Gana quien llega antes al trono 👑.** Si varios la cruzan en la misma pregunta, gana el que ha llegado más lejos. Al final hay podio, confeti y opción de revancha.

Avance por acierto: entre el 40 % y el 100 % del "tramo" según la rapidez, más un 15 % extra para el más rápido.
- Sprint: ~6 tramos (unas 8 preguntas).
- Media: ~10 tramos (unas 13 preguntas).
- Maratón: ~15 tramos (unas 20 preguntas).

### Contenido de las preguntas

En la configuración puedes elegir cualquier combinación de temas. Los botones rápidos marcan solo *Matemática financiera*, solo *Contabilidad e IVA* o *Todos*.

#### Matemática financiera
Todas se generan con **datos aleatorios**, así que nunca se repiten. Los distractores son **errores típicos**: confundir simple con compuesto, comercial con racional, no pasar meses o días a años, usar 365 días…

| Tema | Básica | Avanzada (se añade) |
|---|---|---|
| Interés simple | Cn, intereses, C0 | tipo de interés, tiempo |
| Interés compuesto | Cn, intereses, C0 | tipo, tiempo (logaritmos), capitalización fraccionada, TAE, tipos equivalentes |
| Descuento simple | comercial y racional: efectivo y descuento | nominal, tipo de descuento o de interés |
| Descuento compuesto | comercial y racional: efectivo y descuento | nominal, tipo de descuento o de interés |

Al marcar *Descuento simple* y/o *Descuento compuesto* aparece, **para cada uno por separado**, un selector para preguntar por **descuento comercial y racional**, **solo comercial** o **solo racional**. Por ejemplo, puedes pedir el descuento simple solo comercial y el compuesto solo racional. Todas las opciones tienen preguntas básicas y avanzadas.

Convenio: año comercial de 360 días. La opción *Dificultad* solo afecta a estos temas.

#### Contabilidad e IVA
| Tema | Preguntas |
|---|---|
| 📒 Cuentas del PGC Pymes | Ver el nombre y acertar el número, o ver el número y acertar el nombre. Unas 190 cuentas de los grupos 1 a 7. Los distractores son cuentas del mismo subgrupo o grupo. |
| ⚖️ Masas patrimoniales | Decidir si una cuenta es activo no corriente, activo corriente, patrimonio neto, pasivo no corriente o pasivo corriente. Incluye casos con trampa: amortizaciones y deterioros, anticipos a proveedores y de clientes, activos y pasivos por impuesto diferido, dividendo a cuenta… |
| 🧾 Operaciones de IVA | 45 operaciones para calificar como sujeta (y no exenta), no sujeta, exenta limitada, exenta plena o IVA no deducible, con el artículo de la Ley 37/1992 en la solución. |

Dentro de una misma partida no se repite ninguna cuenta ni ninguna operación.

### Controles del profesor
- **⏩ Cerrar tiempo**: termina la pregunta antes de tiempo.
- **Siguiente ▶** (o tecla Espacio / Intro): pasa a la siguiente pregunta, así puedes explicar la resolución con calma.
- **🏁 Terminar**: acaba la carrera y gana quien vaya primero.
- Pasando el ratón por un avatar en la sala de espera, puedes **expulsar** a un jugador (✕).
- Si un alumno recarga la página o se le va la conexión, **vuelve a entrar automáticamente** con su progreso.

---

## Opción A: en tu ordenador, con la wifi del aula (la más rápida)
Necesitas [Node.js](https://nodejs.org) 18 o superior.

```bash
cd capital-rush
```

```bash
npm install
```

```bash
npm start
```

- Abre en tu ordenador `http://localhost:3000/profe` y proyéctalo.
- La pantalla muestra automáticamente la dirección para los alumnos (algo como `192.168.1.25:3000`) y el QR.
- Los alumnos deben estar **en la misma red wifi** que tu ordenador. Algunas redes de centros aíslan los dispositivos entre sí; si no conectan, usa la opción B.

## Opción B: publicarlo en Internet gratis (Render.com)
Así funciona desde cualquier red, incluidos los datos móviles.
1. Sube esta carpeta a un repositorio de GitHub.
2. En [render.com](https://render.com), crea un **New → Web Service** y conecta el repositorio. Render detecta `render.yaml` y lo configura solo:
   - Build: `npm install`
   - Start: `npm start`
3. Te dará una URL tipo `https://capital-rush.onrender.com`.
   - El profesor entra en `https://capital-rush.onrender.com/profe`.
   - Los alumnos entran en `https://capital-rush.onrender.com` o escanean el QR.

> En el plan gratuito, el servidor "se duerme" tras 15 minutos sin uso. Ábrelo un minuto antes de clase para despertarlo.

También funciona en cualquier servicio que ejecute Node.js con WebSockets, como Railway, Fly.io o un VPS.

## Estructura
```
server.js        servidor en tiempo real (Express + Socket.IO)
questions.js     generador de preguntas de matemática financiera
content.js       bancos de preguntas: cuentas del PGC Pymes, masas patrimoniales e IVA
public/
  host.html      pantalla del profesor (proyector)
  index.html     app del alumno (móvil)
  css/, js/      estilos, lógica, avatares, sonidos y confeti
```
