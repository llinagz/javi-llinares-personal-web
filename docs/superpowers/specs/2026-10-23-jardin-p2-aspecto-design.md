# Diseño — Proyecto 2: Nuevo aspecto del jardín

> **Estado: implementado.** Las preguntas abiertas del borrador las resolvió Claude por su cuenta, a petición de Javi de saltarse la ronda de preguntas. Están en la sección "Decisiones tomadas" y son **revisables**: son decisiones de Claude, no acuerdos con Javi.

## Contexto

Es el segundo de cuatro proyectos del rediseño "Jardín digital" (ver [P1 — cimientos](2026-10-23-jardin-p1-cimientos-design.md)). P1 deja el modelo de contenido (`jardin`, `carrete`, `viajes`) funcionando con el aspecto visual de siempre. P2 cambia **cómo se ve y cómo se lee** el sitio, para que transmita "un rincón personal que cuidar" y no "web profesional con blog".

## Alcance

1. **Portada "mesa de trabajo"** (`src/pages/index.astro`): rejilla bento asimétrica en lugar de la lista de secciones actual.
   - Hero personal sobrio, con la voz del autor.
   - `NowWidget.astro`: estado vital actual (lecturas, juegos, música, proyectos activos, último viaje). Alimentado por `src/content/now.md`.
   - `RecentGardenEntry.astro`: la entrada del jardín con `updated ?? created` más reciente, con su estado (🌱 🌿 🌳).
   - `RecentPhoto.astro`: la última foto del carrete, a tamaño generoso y sin recortes artificiales.
   - Enlaces discretos a Proyectos y Servicios (siguen en segundo plano).
2. **Modo lectura "papel cálido"**: al abrir una entrada del jardín que lo pida, la página pasa a fondo papel y tipografía serif, con transición suave.
   - Tokens de papel: se reutilizan los actuales (ver "Decisiones tomadas").
   - Layout de ensayo: ancho de lectura de unos 680 px, `line-height` ≈ 1.75.
   - Notas al margen en `lg`; en móvil, desplegables discretos (ver "Desviaciones": notas al pie + plugin rehype, no `Sidenote.astro`).
   - Transición suave entre páginas para que el cambio de tema no parpadee (ver "Desviaciones": View Transitions por CSS, no `ClientRouter`).
3. **Mesa de luz del carrete** (`/carrete/`): disposición masonry que respeta cada proporción (columnas CSS), micro-metadatos en mono, lightbox minimalista a pantalla completa. Sin métricas de ningún tipo.

## No-objetivos

- Nada de publicar desde el móvil (P3) ni de enlaces entre notas (P4).
- No se tocan las páginas de proyectos ni de servicios más allá de ajustar tokens.
- Sin contadores, likes ni comentarios.

## Decisiones tomadas (por Claude, revisables)

1. **Dirección visual**: se evoluciona "Matrix + Papel" (marca `#16524e`) hacia algo más calmado; no se adopta la paleta del plan maestro (taller oscuro `#0c0d0e` + acento `#4ade80`), que es el neón que el design system evita. Se retiran la lluvia de caracteres del hero, las scanlines y el texto vertical decorativo; se conserva el grid tenue.
2. **Serif de lectura**: Literata autoalojada con `@fontsource-variable/literata`, importada solo en el layout de entrada del jardín. Cabinet Grotesk sigue en Fontshare (fuera de alcance).
3. **Secciones de la portada**: se eliminan del home `HeroSection`, `WebDesignServicesSection`, `PersonalPhilosophySection`, `FeaturedProjectsSection` y `LatestGardenSection`. La newsletter (un enlace a Substack) sigue en `/about` y en la home queda como enlace discreto, junto a Proyectos, Diseño web y Sobre mí.
4. **Modo papel**: todas las entradas del jardín, sin campo `paperTheme` ni interruptor. El cuerpo largo nunca va sobre oscuro.
5. **`now.md`**: un fichero, `src/content/now.md`, con `updated` y las listas `reading`, `playing`, `listening` y `building` (las vacías se ocultan). A mano por ahora; esquema plano para que lo escriba el bot de P3. El último viaje se calcula, no se escribe.
6. **Lightbox**: con navegación (botones, flechas, Esc, deslizar en táctil), `<dialog>` nativo y JS propio.
7. **Movimiento**: todo respeta `prefers-reduced-motion`.

### Desviaciones respecto al borrador

- **`Sidenote.astro` → notas al pie de Markdown.** El contenido es `.md`, no MDX, así que un componente no se puede invocar desde él. Las notas `[^1]` las convierte en notas al margen el plugin rehype `src/lib/rehype-sidenotes.mjs`. Sin JS.
- **`ClientRouter` → View Transitions entre documentos por CSS** (`@view-transition`). No hay JS nuevo para esto, así que no hace falta la excepción a "JS de cliente mínimo" que el borrador anticipaba. En navegadores sin soporte, navegación normal.
- **Token `warm-paper` no creado**: se reutilizan `background` y `paper`. Sí se añade `prose` (#34352f) y se oscurece `muted` (#68736f → #5c6763) porque no llegaba a AA sobre el papel (4,33:1).

## Pendiente de Javi

- Reescribir los textos provisionales de `HomeIntro` (tomados de la antigua portada y de `/about`).
- Rellenar `now.md` (hoy solo `building: Noesis`).
- Revisar las decisiones de arriba.

## Restricciones heredadas

- Cero scripts de terceros (test en `tests/build-output.test.mjs`).
- Colores solo mediante tokens; los modificadores de opacidad de Tailwind solo existen para valores de su escala o en forma arbitraria `/[0.58]`.
- Actualizar `docs/design-system.md` al cambiar la dirección visual.

## Verificación prevista

`npm run check`, `npm test`, y revisión visual en navegador (escritorio y móvil) de portada, una entrada en modo papel, `/carrete/` y el lightbox. Revisar contraste (WCAG AA) en ambos temas.
