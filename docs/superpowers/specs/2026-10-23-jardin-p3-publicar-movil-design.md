# Diseño — Proyecto 3: Publicar desde el móvil, en el momento

> **Estado: implementado (ver `docs/bot-telegram.md`).** Decisiones: solo Telegram; commit directo; se conserva la ficha técnica del EXIF y se elimina todo lo demás (GPS incluido); `#borrador` solo con texto (repo público); fotos como foto o documento, una entrada por foto; endpoint en `api/` sin adapter. Texto original del borrador:
> Recoge lo que propone el plan maestro adaptado a Vercel y lo decidido hasta ahora. Las decisiones marcadas como "abiertas" hay que conversarlas con Javi antes de construir (usar `superpowers:brainstorming` al arrancar este proyecto).

## Contexto

Javi quiere publicar **en el momento, desde el móvil** (una foto de un viaje con Cora, un pensamiento de dos frases), no "luego, con calma desde el portátil". Sin esto, el jardín corre el riesgo de quedarse sin cuidar, que es justo lo que se quiere evitar. Los artículos largos seguirán escribiéndose en Markdown desde el portátil.

La web se despliega en **Vercel** (el dominio está en IONOS) por push a `main`. El plan maestro asume Cloudflare Workers; aquí se sustituye por funciones de Vercel. Depende de [P1 — cimientos](2026-10-23-jardin-p1-cimientos-design.md): el bot escribe ficheros con los esquemas de `jardin` y `carrete`.

## Flujo propuesto

```
[Móvil] foto + texto
   │
   ▼
[Endpoint en Vercel]   (función serverless, validada por secreto y lista de usuarios)
   │ 1. descarga la imagen original
   │ 2. la reduce (≈2560 px lado largo) y le quita el GPS del EXIF
   │ 3. genera slug y frontmatter según el esquema de P1
   │ 4. commit vía API de GitHub (imagen + .md)
   ▼
[GitHub: main o rama de revisión]
   ▼
[Deploy automático en Vercel]  → publicado en ~1 minuto
```

Piezas probables:

- `@astrojs/vercel` con la web **estática** y solo el endpoint como función (`export const prerender = false` en esa ruta, o una función en `api/` aparte para no cambiar el modo de salida del sitio).
- Entrada: bot de Telegram con webhook al endpoint, y/o Keystatic en `/keystatic` en modo GitHub (OAuth) para escribir desde la tablet.
- Cliente de la API de GitHub (`octokit` o `fetch`) con un token de permisos mínimos (solo ese repo, solo contenido).
- Con el adapter de Vercel, las redirecciones `/blog/*` → `/jardin/*` de P1 pasan a ser 301 reales sin cambiar la configuración.

## Convención de mensajes (a validar)

- Foto con pie → entrada de `carrete` (`caption` = pie).
- Texto sin foto → entrada de `jardin` tipo `pensamiento`, estado `semilla`.
- Prefijos opcionales: `#viaje asturias-2026` asocia la foto a un viaje; `#borrador` la deja sin publicar.

## No-objetivos

- No es un CMS completo: los artículos largos y los análisis se escriben en Markdown.
- Sin analítica de uso del bot ni métricas.
- Sin soporte multiusuario: solo Javi.

## Preguntas abiertas (hay que decidirlas con Javi)

1. **Canal**: ¿bot de Telegram, Keystatic, ambos? Telegram es más rápido en el momento; Keystatic, más cómodo para estructurar una nota. ¿Se usa Telegram a diario?
2. **Seguridad**: lista blanca por ID de usuario de Telegram, secreto del webhook y rotación del token de GitHub. ¿Dónde se guardan los secretos (variables de entorno de Vercel)?
3. **Publicar directo o con revisión**: ¿commit a `main` (publica en un minuto) o a una rama con PR/preview que se aprueba con un toque? Lo segundo añade fricción pero evita publicar un error.
4. **Repositorio público o privado**: si es público, las fotos originales y su historia quedan visibles; condiciona la política de EXIF y de tamaño.
5. **Fotos**: ¿se envían como "documento" (calidad original) o comprimidas por Telegram? ¿Máximo de fotos por mensaje (álbum de un viaje)?
6. **Límites de tamaño**: cuota del repo y peso máximo por foto; ¿Git LFS o simplemente reducir antes de subir?
7. **Datos EXIF**: ¿se conserva cámara/focal/apertura (útiles para la ficha) y se elimina solo el GPS? ¿Se rellena `location` a partir del texto?
8. **Fallos**: ¿cómo se entera Javi de que un envío falló (respuesta del bot con el enlace o el error)?
9. **`#borrador` y privacidad de la imagen**: Astro emite a `dist/_astro/` el original de cualquier imagen de contenido, también la de un borrador (ver P1). Un borrador oculta la entrada, no el fichero. Si "borrador" debe significar "privado", hay que no commitear la imagen hasta publicar (p. ej., guardarla fuera del repo o en una rama).
10. **Idempotencia**: evitar entradas duplicadas si Telegram reintenta el webhook.

## Restricciones heredadas

- Cero scripts de terceros en el cliente. El endpoint corre en servidor, no afecta a ese test.
- El frontmatter generado debe cumplir exactamente los esquemas Zod de P1 (`slug` entre comillas o no: el test lo acepta).
- Si se escribe en producción de cualquier sistema externo, confirmar siempre con el usuario antes (regla global del usuario).

## Verificación prevista

Prueba de extremo a extremo en una rama: enviar foto y texto desde el móvil, comprobar el commit, el preview de Vercel, que el EXIF de GPS no está en el fichero publicado y que un mensaje de un usuario no autorizado se rechaza.
