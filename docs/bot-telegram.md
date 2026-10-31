# Bot de Telegram para publicar desde el móvil

Un webhook de Telegram llama a `api/telegram.mjs` (función de Vercel). La función descarga la foto, la reduce y la deja sin metadatos, la **sube a Vercel Blob**, genera el frontmatter según `src/content.config.ts` y hace **un commit** con el `.md` (que lleva la URL de la imagen) a la rama configurada. Vercel despliega por push, así que se publica en ~1 minuto. El sitio sigue siendo estático: solo `api/` es una función. En el build, Astro descarga las fotos de Blob y las optimiza (WebP + `srcset`) como las locales.

Las fotos viven fuera de git a propósito: así `/borrar` las elimina de verdad y el repo no crece con cada foto.

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

5. **Almacén de fotos (Vercel Blob)**: en Vercel, *Storage* → *Create* → **Blob** con acceso **público** → conéctalo al proyecto en *Production* y *Preview*. La conexión inyecta las credenciales que usa `@vercel/blob` (`BLOB_READ_WRITE_TOKEN`, o `BLOB_STORE_ID` con OIDC); no hay que escribirlas a mano. Sin el almacén conectado, las fotos fallan con un error y no se publica nada. El build también descarga las fotos desde `*.public.blob.vercel-storage.com` (ver `image.remotePatterns` en `astro.config.mjs`).
6. **Registrar el webhook** una vez desplegado (hay que repetirlo si el webhook se registró antes de existir los botones de `/borrar`: ahora pide también `callback_query`):

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
| `/ultimas` | Lista las últimas 10 piezas del jardín y del carrete (`jardin/<slug>`, título, fecha y «borrador»). Sin commit |
| `/borrar` (respondiendo a un «Publicado…» / «Guardado como borrador…» del bot) o `/borrar <slug>` | Pide confirmación con **[Sí, borrar] [Cancelar]**. Al confirmar, un commit elimina el `.md` (y la imagen local, si ninguna otra entrada la usa) y, si la foto está en Blob, se borra del almacén. Avisa si el viaje se queda sin fotos (no lo borra) |
| `/ocultar`, `/mostrar` (por respuesta o con slug) | Solo textos del jardín: pone o quita `draft: true` en un commit, sin confirmación. Con fotos responde que uses `/borrar` |

**Borrar y el historial de git**: una foto del bot solo está en Blob, así que al borrarla desaparece del todo (los despliegues antiguos de Vercel conservan su copia optimizada en `/_astro/` mientras existan). Un texto borrado deja su `.md`, de unos pocos KB, en el historial: es público y pesa poco, y reescribirlo exigiría un `force push`. `/borrar` rechaza las entradas `ejemplo-*` (los tests las necesitan). Los botones no guardan estado: el destino se lee del texto del propio mensaje de confirmación.

`/ahora` es un comando, no una etiqueta: la lógica está en `bot/ahora.mjs` (lee y reescribe `now.md` con `frontmatter()`); si cambias el esquema de `now` en `src/content.config.ts`, revísalo. Las etiquetas pueden ir en cualquier parte y se quitan del texto. Orden en la portada: el jardín usa `created` y las fotos `date`, ambos **con hora** cuando el bot la conoce (hora del mensaje; en fotos con EXIF, la de la cámara interpretada como hora de Madrid), para que lo último enviado el mismo día sea lo que sale en la home.

## Probarlo sin tocar producción

Usa un segundo bot (otro token de BotFather) y una rama de pruebas:

- Crea la rama `prueba-bot` y despliega un preview con `GITHUB_BRANCH=prueba-bot` y el token del bot de pruebas (variables de entorno solo para *Preview*).
- Si el preview tiene Deployment Protection, el webhook de Telegram no podrá llamarlo: desactívala para ese preview o usa un bypass para automatización.
- Registra el webhook del bot de pruebas apuntando a la URL del preview.
- Conecta también el almacén Blob a *Preview* y vuelve a registrar el webhook del bot de pruebas (para que incluya `callback_query`).
- Envía: un texto, una foto con `#viaje <slug>` (con un slug nuevo, para ver que crea el viaje) y `#tema`, una imagen como documento con GPS y un mensaje desde otra cuenta. Comprueba que el commit solo trae el `.md`, que la imagen subida a Blob no tiene GPS (`npx exifr` o similar) y que el mensaje ajeno no hace nada.
- Gestión: `/ultimas`; `/ocultar` y `/mostrar` sobre el texto; `/borrar` sobre la foto con **Cancelar** (no pasa nada) y luego con **Sí** (commit que borra el `.md` y fichero desaparecido del almacén en el dashboard de Vercel); y `/borrar ejemplo-faro` (debe rechazarse).

## Notas de seguridad y límites

- El endpoint exige la cabecera `X-Telegram-Bot-Api-Secret-Token`; sin ella responde 401.
- Responde siempre 200 tras procesar, para que Telegram no reintente. Aun así, cada commit lleva el trailer `Telegram-Update: <id>` y se descarta un update ya procesado.
- El repo es público y la URL de la foto aparece en su `.md`, y Blob es público: cualquiera con la URL puede ver la imagen. Por eso `#borrador` se rechaza con fotos. Si la foto falla al hacer el commit, el bot retira la imagen del almacén para no dejar huérfanas.
- Telegram limita la descarga a 20 MB. HEIC no se admite (envía como foto normal o JPEG).
- Si cambias un esquema de `jardin` o `carrete`, revisa `bot/entrada.mjs`; los tests lo cubren.
