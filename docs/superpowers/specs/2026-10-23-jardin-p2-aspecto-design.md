# Diseño — Proyecto 2: Nuevo aspecto del jardín

> **Estado: borrador.** Recoge lo que propone el plan maestro y lo decidido hasta ahora. Las decisiones marcadas como "abiertas" hay que conversarlas con Javi antes de construir (usar `superpowers:brainstorming` al arrancar este proyecto).

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
   - Tokens `warm-paper` en `global.css` (el plan maestro propone `#f7f4ed`, `#2d5a43`, etc.; hay que cruzarlos con los tokens actuales, ver preguntas abiertas).
   - Layout de ensayo: ancho de lectura de unos 680 px, `line-height` ≈ 1.75.
   - `Sidenote.astro`: notas al margen en `lg`; en móvil, desplegables discretos tras el párrafo.
   - View Transitions (`ClientRouter`) para que el cambio de tema no parpadee. **Ojo**: choca con la restricción actual de "JS de cliente mínimo"; es una excepción deliberada y hay que reflejarla en `CLAUDE.md`.
3. **Mesa de luz del carrete** (`/carrete/`): disposición masonry que respeta cada proporción (columnas CSS), micro-metadatos en mono, lightbox minimalista a pantalla completa. Sin métricas de ningún tipo.

## No-objetivos

- Nada de publicar desde el móvil (P3) ni de enlaces entre notas (P4).
- No se tocan las páginas de proyectos ni de servicios más allá de ajustar tokens.
- Sin contadores, likes ni comentarios.

## Preguntas abiertas (hay que decidirlas con Javi)

1. **Dirección visual**: la web ya tiene un lenguaje propio ("Editorial CLI / Matrix + Papel", documentado en `docs/design-system.md`, color de marca `#16524e`). El plan maestro propone otro punto de partida (taller oscuro `#0c0d0e`, acento verde `#4ade80`). ¿Se evoluciona el lenguaje actual hacia algo más calmado o se parte del plan maestro? ¿Se quita la lluvia de texto "matrix" del hero, que es lo menos "jardín" de la web?
2. **Fuente serif** para la lectura: el plan maestro sugiere Literata, Newsreader o Charter. Hoy se usa Georgia del sistema y Cabinet Grotesk (Fontshare) como display. ¿Se autoalojan fuentes (recomendable: sin terceros) o se mantiene Georgia?
3. **Secciones actuales de la portada** (servicios de diseño web, newsletter, filosofía personal): ¿se eliminan, se mueven a una página propia o quedan como una tarjeta del bento? ¿Se mantiene la newsletter (hoy no hay backend)?
4. **Tema claro/oscuro**: ¿el modo papel cálido solo se activa en entradas concretas (`paperTheme` en el frontmatter, como propone el plan) o en todas las del jardín? ¿Y hay interruptor para el lector?
5. **`now.md`**: ¿qué campos? ¿Quién lo actualiza (a mano, o más adelante el bot de P3)?
6. **Lightbox**: ¿con navegación entre fotos (flechas, teclado)? Requiere JS propio, sin librerías de terceros (hay un test que lo impide).
7. **Accesibilidad y movimiento**: respetar `prefers-reduced-motion` en las transiciones.

## Restricciones heredadas

- Cero scripts de terceros (test en `tests/build-output.test.mjs`).
- Colores solo mediante tokens; los modificadores de opacidad de Tailwind solo existen para valores de su escala o en forma arbitraria `/[0.58]`.
- Actualizar `docs/design-system.md` al cambiar la dirección visual.

## Verificación prevista

`npm run check`, `npm test`, y revisión visual en navegador (escritorio y móvil) de portada, una entrada en modo papel, `/carrete/` y el lightbox. Revisar contraste (WCAG AA) en ambos temas.
