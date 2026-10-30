# Manual de contenido

Cómo publicar en la web: entradas del jardín, fotos del carrete, viajes y el estado "ahora".

> Hoy se publica **desde el portátil**, editando ficheros Markdown del repositorio. Publicar desde el móvil es el proyecto P3 y todavía no existe (ver `docs/superpowers/specs/2026-10-23-jardin-p3-publicar-movil-design.md`).

## 1. El flujo en cinco pasos

1. **Crea o edita** un fichero en `src/content/...` (tabla de la sección 2). Para crear uno nuevo lo más cómodo es el asistente (ver más abajo): `npm run nuevo`.
2. **Si lleva imagen**, cópiala a `src/assets/images/...` (sección 6).
3. **Míralo** con `npm run dev` y abre `http://localhost:4321`. En local se ven también los borradores.
4. **Comprueba** con `npm test`. Construye el sitio y avisa de slugs repetidos, enlaces rotos, borradores publicados por error, etc.
5. **Publica**: `git add`, `git commit` y `git push`. La web está en Vercel y se despliega sola al llegar a `main`. Mientras se trabaje en una rama de integración (hoy `jardin-digital`), el push va ahí y llega a `main` con un Pull Request.

```bash
npm run dev          # ver el resultado en local
npm test             # comprobar antes de subir
git add -A
git commit -m "contenido: <qué has añadido>"
git push
```

### El asistente `npm run nuevo`

Te hace las preguntas necesarias y escribe el fichero con el frontmatter correcto, sin que tengas que recordar los campos.

```bash
npm run nuevo                          # te pregunta qué crear y el título
npm run nuevo -- jardin "Mi idea"      # directo: jardin, carrete (o foto) o viaje
```

- Pregunta solo lo necesario. En cada pregunta, **Enter** acepta el valor entre corchetes (por ejemplo la fecha de hoy) u omite lo opcional.
- Propone el `slug` a partir del título (sin tildes ni espacios) y comprueba que no esté repetido.
- Para una **foto** o la portada de un **viaje**, te pide la ruta de la imagen (puedes arrastrar el archivo a la terminal) y **la copia** a `src/assets/images/carrete/` con el nombre del `slug`.
- En un **análisis** pide además la ficha de la obra.
- Lo deja todo como **borrador** (`draft: true`) por defecto: no se publica hasta que quites esa línea.
- **Nunca sobrescribe**: si el fichero ya existe, no escribe nada.
- Ctrl+C cancela sin crear nada.

Qué **no** hace: no reduce la foto ni le quita el GPS (hazlo tú antes de publicar, ver sección 6), no rellena los datos de cámara y no sirve para `now.md` (usa `/ahora` en el bot o edítalo a mano) ni para proyectos (a mano). Al terminar te recuerda los pasos siguientes.

## 2. Qué fichero crear

| Quiero publicar… | Fichero | Imagen |
|---|---|---|
| Un pensamiento, reflexión, artículo o análisis | `src/content/jardin/<nombre>.md` | opcional, en `src/assets/images/jardin/` |
| Una foto | `src/content/carrete/<nombre>.md` | **obligatoria**, en `src/assets/images/carrete/` |
| Un viaje (agrupa fotos y lleva un relato) | `src/content/viajes/<nombre>.md` | opcional (`cover`), en `src/assets/images/carrete/` |
| Qué estoy leyendo, jugando, escuchando o construyendo | `src/content/now.md` (ya existe: solo se edita) | no |
| Un proyecto | `src/content/projects/<nombre>.md` | opcional, en `src/assets/images/projects/` |

El **nombre del fichero no importa**. Lo que cuenta es el campo `slug` del frontmatter: es la URL y debe ser único dentro de su colección.

| Colección | URL resultante |
|---|---|
| jardín | `/jardin/<slug>/` |
| carrete | `/carrete/<slug>/` |
| viajes | `/carrete/viajes/<slug>/` |
| proyectos | `/projects/<slug>/` |

El **frontmatter** es el bloque entre las dos líneas `---` al principio del fichero. Después va el texto en Markdown.

## 3. Jardín

### Plantilla mínima

```md
---
title: "Mi idea"
slug: "mi-idea"
created: 2026-10-24
---

Primer párrafo. Sirve de extracto en tarjetas y de meta descripción si no pones `description`.

Segundo párrafo, con una nota al margen.[^1]

[^1]: Esta nota sale en el margen derecho en pantallas grandes.
```

### Plantilla completa

