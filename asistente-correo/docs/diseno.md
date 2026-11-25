# Asistente de correo: diseño

Fecha: 2026-11-25 · Estado: pendiente de aprobación

## Por qué

Llegan demasiados correos. Se pierde mucho tiempo decidiendo cuáles son
importantes y hay que contestar, y la publicidad ocupa espacio y distrae.
El asistente tiene que **ahorrar tiempo de revisión**: abrir Gmail y ver
directamente lo que pide respuesta, con la respuesta ya redactada.

## Objetivos

1. Revisar los correos nuevos de forma periódica y autónoma.
2. Clasificar cada correo en **Importante**, **Menos importante** o **Publicidad/Spam**.
3. Dejar un **borrador de respuesta** en Gmail para cada correo importante que pida contestación.
4. Detectar publicidad y spam y **proponer cómo darse de baja**.
5. Enviar un **resumen** de lo revisado.

## No objetivos

- No envía respuestas por su cuenta: solo deja borradores.
- No se da de baja automáticamente ni pulsa enlaces.
- No borra correos definitivamente.
- No revisa el historial antiguo: solo lo nuevo desde que se instala (más los últimos 2 días en la primera ejecución).

## Antiobjetivos (fallaría aunque "funcione")

- Que genere **más ruido** del que quita (p. ej. un email de resumen cada 30 minutos).
- Que esconda un correo importante en Publicidad sin que se note.
- Que confirme la dirección a spammers pulsando su enlace de baja.

## Enfoques considerados

| Enfoque | A favor | En contra |
|---|---|---|
| **A. Google Apps Script + API de Claude** (elegido) | Corre en Google gratis, sin ordenador ni servidor; etiquetas y borradores nativos; instalar = pegar código y aceptar permisos | Límite de 6 min por ejecución (suficiente); código en JavaScript |
| B. Python en GitHub Actions + Gmail API | Más flexible | Instalación pesada: proyecto Google Cloud, OAuth, secretos |
| C. Tarea programada de Claude con conector Gmail | Sin código | Menos control y menos consistente con etiquetas, borradores y criterio |

Elegido **A** por el usuario.

## Cómo funciona

**Cada 30 minutos** (activador de tiempo de Apps Script):

1. Busca hilos de la bandeja de entrada sin la etiqueta `IA/Procesado`.
2. Para cada correo, envía a Claude: remitente, asunto, fecha, primeros
   ~3.000 caracteres del texto y si trae cabecera `List-Unsubscribe`.
3. Claude devuelve en JSON: categoría, motivo breve (1 línea), si necesita
   respuesta, si es boletín legítimo o spam real, y (si procede) un borrador.
4. Acciones según categoría:
   - **⭐ Importante**: etiqueta `IA/⭐ Importante`, se queda en la bandeja; si
     necesita respuesta, se crea un borrador en el mismo hilo.
   - **📥 Menos importante**: etiqueta `IA/📥 Menos importante`, se queda en la bandeja.
   - **🗑️ Publicidad**: etiqueta `IA/🗑️ Publicidad` y **se archiva** (sale de la
     bandeja, no se borra, se puede recuperar).
5. Marca el hilo con `IA/Procesado` y guarda los datos para el resumen.

**Resumen por email, 2 veces al día** (08:00 y 15:00): un único correo con
- importantes (con enlace al hilo y aviso de "borrador listo"),
- menos importantes (una línea cada uno),
- publicidad agrupada por remitente, con:
  - **boletín legítimo** → enlace de baja oficial (`List-Unsubscribe`);
  - **spam real** → recomendación de marcar como spam, sin enlace.

## Decisiones tomadas por mí (corregibles)

- **Modelo**: `claude-haiku-5-5` para clasificar (barato y rápido) y
  `claude-sonnet-5-5` solo para redactar borradores de los importantes.
- **Frecuencia**: revisión cada 30 min; resumen 2 veces al día para no
  añadir ruido.
- **Idioma del borrador**: el mismo del correo recibido; tono cordial y breve.
- **Ante la duda**, Claude clasifica como "Menos importante", nunca como
  Publicidad, para no esconder nada importante.
- **Reglas propias** (opcional, en la hoja de configuración): lista de
  remitentes VIP (siempre importantes) y remitentes a tratar siempre como publicidad.
- **Privacidad**: el texto de los correos solo se envía a la API de Claude;
  la clave se guarda en las Propiedades del script, nunca en el código.

## Estructura de la carpeta

```
asistente-correo/
  README.md          instrucciones de instalación paso a paso, en español
  docs/diseno.md     este documento
  src/Codigo.gs      lógica principal (revisión, etiquetas, borradores, resumen)
  src/Config.gs      ajustes editables (frecuencia, horas del resumen, VIP)
  src/appsscript.json manifiesto con los permisos de Gmail
  test/              pruebas en Node de las partes puras (parseo, reglas, resumen)
```

## Para quien lo construya

- Formato exacto del prompt y del JSON, manejo de errores y reintentos de la API.
- Corte por tiempo: procesar en lotes (p. ej. 20 hilos) para no pasar los 6 min.
- Una función `instalar()` que crea etiquetas y activadores en un clic.
