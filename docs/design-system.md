# Design System

## Propósito

Este documento define la identidad visual y las reglas base de la web personal de Javi Llinares. Debe servir como fuente de verdad para el diseño actual, no solo como referencia histórica.

La web debe sentirse:

- Editorial
- Serena
- Técnica sin frialdad
- Humana
- Reflexiva
- No corporativa

No es una web SaaS ni una aplicación. Es un archivo personal de ideas, proyectos, lecturas y escritura.

## Idea Rectora

El sitio vive en una tensión equilibrada entre dos mundos:

- El mundo técnico: claridad, estructura, precisión, utilidad
- El mundo humano: lectura lenta, pensamiento, cultura, naturaleza, vida cotidiana

Cada nueva página, componente o sección debe sostener esa dualidad sin dramatizarla. El resultado debe sentirse sobrio, cuidado y con criterio.

## Dirección Visual Actual

El rediseño actual da más peso a una estética editorial cálida, con contraste alto y composición más atrevida:

- Header flotante, redondeado y translúcido
- Portada "mesa de trabajo": rejilla bento asimétrica sobre papel, con una tarjeta oscura tipo terminal (`ahora.md`) como único contrapunto
- Lenguaje Editorial CLI contenido: topbars, rutas y labels monoespaciados como estructura, no como simulación de una app
- Tarjetas y superficies con aire de papel cálido dentro de marcos oscuros de trabajo
- Lectura del jardín en papel cálido y serif (ver "Lectura en papel")
- Proyectos presentados como piezas enlazables de laboratorio y workspace personal
- Una sensación calmada: sin lluvia de caracteres, scanlines ni texto decorativo

La sensación general debe ser más cercana a una revista o cuaderno de trabajo que a una landing comercial. La dirección actual **evoluciona** el lenguaje "Matrix + Papel" hacia algo más sereno; no se adopta la paleta de taller oscuro con acento verde neón del plan maestro, porque es justo el neón que este documento evita.

## Patrón Editorial CLI

La Home puede usar una estética inspirada en terminal de comandos siempre que siga siendo editorial y humana:

- Usar prompts, rutas, cursores, topbars y pequeños outputs como estructura visual, no como simulación literal de una app.
- Mantener `#16524e` como ancla de marca y combinarlo con ink, papel cálido y clay en detalles puntuales.
- Reservar la monoespaciada para labels, comandos y metadatos; los titulares siguen viviendo en `display-type` y las frases de síntesis en serif.
- Evitar neón, dashboards, exceso de microcopy técnica y comandos que dificulten leer los textos principales.
- Preferir HTML/CSS sobre imágenes generadas cuando el motivo terminal pueda resolverse de forma nativa y accesible.
- La atmósfera de las bandas oscuras se limita a un grid muy tenue. Se retiraron la lluvia de caracteres, las scanlines y el texto vertical decorativo: no volver a introducirlos.
- Las clases `terminal-label` y `terminal-link` están pensadas para fondos oscuros (su color es clay y su hover es claro). Sobre papel usar utilidades propias (`font-mono text-xs font-bold uppercase tracking-[0.08em] text-primary`).

## Patrón Matrix + Papel

La evolución actual extiende el lenguaje terminal a todo el sitio con un balance oscuro + papel:

- Usar fondos `matrix-page` o `matrix-section` para cabeceras, índices, CTAs, footer y bloques de navegación editorial.
- Usar `paper-band`, `paper-panel` y `prose-shell` para lectura larga, tarjetas principales y contenidos que necesitan calma visual.
- Mantener solo el grid tenue como atmósfera, nunca como protagonista.
- No poner cuerpos largos directamente sobre fondo oscuro salvo textos breves de hero, CTA o metadatos.
- Alternar bandas oscuras y cálidas para que el sitio se sienta técnico sin perder respiración editorial.

## Principios Visuales

### 1. Calma antes que impacto

La interfaz debe transmitir confianza y claridad antes que espectáculo. El diseño no compite con el contenido: lo acompaña.

### 2. Jerarquía editorial

La tipografía, el espaciado y el ritmo vertical son la herramienta principal de diseño. La estructura debe recordar más a una publicación bien editada que a una landing comercial.

### 3. Personalidad contenida

Debe existir carácter visual, pero sin caer en recursos de moda. Evitar efectos excesivos, secciones infladas y elementos que parezcan plantillas genéricas.

### 4. Utilidad real

Cada componente debe ayudar a leer, explorar o entender. Si un recurso visual no mejora la navegación o la legibilidad, no debería añadirse.

