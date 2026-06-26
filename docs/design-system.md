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
- Landing principal con lenguaje Editorial CLI: ventanas tipo terminal, rutas, prompts, outputs y labels monoespaciados
- Tarjetas y superficies con aire de papel cálido dentro de marcos oscuros de trabajo
- Un bloque de artículos más denso y contrastado, tratado como archivo/log editorial
- Proyectos presentados como piezas enlazables de laboratorio y workspace personal
- Una sección de filosofía más estática y legible, sin artificios de scroll que alteren el flujo
- CTA final oscuro y sobrio, con mucho contraste

La sensación general debe ser más cercana a una revista o cuaderno de trabajo que a una landing comercial.

## Patrón Editorial CLI

La Home puede usar una estética inspirada en terminal de comandos siempre que siga siendo editorial y humana:

- Usar prompts, rutas, cursores, topbars y pequeños outputs como estructura visual, no como simulación literal de una app.
- Mantener `#16524e` como ancla de marca y combinarlo con ink, papel cálido y clay en detalles puntuales.
- Reservar la monoespaciada para labels, comandos y metadatos; los titulares siguen viviendo en `display-type` y las frases de síntesis en serif.
- Evitar neón, dashboards, exceso de microcopy técnica y comandos que dificulten leer los textos principales.
- Preferir HTML/CSS sobre imágenes generadas cuando el motivo terminal pueda resolverse de forma nativa y accesible.
- La variante actual del hero puede apoyarse en un fondo oscuro verde tinta con grid, scanlines y lluvia de caracteres muy tenue, siempre en baja opacidad y al servicio de la legibilidad.

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
- `--color-muted`: `#68736f`
- `--color-border`: `#d8d0bf`
- `--color-ink`: `#081917`
- `--color-clay`: `#b55d38`
- `--color-paper`: `#fff7e8`

### Uso del color

- `primary` para acciones principales, enlaces relevantes y pequeños acentos estructurales.
- `primary-dark` para estados hover y momentos de mayor densidad visual.
- `primary-soft` para fondos suaves, badges secundarios y bloques de apoyo.
- `background` como base general del sitio, cálida y ligeramente orgánica.
- `surface` para tarjetas y contenedores elevados.
- `text` para titulares y texto de alta prioridad.
- `muted` para cuerpo secundario, metadatos y supporting copy.
- `border` para separar sin endurecer la interfaz.
- `ink` para fondos oscuros de alto contraste.
- `paper` para superficies claras de tono editorial.
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

### Criterio tipográfico

- La serif expresa la capa editorial y reflexiva.
- La display sans expresa claridad funcional, navegación y soporte, especialmente en títulos grandes.
- Los contrastes tipográficos deben ser visibles pero sobrios.

### Uso recomendado

- `display-type` para hero headlines, títulos principales y grandes llamadas editoriales.
- `editorial-serif` para citas, bloques de énfasis narrativo y textos de síntesis emocional.
- `font-sans` para navegación, cuerpo base, labels, botones y UI estructural.
- `font-mono` solo para código, fragmentos técnicos o contraste puntual con intención.

### Ritmo tipográfico

- Titulares compactos, con interlineado ajustado y peso negro o semibold según el contexto.
- Cuerpo con aire suficiente para lectura larga.
- Medida de lectura ideal en contenido: alrededor de `760px`.

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

## Patrones de componentes

### Header

- Debe ser limpio, estable y fácil de escanear.
- Puede quedarse fijo si no compite con el contenido.
- En la versión actual, el header es flotante, redondeado y ligeramente translúcido.
- El CTA del header debe ser sobrio y coherente con la paleta principal.

### Hero

- Debe presentar con claridad la intersección entre software, pensamiento y vida cotidiana.
- Titular grande con `display-type`.
- Subtítulo legible y humano.
- La pieza visual de apoyo puede ser conceptual y editorial, no publicitaria.
- Puede incluir una imagen inline o un bloque visual lateral, siempre que no rompa la lectura.

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
