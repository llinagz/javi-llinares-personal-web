# Diseño — Proyecto 1: Cimientos del jardín digital


## Contexto e intención

Javi quiere desligarse de las redes sociales y convertir `javierllinares.eu` en **un rincón personal que cuidar**, sin la inmediatez ni el postureo de las redes. Ahí irá dejando reflexiones, artículos, análisis de videojuegos y libros, fotos de sus viajes con Cora y pensamientos fugaces.

Fuente: el plan maestro (`Downloads/plan_maestro_jard_n_digital_y_desconexi_n_de_redes.md`), ajustado en conversación. El rediseño completo se divide en cuatro proyectos, en este orden acordado:

1. **Cimientos del jardín** ← este documento
2. Nuevo aspecto: portada "mesa de trabajo", modo lectura papel cálido, mesa de luz del carrete con lightbox.
3. Publicar desde el móvil, en el momento (foto + texto): bot o CMS en Vercel que hace commit en GitHub.
4. Conexiones: `[[wiki-links]]`, backlinks y hover previews.

Este proyecto crea el **modelo de contenido** sobre el que se apoyan los demás. En particular, el bot del proyecto 3 escribirá ficheros con estos esquemas, así que el formato del frontmatter debe ser sencillo de generar por máquina.

## Objetivos

- Sustituir la colección `blog` por **`jardin`**, con tipos y estados de madurez.
- Crear **`carrete`** (una entrada por foto) y **`viajes`** (agrupan fotos).
- Migrar los 3 posts existentes sin romper sus URLs.
- Mantener **proyectos** y **servicios** tal cual, en segundo plano.
- Dejar el sitio funcionando, con `npm run check` y `npm test` en verde, y con el aspecto visual actual.

## No-objetivos (van a proyectos posteriores)

- Rediseño visual: portada bento, tema warm-paper, View Transitions, sidenotes, masonry, lightbox. Todo eso es del proyecto 2.
- Bot de Telegram, Keystatic o adapter de Vercel (proyecto 3).
- Wiki-links, backlinks y previews (proyecto 4).
- **Crónicas de montaña con GPX**: fuera por ahora. Javi no las mencionó entre lo que quiere publicar.
- Estantería de obras leídas o jugadas: descartada. Los análisis son entradas del jardín con ficha.
- `now.md`: es del proyecto 2.

## Anti-objetivos (sería un fracaso aunque funcione)

- Métricas de vanidad: contadores, likes, comentarios públicos.
- Scripts de terceros. Ya hay un test que lo impide.
- Romper enlaces existentes a `/blog/...`.
- Un frontmatter tan complejo que publicar una nota de dos frases dé pereza, o que el bot del proyecto 3 no pueda generarlo con facilidad.

## Restricciones

- Stack actual: Astro 5, TypeScript strict, Tailwind 3 y npm (no pnpm, como dice el plan maestro). Salida estática; despliegue en Vercel por push a `main`.
- Convenciones del repo (CLAUDE.md):
  - `slug` en el frontmatter;
  - rutas generadas con `data.slug`;
  - imágenes vía `image()` en `src/assets/images/<colección>/` y `<Image>`;
  - tokens y clases de `global.css`;
  - JS de cliente mínimo.
- Todo el contenido y la UI, en español.

## Modelo de contenido (decidido con Javi)

### `jardin` → `src/content/jardin/*.md`

