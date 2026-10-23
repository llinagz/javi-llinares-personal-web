# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sitio personal editorial de Javi Llinares: Astro 5 + TypeScript (strict) + Tailwind 3, mayormente estático. No es una aplicación ni un SPA; solo añadir islas de cliente cuando aporten valor real. El contenido y la UI están en español (`<html lang="es">`).

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # build estático a dist/
npm run preview   # sirve dist/
npm run check     # astro check (type-check de .astro/.ts) — es lo más parecido a lint
npm test          # build + pruebas de humo sobre dist/ (node:test)
npm run nuevo     # asistente: crea un fichero de contenido (jardín, foto o viaje) con el frontmatter relleno
```

- **Publicar contenido**: ver `docs/manual-contenido.md` (qué fichero crear, campos de cada colección, imágenes y borradores). `npm run nuevo` (`scripts/nuevo.mjs`, sin dependencias) genera el fichero con los campos de `src/content.config.ts`; si cambias un esquema, actualiza también el script y el manual. Admite `npm run nuevo -- jardin "Título"`, nunca sobrescribe y deja todo como borrador por defecto.
- No hay linter. Antes de terminar un cambio, ejecutar `npm run check` y `npm test` (este ya incluye el build).
- Un solo test: `node --test --test-name-pattern="sitemap" tests/build-output.test.mjs` (requiere `dist/` ya construido).
- Los scripts usan `cross-env` para desactivar la telemetría de Astro; funcionan en cualquier shell.
- CI en `.github/workflows/ci.yml` ejecuta `check` y `test` (Node 22) en push a `main` y en PRs.

## Arquitectura

- **Contexto**: la web es un "jardín digital" personal (ver `docs/superpowers/specs/`: P1 cimientos y P2 aspecto, ya hechos; P3 publicar desde el móvil y P4 wiki-links/backlinks son borradores pendientes). Proyectos y servicios siguen en segundo plano.
- **Content Collections** (`src/content.config.ts`): `jardin`, `viajes`, `carrete`, `projects` y `now`, todas con loader `glob` sobre `src/content/<colección>/**/*.md` y esquema Zod. Cada entrada lleva un campo `slug` **en el frontmatter**, independiente del nombre del fichero (y es su `id`, por eso `carrete.trip` referencia un viaje por su slug); las rutas se generan con `entry.data.slug`, no con `entry.id` (ver `src/pages/jardin/[slug].astro`). Los tests comprueban que los slugs sean únicos.
- `jardin`: `type` (`pensamiento | reflexion | articulo | analisis`), `stage` (`semilla | creciendo | perenne`), `created` y `updated` (último "riego": el orden es `updated ?? created`). `description` es opcional (el extracto sale del cuerpo) y `readingTime` se calcula. Un `analisis` exige la ficha `work`. `carrete.alt` es opcional (cae a `caption` y luego a `title`).
- **Borradores**: `draft: true` se filtra con `isPublished` (`src/lib/content.ts`) en `getStaticPaths`, listados, RSS y navegación. Se ven en `npm run dev` y nunca en el build. Ojo: Astro emite igualmente a `dist/_astro/` el original de cualquier imagen declarada con `image()`, también la de un borrador, así que **no commitear fotos privadas**. El contenido `ejemplo-*` (carrete, viajes y jardín) es de prueba y siempre es borrador.
- `now` es un único fichero, `src/content/now.md` (sin `slug`; los tests de slugs no lo recorren): `updated` y las listas `reading`, `playing`, `listening` y `building`. Las listas vacías ocultan su fila en `NowWidget`. El "último viaje" no se escribe ahí: sale del viaje publicado más reciente.
- `featured: true` decide qué entradas del jardín salen en "Para empezar" en la home (`src/pages/index.astro`), después de la entrada regada más recientemente, que va aparte. "Carrete" solo sale en Header/Footer si hay al menos una foto publicada (`hasPublishedPhotos`).
- `projects.status` es un enum cerrado (`"En desarrollo" | "MVP" | "Idea" | "Publicado"`); `date` se coacciona con `z.coerce.date()`.
- **Imágenes**: `image` en el frontmatter usa el helper `image()` del esquema, así que es una ruta relativa al `.md` hacia `src/assets/images/{jardin,carrete,projects}/` (p. ej. `"../../assets/images/projects/atx.png"`) y se renderiza con `<Image>` de `astro:assets` (WebP + `srcset`). No poner imágenes de contenido en `public/`. Es opcional (salvo en `carrete`) y los layouts/listados la renderizan condicionalmente. Fotos reales: reducir a ~2560 px de lado largo y quitar el GPS del EXIF antes de commitear.
- **Rutas**: `/jardin/`, `/jardin/tipo/<tipo>/`, `/jardin/<slug>/`, `/carrete/`, `/carrete/<slug>/`, `/carrete/viajes/<slug>/`. Las antiguas `/blog/` y `/blog/<slug>/` redirigen al jardín mediante `redirects` en `astro.config.mjs` (en estático son páginas `meta refresh`; con un adapter serían 301).
- `src/lib/content.ts`: helpers compartidos (`isPublished`, `sortByDateDesc`, `sortByTendedDesc`, `lastTended`, `formatDate` con locale `es`, `excerpt`, `readingTime`, etiquetas `gardenTypes` / `gardenStages`) y los alias de tipos `GardenEntry` / `Trip` / `Photo` / `Project`.
- Capas: `layouts/` (`BaseLayout` envuelve Header/Footer y emite canonical + Open Graph/Twitter; `GardenEntryLayout` y `ProjectLayout` renderizan el contenido Markdown vía `<slot />` y le pasan `image` para `og:image`) → `pages/` → `components/{layout,sections,ui}`. La home es una rejilla bento ("mesa de trabajo") compuesta en `index.astro` con `HomeIntro`, `NowWidget`, `RecentGardenEntry`, `RecentPhoto` y `StartHere` (`components/sections/`); si no hay foto o `now` con contenido, esas piezas no se pintan y la rejilla se reacomoda. Los textos de `HomeIntro` son provisionales.
- Alias `@/*` → `src/*` (tsconfig).
- **SEO**: `site` en `astro.config.mjs` (`https://javierllinares.eu`, dominio de producción) alimenta canonical, sitemap (`@astrojs/sitemap`), `rss.xml.ts` y `robots.txt.ts` (endpoints). `404.astro` es la página de error.
- **Lectura en papel y notas al margen**: todas las entradas del jardín usan `reading-page` / `reading-column` (Literata autoalojada con `@fontsource-variable/literata`, importada solo en `GardenEntryLayout`). Las notas al pie de Markdown (`[^1]`) las convierte en notas al margen el plugin rehype `src/lib/rehype-sidenotes.mjs` (registrado en `astro.config.mjs`); el CSS está en `global.css` (`.sidenote*`). `excerpt()` ignora las marcas `[^n]`.
- **JS de cliente mínimo**: solo el `<script>` del menú móvil en `Header.astro` y el del `<dialog>` de `Lightbox.astro` (visor del carrete; su `<img>` se crea desde el script porque el test exige `width`/`height` en todo `<img>` del HTML). La animación de entrada es CSS puro (`[data-reveal]` + `--reveal-index` en `global.css`) y la transición entre páginas es View Transitions entre documentos por CSS (`@view-transition`), sin `ClientRouter`. No añadir scripts de terceros: un test lo impide.

## Tests

`tests/build-output.test.mjs` no prueba componentes: inspecciona `dist/` tras el build (metadatos/OG por página, enlaces internos, imágenes WebP con dimensiones, sin PNG de `/_astro/` ni scripts externos, sin fuentes de Google, la portada enlaza la entrada regada más recientemente, sitemap, RSS, robots, borradores no publicados, slugs únicos, redirecciones `/blog/…`). El build no ejercita lo que depende de borradores (foto reciente, notas al margen de `ejemplo-pensamiento`, lightbox): para eso, revisión en `npm run dev`. Las páginas de redirección se excluyen de los tests de metadatos y del sitemap. El test de borradores falla si no queda ninguno de prueba (si lo ves, no borres todos los `ejemplo-*`). Si añades una página o colección, normalmente basta con que el build la genere; amplía el test solo para invariantes nuevas.

## Estilos y diseño

- `src/styles/global.css` define tokens CSS (`--color-*`) y las clases de sistema propias (`matrix-page`, `matrix-section`, `paper-band`, `paper-panel`, `prose-shell`, `prose-content`, `display-type`, `editorial-serif`, `terminal-link`, …). `tailwind.config.mjs` expone los tokens como colores: `primary*`, `background`, `surface`, `text`, `muted`, `border`, `ink`, `paper`, `clay`, `clay-light`, `terminal`, `terminal-soft`, `terminal-text`.
- `ink`, `paper`, `terminal`, `terminal-text` y `clay-light` se definen como canales RGB (`--color-*-rgb`) para admitir modificadores de opacidad: `text-terminal-text/[0.72]`. No escribir hex ni `rgba()` arbitrarios en las plantillas.
- Los modificadores de opacidad de Tailwind solo existen para valores de su escala (5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95) o en forma arbitraria `/[0.58]`. Una clase como `text-white/72` **no genera CSS** y no avisa.
- Tailwind se integra con `applyBaseStyles: false`; el reset/base vive en `global.css`.
- Lenguaje visual actual: "Editorial CLI" / "Matrix + Papel" — bandas oscuras (terminal) alternadas con bandas cálidas de papel; la monoespaciada solo para labels/metadatos; cuerpos largos nunca directamente sobre fondo oscuro. Color de marca `#16524e`. Evitar layouts SaaS, sombras pesadas y animación excesiva.
- `docs/design-system.md` es la fuente de verdad visual: reutilizar tokens/patrones antes de crear nuevos y actualizarlo cuando cambie la dirección visual.
- Fuente display (Cabinet Grotesk) se carga desde Fontshare en `BaseLayout.astro`; la serif general es la del sistema (Georgia) y la de lectura del jardín es Literata autoalojada. Un test impide cargar fuentes de Google.
- `muted` (#5c6763) y `prose` (#34352f) son hex, no canales RGB: no admiten modificadores de opacidad (`text-muted/70` no genera CSS). `.terminal-label` y `.terminal-link` son para fondos oscuros; sobre papel usa utilidades propias (y ojo: al ir en `global.css` después de las utilidades de Tailwind, ganan a `text-primary`).