```md
---
title: "Leer mejor para construir mejor"
slug: "leer-mejor-para-construir-mejor"
description: "Opcional. Una o dos frases. Si falta, se usa el primer párrafo."
type: "articulo"
stage: "creciendo"
created: 2026-03-12
updated: 2026-10-02
topics: ["lectura", "criterio"]
image: "../../assets/images/jardin/leer-mejor.jpg"
featured: false
draft: false
---
```

### Campos

| Campo | Obligatorio | Valores / notas |
|---|---|---|
| `title` | sí | Texto |
| `slug` | sí | Minúsculas, sin espacios ni tildes, con guiones. Es la URL |
| `created` | sí | `AAAA-MM-DD` |
| `type` | no (`pensamiento`) | `pensamiento`, `reflexion`, `articulo`, `analisis` |
| `stage` | no (`semilla`) | `semilla` 🌱, `creciendo` 🌿, `perenne` 🌳 |
| `updated` | no | Fecha del último "riego" |
| `description` | no | Si falta, el extracto sale del primer párrafo |
| `topics` | no | Lista de etiquetas |
| `image` | no | Ruta **relativa al `.md`** hacia `src/assets/images/jardin/` |
| `featured` | no (`false`) | `true` → va delante en la rejilla "El jardín" de la portada (con el bot: `#destacada`) |
| `draft` | no (`false`) | `true` → solo se ve en `npm run dev` |
| `work` | solo en `analisis` | Ficha de la obra (ver abajo) |

### Cómo "regar" una entrada

Para decir que has vuelto a una entrada, cambia `updated` a la fecha de hoy. La entrada con `updated` (o `created`, si no hay `updated`) más reciente es la que aparece en la portada como **"Lo último que he regado"**. Y el orden de los listados sigue ese mismo criterio.

### Madurar una entrada

Una idea empieza como `semilla`. Si la desarrollas, pásala a `creciendo`, y cuando esté asentada, a `perenne`. Cámbialo a mano en el frontmatter junto con `updated`.

### Análisis (libro o videojuego)

Un `analisis` **exige** la ficha `work`:

```md
type: "analisis"
work:
  title: "Disco Elysium"
  kind: "videojuego"      # "libro" o "videojuego"
  creator: "ZA/UM"        # autor (libro) o estudio (videojuego)
  year: 2019              # opcional
  platform: "PC"          # opcional
```

Sin `work`, el build falla con "Un análisis necesita la ficha de la obra".

### Texto

- No repitas el título como `#`: la plantilla ya lo pinta. Empieza los apartados con `##`.
- **Notas al margen**: usa notas al pie de Markdown, `texto[^1]` y, en cualquier parte del fichero, `[^1]: contenido de la nota`. En pantalla grande se muestran en el margen derecho. En móvil, el número las despliega al tocarlo. Numéralas `[^1]`, `[^2]`, etc., o ponles nombre (`[^fuente]`).
- Negrita `**así**`, cursiva `*así*`, citas con `>`, listas con `-`, enlaces `[texto](https://...)`.

## 4. Carrete (fotos)

### Plantilla

```md
---
title: "El faro"
slug: "faro"
date: 2026-10-20
image: "../../assets/images/carrete/faro.jpg"
caption: "Opcional: el pie de foto"
alt: "Opcional: descripción para lectores de pantalla"
location: "Costa da Morte"
trip: "asturias-2026"
camera: "Fujifilm X-T4"
focalLength: "35 mm"
aperture: "f/8"
shutterSpeed: "1/250"
iso: 200
draft: false
---
```

Solo hacen falta `title`, `slug`, `date` e `image`. El resto es opcional.

### Campos

| Campo | Obligatorio | Notas |
|---|---|---|
| `title`, `slug`, `date` | sí | `date` en `AAAA-MM-DD` |
| `image` | sí | Ruta relativa al `.md` hacia `src/assets/images/carrete/` (fotos manuales), **o una URL** de Vercel Blob (las fotos del bot de Telegram, que no se guardan en git) |
| `width`, `height` | solo con URL | Dimensiones en píxeles de la imagen remota. El bot las rellena; con una ruta local no hacen falta |
| `caption` | no | Pie de foto en la página de la foto |
| `alt` | no | Si falta, se usa `caption` y luego `title` |
| `location` | no | Aparece en los metadatos de la foto |
| `trip` | no | `slug` de un viaje existente. La foto aparece en la página de ese viaje |
| `topics` | no | Lista de temas, como en el jardín (`["rutina"]`). Cada tema tiene su página en `/temas/<tema>/` |
| `camera`, `focalLength`, `aperture`, `shutterSpeed`, `iso` | no | Metadatos técnicos. `iso` es un número, sin comillas |
| `draft` | no | `true` → solo en `npm run dev` |