| Campo | Tipo | Notas |
|---|---|---|
| `title` | string | |
| `slug` | string | único |
| `description` | string? | Si falta, se usa un extracto del cuerpo para la meta description y las tarjetas. *(Decisión mía: los pensamientos fugaces no deben exigirla.)* |
| `type` | enum `pensamiento \| reflexion \| articulo \| analisis` | Por defecto, `pensamiento`. Etiquetas visibles: Pensamiento, Reflexión, Artículo, Análisis. |
| `stage` | enum `semilla \| creciendo \| perenne` | Por defecto, `semilla`. Se muestra como 🌱 Semilla, 🌿 Creciendo, 🌳 Perenne. |
| `created` | date (coerce) | |
| `updated` | date? (coerce) | Fecha del "último riego". |
| `topics` | string[] | Por defecto, `[]`. |
| `image` | image()? | |
| `featured` | boolean | Por defecto, `false`. |
| `draft` | boolean | Por defecto, `false`. |
| `work` | objeto? | Ficha de la obra: `{ title, kind: libro\|videojuego, creator, year?, platform? }`. **Obligatoria cuando `type: analisis`**; validar con `superRefine`. |

- **Orden**: por `updated ?? created`, de más reciente a más antiguo. Hace falta un helper nuevo en `src/lib/content.ts`, porque `sortByDateDesc` asume `data.date`. Proyectos lo sigue usando.
- **Tiempo de lectura**: se calcula a partir del cuerpo; desaparece el campo manual `readingTime`. *(Decisión mía.)*

### `viajes` → `src/content/viajes/*.md`

| Campo | Tipo | Notas |
|---|---|---|
| `title` | string | p. ej. "Asturias" |
| `slug` | string | |
| `place` | string | |
| `startDate` | date | |
| `endDate` | date? | |
| `summary` | string | Se usa para la meta description. |
| `cover` | image()? | Si falta, se usa la primera foto del viaje. |

El cuerpo del Markdown es el relato breve del viaje.

### `carrete` → `src/content/carrete/*.md`, imágenes en `src/assets/images/carrete/`

| Campo | Tipo | Notas |
|---|---|---|
| `title` | string | |
| `slug` | string | |
| `date` | date | |
| `image` | image() | |
| `alt` | string? | Si falta, se usa `caption` y, después, `title`. *(Decisión mía: publicar desde el móvil no debe exigirlo.)* |
| `caption` | string? | |
| `location` | string? | |
| `trip` | reference('viajes')? | El viaje al que pertenece. |
| `camera`, `focalLength`, `aperture`, `shutterSpeed` | string? | |
| `iso` | number? | |
| `draft` | boolean | Por defecto, `false`. |

`reference()` resuelve por id. El loader `glob` de Astro 5 usa el `slug` del frontmatter como id (lo ha confirmado el revisor), así que `trip: "asturias-2026"` funciona directamente.

## Contenido de prueba (decidido con Javi: "imágenes de prueba para probar en local")

- **Los borradores se ven en `npm run dev` y nunca en el build.** Para ello habrá un helper único, p. ej. `isPublished(entry) = !entry.data.draft || import.meta.env.DEV`, que se usa en `getStaticPaths`, listados, RSS y navegación. *(Decisión mía: así el contenido de prueba no llega a producción y, de paso, ejercita el filtro de borradores en los tests.)*
- **Carrete**: 3–4 imágenes de prueba generadas con `sharp`, que ya viene con Astro. Serán degradados o formas con un rótulo "EJEMPLO", con proporciones distintas (3:2, 4:5, 16:9, 2:3). Irán en `src/assets/images/carrete/ejemplo-*.jpg`, con un viaje de ejemplo (`viajes/ejemplo.md`). Todo con `draft: true`. **Corrección tras construirlo**: Astro sí emite a `dist/_astro/` el original de toda imagen declarada con `image()`, también la de un borrador (igual que ya ocurre con los PNG de los proyectos). Ninguna página la enlaza, pero el fichero queda accesible por su URL con hash. Consecuencia: `draft: true` oculta la entrada, no la imagen, así que **no se commitean fotos privadas**. El test comprueba que ninguna página referencia imágenes de borradores.
- **Jardín**: un pensamiento de dos frases y un análisis con ficha, ambos `draft: true`, para probar en local los tipos, el extracto automático y la ficha. *(Decisión mía.)*
- **Sin fotos publicadas**: `/carrete/` muestra un estado vacío tranquilo, y "Carrete" se oculta del menú hasta que haya al menos una foto publicada. *(Decisión mía.)*
- **Fotos reales, cuando lleguen**: reducirlas a un máximo de unos 2560 px de lado largo y quitar el GPS del EXIF antes de commitearlas. Es privacidad: el repo en GitHub conserva los originales. Este proyecto solo lo documenta en `CLAUDE.md`; automatizarlo es cosa del proyecto 3.