## Paleta

### Color principal

- `--color-primary`: `#16524e`

Es el ancla de marca. Debe comunicar criterio, calma y profundidad.

### Tokens actuales

- `--color-primary`: `#16524e`
- `--color-primary-dark`: `#0f3b38`
- `--color-primary-soft`: `#e8f2f0`
- `--color-background`: `#f5f0e6`
- `--color-surface`: `#fffaf0`
- `--color-text`: `#14211f`
- `--color-muted`: `#5c6763` (oscurecido desde `#68736f`, que daba 4,33:1 sobre `background` y no llegaba a AA; ahora 5,17:1)
- `--color-prose`: `#34352f` (texto largo de lectura sobre papel, 10,9:1 sobre `background`)
- `--color-border`: `#d8d0bf`
- `--color-ink`: `#081917`
- `--color-clay`: `#b55d38`
- `--color-clay-light`: `#d08762` (clay sobre fondos oscuros: comandos, rutas y enlaces de acento)
- `--color-paper`: `#fff7e8`

### Uso del color

- `primary` para acciones principales, enlaces relevantes y pequeños acentos estructurales.
- `primary-dark` para estados hover y momentos de mayor densidad visual.
- `primary-soft` para fondos suaves, badges secundarios y bloques de apoyo.
- `background` como base general del sitio, cálida y ligeramente orgánica.
- `surface` para tarjetas y contenedores elevados.
- `text` para titulares y texto de alta prioridad.
- `muted` para cuerpo secundario, metadatos y supporting copy.
- `prose` para el cuerpo de lectura larga (`reading-column`). `prose` y `muted` son hex, no canales RGB: no admiten modificadores de opacidad.
- `clay` (#b55d38) sobre papel da solo ~4:1: usarlo en fondos oscuros (como `clay-light`) o en texto grande, no en texto pequeño sobre papel.
- `border` para separar sin endurecer la interfaz.
- `ink` para fondos oscuros de alto contraste.
- `paper` para superficies claras de tono editorial.
- Los tokens `ink`, `paper`, `terminal`, `terminal-text` y `clay-light` están definidos como canales RGB (`--color-*-rgb`) y expuestos en Tailwind (`text-paper`, `bg-terminal/[0.76]`…). Usar estos nombres en lugar de hex o `rgba()` arbitrarios.
- El favicon usa un monograma `JL` en tono `paper` sobre fondo `primary`, con trazos gruesos y composición compacta para conservar legibilidad en tamaños pequeños.

### Reglas de color

- El verde petróleo sigue siendo el ancla de marca, pero convive con fondos papel y bloques oscuros.
- No introducir acentos nuevos sin una necesidad clara de sistema.
- Evitar combinaciones saturadas o demasiado tecnológicas.
- Mantener contrastes altos en texto y estados interactivos.

## Tipografía

### Familias actuales

- Sans/display: `Cabinet Grotesk, Outfit, ui-sans-serif, system-ui, sans-serif`
- Serif: `Georgia, Cambria, "Times New Roman", serif`
- Serif de lectura (solo entradas del jardín): `"Literata Variable", Georgia, …`, autoalojada con `@fontsource-variable/literata` (sin peticiones a terceros) e importada únicamente en `GardenEntryLayout`.

### Criterio tipográfico

- La serif expresa la capa editorial y reflexiva.
- La display sans expresa claridad funcional, navegación y soporte, especialmente en títulos grandes.
- Los contrastes tipográficos deben ser visibles pero sobrios.

### Uso recomendado

- `page-title` para el `h1` de toda página con banda oscura (listados, fichas, about, 404): un único tamaño (`clamp(2.6rem, 7vw, 4.75rem)`), peso 900 y Cabinet Grotesk. No poner tamaños propios en esos `h1`.
- `display-type` para hero headlines, títulos principales y grandes llamadas editoriales.
- `editorial-serif` para citas, bloques de énfasis narrativo y textos de síntesis emocional.
- `font-sans` para navegación, cuerpo base, labels, botones y UI estructural.
- `font-mono` solo para código, fragmentos técnicos o contraste puntual con intención.

### Ritmo tipográfico

- Titulares compactos, con interlineado ajustado y peso negro o semibold según el contexto.
- Cuerpo con aire suficiente para lectura larga.
- Medida de lectura ideal en contenido: alrededor de `760px` (`prose-content`); en las entradas del jardín, `680px` con `line-height` 1.75 (`reading-column`).

## Espaciado y composición

### Anchuras base

- Contenedor principal: `1240px` máximo
- Contenido de lectura: `760px` máximo

### Ritmo vertical

- `.section` usa un bloque moderado de separación, más compacto que en la primera iteración del rediseño.
- En móvil el ritmo debe seguir sintiéndose editorial, no comprimido, pero tampoco con huecos teatrales.
- Entre secciones debe haber respiración visible, no stacking apretado de tarjetas.

### Principios de layout

- Preferir composiciones limpias con una o dos ideas visuales fuertes.
- Combinar texto amplio con bloques laterales o tarjetas cuando ayude a segmentar.
- Mantener densidad moderada: suficiente contenido, pero con aire.
- Usar asimetría ligera cuando refuerce el tono editorial.

## Superficies, bordes y profundidad

### Superficies

- Fondo general cálido y muy claro.
- Tarjetas y bloques sobre `surface` o `paper`.
- El fondo puede incluir atmósfera sutil, como la textura radial actual, pero nunca protagonismo excesivo.

### Bordes

- Los bordes son parte importante del lenguaje visual.
- Deben sugerir orden y cuidado, no rigidez.
- Priorizar separaciones finas y tonos suaves.

### Sombra

- Sombra actual: `shadow-quiet`
- Uso reservado para tarjetas destacadas y elevaciones suaves.
- Evitar sombras duras, profundas o con estética de dashboard/SaaS.

## Interacción y movimiento

### Comportamiento

- Las interacciones deben sentirse discretas y precisas.
- Hover con pequeños desplazamientos o cambios de color.
- Nada de animaciones ornamentales continuas.

### Reglas

- Mantener transiciones cortas y suaves.
- Respetar `prefers-reduced-motion`.
- Usar movimiento para feedback, no para entretenimiento.
- Si un efecto de scroll o pinning complica el flujo en pantallas pequeñas, se prefiere simplificarlo o desactivarlo.
- Entre páginas hay una transición suave con View Transitions entre documentos, solo CSS (`@view-transition { navigation: auto; }` en `global.css`), activa únicamente con `prefers-reduced-motion: no-preference`. El header lleva `view-transition-name` para no parpadear. No hay `ClientRouter` ni JS para esto.

## Patrones de componentes

### Header

- Debe ser limpio, estable y fácil de escanear.
- Puede quedarse fijo si no compite con el contenido.
- En la versión actual, el header es flotante, redondeado y ligeramente translúcido.
- Sin CTA: la navegación va como rutas en monoespaciada (`/jardín`, `/carrete`…); la activa lleva fondo `paper/[0.08]` y `aria-current="page"`. La marca va en serif.

### Portada "mesa de trabajo"

- Banda oscura (`matrix-section`) con rejilla bento de 12 columnas en `lg` (una columna en móvil): `Ahora` (3, alta) · última entrada regada (5, alta) · foto y último viaje apiladas (4). Debajo, la rejilla "El jardín" (`GardenGrid`, hasta 16 piezas en total contando las de arriba) y una fila de enlaces discretos. Si faltan piezas la rejilla se reacomoda en `index.astro`.
- Tarjetas con `.garden-card` (borde fino, fondo terminal suave, sin sombra) y metadatos en `.garden-chip` (mono). Excepción consciente a "cuerpos largos nunca sobre oscuro": aquí solo hay extractos cortos en serif.
- La home no tiene cabecera: empieza directamente por la rejilla (el `h1` es `sr-only`).
- `NowWidget`: título "Ahora" en serif, nota y filas con contenido (`nowRows`), chip de estado al pie. Se alimenta de `src/content/now.md`.
- `RecentGardenEntry`: la entrada con `updated ?? created` más reciente, con su estado (🌱 🌿 🌳), título serif grande y extracto.
- `RecentPhoto`: última foto del carrete rellenando la celda (`object-cover`) con el título y el año en un chip. La foto completa está en su página.
- `RecentTrip`: último viaje publicado, con curvas de nivel decorativas en SVG (no hay datos de ruta).
- `GardenGrid`: rejilla "El jardín" (4 columnas en escritorio) con tarjetas compactas `.garden-card`: chip de etapa y tipo, título serif, extracto y fecha de riego. Completa hasta 16 piezas en total junto a Ahora, entrada, foto y viaje; las `featured` van primero.
- `HomeColophon`: cierre de la home en una banda `paper-band` (la mesa oscura acaba y el footer oscuro vuelve después). Un párrafo serif en primera persona lleva Proyectos, Diseño web, la newsletter y Sobre mí como enlaces dentro del texto, más un botón secundario a Substack. Los textos son provisionales.

### Lectura en papel

- Todas las entradas del jardín (`GardenEntryLayout`) usan `reading-page`: fondo `background`, sin bandas oscuras salvo el footer, cabecera en papel y cuerpo en `reading-column` (Literata, `prose`).
- No hay interruptor de tema: el cuerpo largo nunca va sobre oscuro.
- **Notas al margen**: se escriben como notas al pie de Markdown (`[^1]`); `src/lib/rehype-sidenotes.mjs` las convierte en checkbox + etiqueta + `span.sidenote`. En `lg` flotan en el margen derecho (14rem); en móvil el número las despliega en el sitio. Sin JS y accesibles con teclado (checkbox visualmente oculto pero enfocable).

### Mesa de luz (carrete)

- `PhotoGrid`: masonry con columnas CSS (1/2/3), cada foto en su proporción, borde fino en lugar de sombra y micro-metadatos en mono. Sin métricas de ningún tipo.
- `Lightbox`: `<dialog>` nativo a pantalla completa con JS propio (botones, flechas, Esc, deslizar en táctil). Es mejora progresiva: sin JS cada foto enlaza a su página. El `<img>` del visor se crea desde el script.

### Bloques de contenido

- Los artículos y proyectos deben sentirse enlazables y editoriales.
- Un bloque destacado puede usar fondo oscuro si el contraste del texto es correcto.
- Las superficies claras deben usar texto oscuro, nunca blanco por herencia accidental.

### Botones

#### Primario

- Fondo `primary`
- Texto blanco
- Hover hacia `primary-dark`

#### Secundario

- Fondo transparente o suave
- Texto `primary`
- Borde visible

#### Criterios

- Bordes redondeados suaves, no excesivos.
- Peso semibold o bold según contexto.
- Microinteracción ligera en hover.

### Cards

- Fondo `surface` o `paper`
- Borde visible
- Hover con elevación mínima
- Deben parecer piezas editoriales enlazables, no widgets

### Badges

- Pequeños, funcionales y tranquilos
- Usarlos para categorías, estado o taxonomía
- No convertirlos en elementos protagonistas

### Prosa

- La experiencia de lectura es central.
- Titulares internos en serif.
- Párrafos y listas con color `muted`.
- Enlaces subrayados de forma clara y elegante.
- Blockquotes con presencia editorial, no decorativa.

## Voz visual por tipo de contenido

### Blog

- Priorizar legibilidad, ritmo vertical y jerarquía clara.
- Menos elementos visuales, más calidad tipográfica.

### Proyectos

- Mostrar claridad técnica, contexto, decisiones y resultado.
- Permitir algo más de estructura modular que en el blog, sin parecer portfolio comercial agresivo.

### Sobre mí

- Debe sentirse cercano, reflexivo y honesto.
- Evitar la estética de bio profesional inflada.

## Lo Que Debemos Evitar

- Layouts genéricos de startup
- Hero centrado con cards vacías por inercia
- Sombras pesadas
- Glassmorphism
- Gradientes chillones
- Animación excesiva
- Exceso de colores acento
- Iconografía decorativa sin función
- Copy visual demasiado comercial
- Componentes que parezcan de dashboard o producto SaaS

## Reglas de implementación

- Priorizar HTML semántico y contenido antes que ornamento.
- Mantener el sitio mayoritariamente estático.
- Añadir islas de cliente solo cuando exista una necesidad real.
- Reutilizar tokens existentes antes de crear nuevos.
- Si se añade un nuevo patrón visual, documentarlo aquí.
- Si una decisión rompe este sistema, debe justificarse por una necesidad editorial concreta.

## Checklist Antes de Añadir una Nueva Sección

- ¿Se siente editorial y no comercial?
- ¿Respeta la dualidad entre lo técnico y lo humano?
- ¿Usa la paleta existente sin introducir ruido?
- ¿La jerarquía tipográfica está clara?
- ¿La sección mejora la lectura o el descubrimiento?
- ¿Podría simplificarse?

## Fuente de verdad actual

La implementación visual vigente se apoya principalmente en:

- `src/styles/global.css`
- `tailwind.config.mjs`
- `src/components/ui/*`
- `src/components/layout/*`
- `src/components/sections/*`

Si en el futuro el diseño evoluciona, este documento debe actualizarse junto con los tokens o patrones base.
