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

## Probarlo sin tocar producción

Usa un segundo bot (otro token de BotFather) y una rama de pruebas:

- Crea la rama `prueba-bot` y despliega un preview con `GITHUB_BRANCH=prueba-bot` y el token del bot de pruebas (variables de entorno solo para *Preview*).
- Si el preview tiene Deployment Protection, el webhook de Telegram no podrá llamarlo: desactívala para ese preview o usa un bypass para automatización.
- Registra el webhook del bot de pruebas apuntando a la URL del preview.
- Envía: un texto, una foto con `#viaje <slug>`, una imagen como documento con GPS y un mensaje desde otra cuenta. Comprueba el commit en la rama, que la imagen publicada no tiene GPS (`npx exifr` o similar) y que el mensaje ajeno no hace nada.

## Notas de seguridad y límites

- El endpoint exige la cabecera `X-Telegram-Bot-Api-Secret-Token`; sin ella responde 401.
- Responde siempre 200 tras procesar, para que Telegram no reintente. Aun así, cada commit lleva el trailer `Telegram-Update: <id>` y se descarta un update ya procesado.
- El repo es público: lo que se manda con foto queda en el historial. Por eso `#borrador` se rechaza con fotos.
- Telegram limita la descarga a 20 MB. HEIC no se admite (envía como foto normal o JPEG).
- Si cambias un esquema de `jardin` o `carrete`, revisa `bot/entrada.mjs`; los tests lo cubren.
