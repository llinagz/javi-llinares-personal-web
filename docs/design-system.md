# Design System

## Propósito

Este documento define la identidad visual y las reglas de diseño de la web personal de Javi Llinares para evitar incoherencias a medida que el proyecto crezca.

La web debe sentirse:

- Editorial
- Serena
- Técnica sin frialdad
- Humana
- Reflexiva
- No corporativa

No es una web SaaS ni una aplicación. Es un archivo personal de ideas, proyectos, lecturas y escritura.

## Idea Rectora

La identidad del sitio nace de una tensión equilibrada entre dos mundos:

- El mundo técnico: claridad, estructura, precisión, utilidad
- El mundo humano: lectura lenta, pensamiento, cultura, naturaleza, vida cotidiana

Cada nueva página, componente o sección debe sostener esa dualidad sin dramatizarla. El resultado debe sentirse sobrio, cuidado y con criterio.

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
- `--color-background`: `#fbfaf7`
- `--color-surface`: `#ffffff`
- `--color-text`: `#17211f`
- `--color-muted`: `#64716e`
- `--color-border`: `#dbe5e2`

### Uso del color

- `primary` para acciones principales, enlaces relevantes y pequeños acentos estructurales.
- `primary-dark` para estados hover y momentos de mayor densidad visual.
- `primary-soft` para fondos suaves, badges secundarios y bloques de apoyo.
- `background` como base general del sitio, cálida y ligeramente orgánica.
- `surface` para tarjetas y contenedores elevados.
- `text` para titulares y texto de alta prioridad.
- `muted` para cuerpo secundario, metadatos y supporting copy.
- `border` para separar sin endurecer la interfaz.

### Reglas de color

- El verde petróleo es protagonista, no decorado.
- No introducir acentos nuevos sin una necesidad clara de sistema.
- Evitar combinaciones saturadas o demasiado tecnológicas.
- Mantener contrastes altos en texto y estados interactivos.

## Tipografía

### Familias actuales

- Sans: `Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Serif: `Georgia, Cambria, "Times New Roman", serif`

### Criterio tipográfico

- La serif expresa la capa editorial y reflexiva.
- La sans expresa claridad funcional, navegación y soporte.
- Los contrastes tipográficos deben ser visibles pero sobrios.

### Uso recomendado

- `font-serif` para hero headlines, títulos principales, citas y momentos de énfasis narrativo.
- `font-sans` para navegación, cuerpo base, labels, botones y UI estructural.
- `font-mono` solo para código, fragmentos técnicos o contraste puntual con intención.

### Ritmo tipográfico

- Titulares compactos, con interlineado ajustado y peso medio/semibold.
- Cuerpo con aire suficiente para lectura larga.
- Medida de lectura ideal en contenido: alrededor de `760px`.

## Espaciado y composición

### Anchuras base

- Contenedor principal: `1160px` máximo
- Contenido de lectura: `760px` máximo

### Ritmo vertical

- `.section` usa un bloque generoso de separación.
- En móvil el ritmo debe seguir sintiéndose editorial, no comprimido.
- Entre secciones debe haber respiración visible, no stacking apretado de tarjetas.

### Principios de layout

- Preferir composiciones limpias con una o dos ideas visuales fuertes.
- Combinar texto amplio con bloques laterales o tarjetas cuando ayude a segmentar.
- Mantener densidad moderada: suficiente contenido, pero con aire.
- Usar asimetría ligera cuando refuerce el tono editorial.

## Superficies, bordes y profundidad

### Superficies

- Fondo general cálido y muy claro.
- Tarjetas y bloques sobre `surface`.
- El fondo puede incluir atmósfera sutil, como la actual textura radial, pero nunca protagonismo excesivo.

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

## Patrones de componentes

### Header

- Debe ser limpio, estable y fácil de escanear.
- Puede quedarse fijo si no compite con el contenido.
- El CTA del header debe ser sobrio y coherente con la paleta principal.

### Hero

- Debe presentar con claridad la intersección entre software, pensamiento y vida cotidiana.
- Titular grande en serif.
- Subtítulo legible y humano.
- La pieza visual de apoyo puede ser conceptual y editorial, no publicitaria.

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
- Peso semibold.
- Microinteracción ligera en hover.

### Cards

- Fondo `surface`
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
- `src/components/sections/HeroSection.astro`

Si en el futuro el diseño evoluciona, este documento debe actualizarse junto con los tokens o patrones base.