El texto debajo del frontmatter se puede dejar vacío.

### Antes de añadir una foto

Lee la sección 6. Hay que **reducir la imagen y quitarle el GPS**.

El enlace "Carrete" del menú solo aparece cuando hay **al menos una foto publicada**.

## 5. Viajes

Un viaje agrupa fotos y lleva un relato corto en el cuerpo del fichero.

```md
---
title: "Asturias en otoño"
slug: "asturias-2026"
place: "Asturias"
startDate: 2026-10-01
endDate: 2026-10-05
summary: "Una frase que resume el viaje."
cover: "../../assets/images/carrete/asturias-portada.jpg"
draft: false
---

El relato del viaje, en Markdown.
```

| Campo | Obligatorio | Notas |
|---|---|---|
| `title`, `slug`, `place`, `startDate`, `summary` | sí | |
| `endDate` | no | |
| `cover` | no | Si falta, se usa la primera foto del viaje |
| `draft` | no | |

Para asociar una foto a un viaje, pon en la foto `trip: "asturias-2026"` (el `slug` del viaje). Si el `slug` no existe, el build falla.

El viaje más reciente publicado aparece en la tarjeta "ahora" de la portada como **"último viaje"**.

## 6. Imágenes

- **Dónde:** `src/assets/images/jardin/`, `carrete/` o `projects/`. **Nunca en `public/`**: ahí no se optimizan.
- **Cómo se referencian:** con una ruta relativa **al fichero `.md`**. Desde `src/content/carrete/faro.md`, la ruta es `"../../assets/images/carrete/faro.jpg"`.
- **Tamaño:** reduce las fotos reales a unos **2560 px de lado largo** antes de subirlas.
- **Privacidad (importante):** **quita el GPS del EXIF** antes del commit. Si no, tu ubicación exacta queda en el repositorio y en el sitio publicado. Una vez subida, está en el historial de Git aunque la borres después.
- **Borradores:** `draft: true` oculta la **página**, pero Astro copia igualmente la imagen original al build. **No commitees fotos privadas**, ni siquiera como borrador.
- La web las convierte a WebP con varios tamaños sola. No hace falta que las prepares tú.

## 7. "Ahora" (`src/content/now.md`)

Alimenta la tarjeta oscura de la portada. Solo se edita, no se crea. Desde el móvil se gestiona con `/ahora` (ver sección 12).

```md
---
updated: 2026-10-24
reading:
  - "El nombre de la rosa"
playing:
  - "Hollow Knight"
listening:
  - "Khruangbin"
building:
  - "Noesis"
---

Opcional: una o dos frases de texto libre.
```

- Cambia `updated` cada vez que lo toques: sale como "actualizado el …".
- Una lista vacía (`reading: []`) **oculta esa fila**. No hace falta borrarla.
- El "último viaje" no se escribe aquí: se calcula solo.

## 8. Borradores y ejemplos

- `draft: true` → la entrada se ve en `npm run dev` y **nunca** en la web publicada (ni en listados, ni en RSS, ni en el mapa del sitio).
- Para publicar: borra la línea `draft` o ponla en `false`.
- Los ficheros `ejemplo-*` de jardín, carrete y viajes son de prueba y siempre son borradores. **No los borres todos**: un test exige que quede al menos un borrador, para comprobar que el filtro funciona.

## 9. Proyectos (referencia rápida)

Todos estos campos son obligatorios salvo `image` y `featured`:

```md
---
name: "Noesis"
slug: "noesis"
description: "Frase corta."
longDescription: "Descripción más larga."
image: "../../assets/images/projects/noesis.png"   # opcional
status: "En desarrollo"     # "En desarrollo" | "MVP" | "Idea" | "Publicado"
techStack: ["Astro", "TypeScript"]
featured: false
links:
  - label: "Web"
    url: "https://..."
date: 2026-05-01
problem: "El problema que resuelve."
solution: "Cómo lo resuelve."
currentStage: "Dónde está ahora."
---
```

`status` solo admite esos cuatro valores, con esa ortografía exacta.

## 10. Errores típicos