## Rutas y páginas

| Ruta | Contenido |
|---|---|
| `/jardin/` | Todas las entradas publicadas, con tipo, estado, fecha y extracto, y enlaces de filtro por tipo. |
| `/jardin/tipo/<tipo>/` | Listado estático filtrado por tipo (sin JS). *(Decisión mía.)* |
| `/jardin/<slug>/` | Entrada. Muestra estado, tipo, fechas (creado / regado), temas y tiempo de lectura; si es un análisis, la ficha de la obra. Reutiliza la estructura de `BlogPostLayout`, que se renombra o adapta. |
| `/carrete/` | Fotos publicadas, de la más reciente a la más antigua, con micro-metadatos en mono (lugar · fecha · cámara), y un bloque con los viajes. Retícula sencilla con las clases actuales. |
| `/carrete/<slug>/` | Página de una foto, con su permalink: imagen grande, pie, metadatos y enlace al viaje. *(Decisión mía: tener permalinks propios es parte de "ser dueño" del contenido.)* |
| `/carrete/viajes/<slug>/` | Relato del viaje y sus fotos en orden cronológico. |
| `/blog/` y `/blog/<slug>/` | **Redirigen** a `/jardin/` y `/jardin/<slug>/` mediante `redirects` en `astro.config.mjs`. *(Decisión mía: en estático genera una página de redirección; cuando el proyecto 3 añada el adapter de Vercel, pasarán a ser 301 reales sin tocar nada.)* |
| `/rss.xml` | Feed del jardín, con todos los tipos y `pubDate = created`. Las fotos no entran por ahora. |

Proyectos (`/projects/...`), `/servicios/diseno-web`, `/about` y `/404` no cambian, salvo los enlaces que apunten a `/blog`.

## Migración

- Los 3 posts de `src/content/blog/` pasan a `src/content/jardin/`, conservando el mismo `slug`, con `type: articulo` y `stage: perenne`.
- Correspondencia de campos: `date` → `created`, `excerpt` → `description`, `category` + `tags` → `topics` (en minúsculas y sin duplicados). Se conservan `featured` y `draft`.
- Las imágenes pasan de `src/assets/images/blog/` a `src/assets/images/jardin/`.
- Se elimina la colección `blog` y `src/pages/blog/`. Solo quedan las redirecciones.

## Navegación y textos

- **Header y Footer**: Jardín y Carrete van primero; Proyectos, Servicios y Sobre mí, después.
- **Portada**: `LatestArticlesSection` pasa a mostrar las entradas destacadas del jardín y a enlazar a `/jardin`. El botón del hero "Leer el blog" pasa a "Entrar al jardín".
- **Textos de "consola"** (`./blog` en el hero, en `LatestArticlesSection` y en el `content:` de `global.css`): pasan a `./jardin` y `./carrete`. El resto de la portada no cambia; su rediseño es el proyecto 2.
- **404**: el enlace "Blog →" pasa a "Jardín →".

## Tests (`tests/build-output.test.mjs`)

