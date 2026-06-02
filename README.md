# Javi Llinares | Personal Web 🌿

Una web personal construida con Astro para reunir ideas, artículos y proyectos con una estética editorial, calmada y técnica sin perder cercanía. ✨

## Vista general 🧭

Este proyecto no nace como una aplicación ni como una landing de marketing. Es un espacio de publicación personal pensado para escribir, ordenar ideas y presentar proyectos con contexto.

La intención del sitio es sostener dos mundos al mismo tiempo:

- `software` y construcción técnica
- `lectura`, cultura y vida cotidiana

## Qué incluye 📚

- Blog con artículos largos y enfoque editorial
- Página de proyectos con fichas de trabajo destacadas
- Página "Sobre mí" con una voz más personal
- Sistema visual documentado para mantener coherencia conforme el sitio crezca
- Arquitectura content-first usando Astro Content Collections

## Stack 🛠️

- `Astro`
- `TypeScript`
- `Tailwind CSS`
- Colecciones de contenido para `blog` y `projects`

## Dirección visual 🎨

La web sigue una identidad visual basada en estos principios:

- tono editorial y no corporativo
- ritmo de lectura cuidado
- jerarquía tipográfica clara
- uso contenido del color
- interacciones suaves y discretas

El sistema visual está documentado en [docs/design-system.md](docs/design-system.md).

## Estructura del proyecto 🧱

```text
src/
  components/
    layout/
    sections/
    ui/
  content/
    blog/
    projects/
  layouts/
  pages/
  styles/
docs/
  design-system.md
```

## Scripts disponibles ⚙️

```bash
npm run dev
npm run build
npm run preview
npm run check
```

## Filosofía del proyecto 🌱

Este repositorio busca algo sencillo pero ambicioso: construir una presencia digital con criterio, legibilidad y personalidad, evitando patrones genéricos de producto SaaS.

Prioridades del proyecto:

- claridad antes que espectáculo
- profundidad antes que prisa
- contenido antes que ornamento
- técnica con calidez humana

## Estado actual 🚀

El sitio ya cuenta con:

- home editorial
- blog
- proyectos
- página sobre mí
- componentes reutilizables
- base de diseño consistente

## Desarrollo local 💻

```bash
npm install
npm run dev
```

Después abre el entorno local que te indique Astro para navegar por el sitio.

## Notas de mantenimiento 📝

- Mantener el sitio mayoritariamente estático
- Añadir islas de cliente solo cuando aporten valor real
- Reutilizar tokens y patrones visuales antes de introducir otros nuevos
- Actualizar `docs/design-system.md` cuando cambie la dirección visual

## Cierre 🤍

Una web personal también puede ser una pieza de diseño y pensamiento, no solo un contenedor de páginas. Este proyecto intenta ir en esa dirección.