| Síntoma | Causa probable |
|---|---|
| El build falla con un mensaje de un campo | El frontmatter no cumple el esquema (campo obligatorio ausente, valor fuera de la lista, fecha mal escrita) |
| "Un análisis necesita la ficha de la obra" | `type: "analisis"` sin `work` |
| Los tests dicen que hay slugs repetidos | Dos ficheros de la misma colección con el mismo `slug` |
| La imagen no se encuentra | Ruta mal calculada. Es relativa al `.md`, no a la raíz del proyecto |
| Mi entrada no sale en la web publicada | Tiene `draft: true` |
| No aparece "Carrete" en el menú | No hay ninguna foto publicada (todas son borrador) |
| No sale en la portada | La portada muestra la entrada regada más reciente aparte y una rejilla "El jardín" que completa hasta 16 piezas en total (con Ahora, foto y viaje), con las `featured: true` primero y el resto por riego. Para fijarla, usa `featured: true` (`#destacada` en el bot) o cambia `updated` |
| La fecha da error | Formato `AAAA-MM-DD`, sin comillas ni horas |
| Un texto con `:` o comillas rompe el frontmatter | Entrecomilla los valores de texto: `title: "Algo: otra cosa"` |

## 11. Lista de comprobación antes de subir

- [ ] `slug` único y en minúsculas con guiones
- [ ] Fechas en `AAAA-MM-DD`
- [ ] `draft` correcto (`false` si quiero que se vea)
- [ ] Imagen reducida y **sin GPS**, guardada en `src/assets/images/...`
- [ ] Revisado en `npm run dev`
- [ ] `npm test` en verde
- [ ] Commit y push

## 12. Desde el móvil (bot de Telegram)

Para publicar en el momento sin tocar el portátil. Preparación y variables: [bot-telegram.md](bot-telegram.md).

| Envías | Resultado |
|---|---|
| Texto | Pensamiento del jardín (`semilla` por defecto). La primera línea es el título; el resto, el cuerpo (con una sola línea, sirve de ambos) |
| `#semilla`, `#creciendo` o `#perenne` en un texto | Fija la etapa (`stage`) de la entrada |
| `#destacada` en un texto | Escribe `featured: true` (no vale con fotos) |
| Foto (o imagen como documento) con pie | Foto del carrete. Primera línea del pie = título; el resto = `caption`. Sin pie: "Foto del <fecha>" |
| `#viaje <slug>` en el pie | Asocia la foto a ese viaje. Si no existe, el bot lo crea publicado, con título derivado del slug (`cadiz-2026` → "Cadiz 2026"), lugar igual al título, inicio en la fecha de la foto y un resumen provisional. Edita `src/content/viajes/<slug>.md` para pulirlo |
| Cualquier otra `#palabra` (p. ej. `#rutina`) en un texto o pie | Se guarda como tema (`topics`, en minúsculas) y se quita del título y del slug |
| `#borrador` en un texto | Se guarda con `draft: true`. **No vale con fotos** (repo público) |
| `/ahora` | Muestra el estado de "Ahora" |
| `/ahora leyendo Dune, Ubik` | Añade a `leyendo`, `jugando`, `escuchando` o `construyendo` (sin duplicados) y pone `updated` a hoy |
| `/ahora quitar leyendo Dune` | Quita un elemento; si no está, avisa y no cambia nada |
| `/ahora vaciar jugando` | Vacía la lista (oculta su fila) |
| `/ahora nota <texto>` | Cambia la nota libre; sin texto, la borra |
| `/ultimas` | Lista las últimas 10 piezas (jardín y carrete) con su `jardin/<slug>` o `carrete/<slug>`; sin commit |
| `/borrar` respondiendo a un mensaje del bot, o `/borrar <slug>` | Pide confirmación con botones **[Sí, borrar] [Cancelar]**; al confirmar elimina la entrada (y la imagen) en un commit |
| `/ocultar`, `/mostrar` (por respuesta o con slug) | Solo para textos del jardín: pone o quita `draft: true`, sin borrar nada |

- La foto se reduce a 2560 px y se le quitan **todos** los metadatos, GPS incluido. Si la mandas como documento, se aprovecha el EXIF para rellenar cámara, focal, apertura, velocidad e ISO y la fecha.
- **Las fotos del bot no se guardan en git**: la imagen va a Vercel Blob y el `.md` solo lleva su URL (`image`, `width`, `height`). Por eso `/borrar` las elimina de verdad del almacén. Un texto borrado sí queda en el historial de git (unos KB).
- `/borrar` no toca las entradas `ejemplo-*` (las necesitan los tests) y no borra el viaje de una foto, aunque se quede sin fotos.
- Una entrada por foto: en un álbum solo la primera lleva pie.
- El bot responde con el enlace (visible en ~1 minuto) o con el motivo del fallo. Commitea directo a la rama configurada.
- El bot solo toca `now.md` con `/ahora`; los viajes (más allá de crearlos con `#viaje`) y los artículos largos siguen siendo a mano.