- El regex que lee `slug` y `draft` del frontmatter acepta valores con y sin comillas, porque el bot del proyecto 3 no tiene por qué entrecomillar.
- Comprobar la unicidad de slugs para `jardin`, `carrete` y `viajes`, además de `projects`. Comprobar que existe página para cada entrada **publicada**.
- Los borradores de `jardin`, `carrete` y `viajes` no se publican. Esta vez se comprueba de verdad, porque el contenido de prueba es borrador. Ninguna página referencia sus imágenes (`ejemplo-*`); ver la corrección sobre `dist/_astro/` más arriba.
- Excluir las páginas de redirección (`http-equiv="refresh"`) de los tests de metadatos y del sitemap.
- Test nuevo: cada `/blog/<slug>/` antiguo redirige a `/jardin/<slug>/`.
- El RSS contiene exactamente las entradas publicadas del jardín, con enlaces `/jardin/<slug>/`.
- El test de `og:type=article` pasa a buscar en `/jardin/`.

## Documentación

Actualizar `CLAUDE.md` (colecciones, rutas, imágenes) y `docs/design-system.md` solo si se añaden patrones nuevos (por ejemplo, el badge de estado).

## A criterio del builder

- Componentes exactos: badge de estado o tipo, ficha de obra, tarjeta de foto.
- Cómo se calcula el extracto y el tiempo de lectura.
- Si el layout de entrada se renombra (`GardenEntryLayout`) o se adapta.
- La estructura interna de `lib/content.ts`.

## Verificación

1. `npm run check`, sin errores de tipos.
2. `npm test`: build y pruebas de humo en verde, incluidas las nuevas.
3. `npm run dev`, con los borradores visibles, y recorrer en el navegador:
   - `/`, `/jardin/`, `/jardin/tipo/articulo/` y una entrada;
   - `/blog/leer-mejor-para-construir-mejor-tecnologia/`, que debe redirigir;
   - `/carrete/`, una foto, un viaje y `/rss.xml`.
4. Confirmar que `/projects/` y `/servicios/diseno-web` siguen intactos.

## Siguiente paso tras aprobar

1. Convertir este diseño en un plan de implementación paso a paso (writing-plans).
2. Ejecutarlo en una rama nueva (no en `main`).
3. Abrir un PR al terminar.

## Entregable adicional (pedido por Javi): specs de los siguientes proyectos

En `docs/superpowers/specs/`, un spec por proyecto pendiente. Cada uno recoge lo decidido en esta conversación, lo que propone el plan maestro y las **preguntas abiertas** que habrá que resolver con Javi antes de construirlo. Todavía no se han conversado a fondo, así que no se presentan como decisiones cerradas.

- **`2026-10-23-jardin-p2-aspecto-design.md`** — portada "mesa de trabajo" (bento, módulo `/now`, última entrada regada, última foto), modo de lectura papel cálido, sidenotes, View Transitions y mesa de luz del carrete (masonry y lightbox).
  - Preguntas abiertas: ¿se mantiene la dirección actual "Matrix + Papel" o se pasa al "taller oscuro" del plan maestro? ¿Qué fuente serif? ¿Qué pasa con las secciones actuales de la portada (servicios, newsletter, filosofía)?
- **`2026-10-23-jardin-p3-publicar-movil-design.md`** — publicar en el momento desde el móvil, en Vercel, sin Cloudflare.
  - Plan: adapter `@astrojs/vercel` con la web estática salvo un endpoint; commit vía la API de GitHub; redimensionar y quitar el GPS de las fotos; generar slug y frontmatter según los esquemas de P1; redirecciones 301 reales.
  - Preguntas abiertas: ¿bot de Telegram, Keystatic o ambos? ¿Seguridad (lista de usuarios permitidos)? ¿Se publica directamente o como borrador? ¿El repo es público?
- **`2026-10-23-jardin-p4-conexiones-design.md`** — plugin remark para `[[slug]]` y `[[slug|texto]]`, `src/lib/gardenGraph.ts` con `getBacklinks`, componente de backlinks y hover previews.
  - Preguntas abiertas: ¿qué se hace con un enlace roto (error de build o aviso)? ¿Las previews necesitan JS o basta con CSS? ¿Se puede enlazar a fotos y viajes?

El spec de P1 (este documento) también se guarda allí, como `2026-10-23-jardin-p1-cimientos-design.md`.
