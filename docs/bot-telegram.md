# Bot de Telegram para publicar desde el móvil

Un webhook de Telegram llama a `api/telegram.mjs` (función de Vercel). La función descarga la foto, la reduce y la deja sin metadatos, genera el frontmatter según `src/content.config.ts` y hace **un commit** con la imagen y el `.md` a la rama configurada. Vercel despliega por push, así que se publica en ~1 minuto. El sitio sigue siendo estático: solo `api/` es una función.

Código: `bot/` (lógica, con dependencias inyectadas), `api/telegram.mjs` (endpoint), `scripts/telegram-webhook.mjs` (registro del webhook), `tests/bot.test.mjs`.

## Puesta en marcha

1. **Crear el bot**: en Telegram, hablar con `@BotFather` → `/newbot`. Guardar el token.
2. **Tu ID de usuario**: escribir a `@userinfobot`. Solo los IDs de `TELEGRAM_ALLOWED_USERS` pueden publicar; el resto se ignora en silencio.
3. **Token de GitHub**: Settings → Developer settings → *Fine-grained personal access tokens*. Solo este repositorio, permiso **Contents: Read and write** y nada más. Ponle caducidad y rota el token antes de que venza.
4. **Variables de entorno en Vercel** (Project → Settings → Environment Variables):

   | Variable | Valor |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | token de BotFather |
   | `TELEGRAM_WEBHOOK_SECRET` | cadena aleatoria larga (la inventas tú) |
   | `TELEGRAM_ALLOWED_USERS` | tu ID; varios, separados por comas |
   | `GITHUB_TOKEN` | el token fine-grained |
   | `GITHUB_REPO` | `llinagz/javi-llinares-personal-web` |
   | `GITHUB_BRANCH` | opcional; por defecto `main` |
   | `SITE_URL` | opcional; por defecto `https://javierllinares.eu` |

5. **Registrar el webhook** una vez desplegado:

   ```bash
   TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… npm run bot:webhook -- https://javierllinares.eu/api/telegram
   ```

## Qué entiende el bot

Lo mismo que responde `/ayuda` (también `/start` y `/help`), organizado por secciones y con ejemplos. El texto está en `HELP`, en `bot/mensaje.mjs`; si cambias las etiquetas, actualiza ambos sitios y el manual de contenido (un test comprueba que la ayuda mencione cada etiqueta y quepa en un mensaje de Telegram):

| Envías | Resultado |
|---|---|
| Texto | Pensamiento del jardín. Primera línea = título; el resto = cuerpo (con una sola línea sirve de ambos) |
| Foto (o imagen como documento) con pie | Foto del carrete. Primera línea del pie = título; el resto = `caption` |
| `#semilla`, `#creciendo`, `#perenne` (texto) | Etapa de la entrada; por defecto `semilla` |
| `#destacada` (texto) | Escribe `featured: true`: la entrada va la primera en la rejilla "El jardín" de la portada. Con fotos se rechaza |
| `#viaje <slug>` (foto) | Asocia la foto al viaje. Si no existe, lo crea publicado (título del slug, lugar = título, inicio = fecha de la foto, resumen provisional) en el mismo commit |
| Cualquier otra `#palabra` (texto o foto) | Tema (`topics`, en minúsculas y sin repetir); se quita del título y del slug. Cada tema tiene su página en `/temas/<tema>/` |
| `#borrador` (texto) | `draft: true`. No vale con fotos |
| `/ahora` | Muestra el estado de la tarjeta "Ahora" (sin commit) |
| `/ahora leyendo Dune, Ubik` | Añade a la lista (`leyendo`, `jugando`, `escuchando` o `construyendo`), sin duplicados. Un commit en `src/content/now.md` con `updated` = hoy |
| `/ahora quitar leyendo Dune` | Quita un elemento (sin distinguir mayúsculas ni tildes); si no está, responde con un error y no hace commit |
| `/ahora vaciar jugando` | Vacía la lista (su fila desaparece de la portada) |
| `/ahora nota <texto>` | Reemplaza la nota libre de la tarjeta; sin texto, la borra |

`/ahora` es un comando, no una etiqueta: la lógica está en `bot/ahora.mjs` (lee y reescribe `now.md` con `frontmatter()`); si cambias el esquema de `now` en `src/content.config.ts`, revísalo. Las etiquetas pueden ir en cualquier parte y se quitan del texto. Orden en la portada: el jardín usa `created` y las fotos `date`, ambos **con hora** cuando el bot la conoce (hora del mensaje; en fotos con EXIF, la de la cámara interpretada como hora de Madrid), para que lo último enviado el mismo día sea lo que sale en la home.

## Probarlo sin tocar producción

Usa un segundo bot (otro token de BotFather) y una rama de pruebas:

- Crea la rama `prueba-bot` y despliega un preview con `GITHUB_BRANCH=prueba-bot` y el token del bot de pruebas (variables de entorno solo para *Preview*).
- Si el preview tiene Deployment Protection, el webhook de Telegram no podrá llamarlo: desactívala para ese preview o usa un bypass para automatización.
- Registra el webhook del bot de pruebas apuntando a la URL del preview.
- Envía: un texto, una foto con `#viaje <slug>` (con un slug nuevo, para ver que crea el viaje) y `#tema`, una imagen como documento con GPS y un mensaje desde otra cuenta. Comprueba el commit en la rama, que la imagen publicada no tiene GPS (`npx exifr` o similar) y que el mensaje ajeno no hace nada.

## Notas de seguridad y límites

- El endpoint exige la cabecera `X-Telegram-Bot-Api-Secret-Token`; sin ella responde 401.
- Responde siempre 200 tras procesar, para que Telegram no reintente. Aun así, cada commit lleva el trailer `Telegram-Update: <id>` y se descarta un update ya procesado.
- El repo es público: lo que se manda con foto queda en el historial. Por eso `#borrador` se rechaza con fotos.
- Telegram limita la descarga a 20 MB. HEIC no se admite (envía como foto normal o JPEG).
- Si cambias un esquema de `jardin` o `carrete`, revisa `bot/entrada.mjs`; los tests lo cubren.
