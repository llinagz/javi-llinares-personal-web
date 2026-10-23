# Diseño — Proyecto 4: Conexiones entre notas

> **Estado: borrador.** Recoge lo que propone el plan maestro y lo decidido hasta ahora. Las decisiones marcadas como "abiertas" hay que conversarlas con Javi antes de construir (usar `superpowers:brainstorming` al arrancar este proyecto).

## Contexto

Un jardín se diferencia de un blog en que las ideas **se enlazan entre sí**: lo importante no es solo cuándo se escribió algo, sino con qué otras ideas se conecta. Este proyecto añade esa capa sobre el modelo de contenido de [P1 — cimientos](2026-10-23-jardin-p1-cimientos-design.md), y se lee mejor con el aspecto de [P2](2026-10-23-jardin-p2-aspecto-design.md).

## Alcance

1. **Wiki-links** en el Markdown del jardín: `[[slug]]` y `[[slug|texto personalizado]]`, resueltos en build mediante un plugin de remark en `astro.config.mjs`. Se enlaza por `slug` del frontmatter (convención del repo).
2. **Grafo de backlinks** en `src/lib/gardenGraph.ts`: escanea las entradas del jardín en build, extrae los enlaces salientes y construye el mapa inverso. Expone `getBacklinks(slug)`.
3. **Componente `Backlinks.astro`** al pie de cada entrada: "Notas que enlazan aquí", con título, tipo y estado.
4. **Hover previews**: al pasar el cursor sobre un enlace interno, una tarjeta con título, estado de madurez y primer párrafo de la nota enlazada.

## No-objetivos

- No hay vista de grafo interactivo (tipo Obsidian) en esta fase.
- No hay búsqueda.
- Sin métricas de lecturas ni de enlaces.

## Preguntas abiertas (hay que decidirlas con Javi)

1. **Enlaces rotos**: si `[[algo]]` no existe, ¿falla el build (estricto, evita errores pero molesta al escribir una idea futura) o se pinta como enlace "pendiente" y se avisa en consola? Mi inclinación: aviso, no error.
2. **Destinos enlazables**: ¿solo entradas del jardín, o también fotos del carrete y viajes? Si es así, habría que decidir la sintaxis (`[[carrete:slug]]`, `[[viaje:slug]]`).
3. **Previews**: ¿basta con CSS (el contenido de la tarjeta se incrusta en el HTML en build, con `:hover`/`:focus-within`) o se admite un poco de JS propio? Hay que pensar en táctil, donde no existe el hover, y en accesibilidad por teclado.
4. **Borradores**: un enlace a una nota en `draft: true` no debe publicarse como enlace vivo en producción.
5. **Dónde viven los backlinks**: solo al pie de la entrada, o también en el margen en pantallas anchas (conecta con `Sidenote` de P2).
6. **Alias y renombrados**: si se cambia un `slug`, los `[[wiki-links]]` antiguos se rompen. ¿Se añade un campo `aliases` en el frontmatter?

## Restricciones heredadas

- Cero scripts de terceros (test en `tests/build-output.test.mjs`); si las previews llevan JS, será propio y mínimo.
- El cálculo del grafo es en build; la web sigue siendo estática.
- Los tests deberían comprobar: backlinks correctos, que no hay enlaces internos rotos y que un borrador no genera enlaces públicos.

## Verificación prevista

Dos o tres notas de prueba que se enlacen entre sí (incluido un enlace roto y un enlace a un borrador), `npm test`, y revisión en navegador con ratón, teclado y emulación táctil.
