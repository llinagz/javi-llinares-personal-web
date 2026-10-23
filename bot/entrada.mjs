// Construye los ficheros de una entrada (frontmatter + cuerpo) según los esquemas de src/content.config.ts.
// Si cambias un esquema de `jardin` o `carrete`, revisa también este fichero.
import { date as raw, frontmatter, slugify } from "../scripts/lib/frontmatter.mjs";

const MAX_TITLE = 70;

// Recorta por palabra y añade "…" si no cabe.
export function shorten(text, max = MAX_TITLE) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return `${(atWord.length > max / 2 ? atWord : cut).replace(/[\s.,;:]+$/, "")}…`;
}

function splitLines(text) {
  const [first = "", ...rest] = text.split(/\r?\n/);
  return { first: first.trim(), rest: rest.join("\n").trim() };
}

// Slug libre: el del título, con sufijo -2, -3… si ya existe; si queda vacío, `<prefijo>-AAAA-MM-DD`.
export function uniqueSlug(title, used, fallback) {
  const base = slugify(title) || fallback;
  if (!used.includes(base)) return base;
  for (let n = 2; ; n++) {
    if (!used.includes(`${base}-${n}`)) return `${base}-${n}`;
  }
}

const longDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Pensamiento del jardín: título = primera línea; cuerpo = resto (o el texto entero si es una sola línea).
// `createdAt` (ISO con hora) desempata entradas del mismo día en la portada; sin él, se escribe solo la fecha.
export function buildGardenEntry({ text, date, createdAt, borrador = false, stage = "semilla", slugs }) {
  const { first, rest } = splitLines(text);
  const title = shorten(first);
  const slug = uniqueSlug(title, slugs, `nota-${date}`);
  const body = rest || first;

  const content =
    frontmatter([
      ["title", title],
      ["slug", slug],
      ["type", "pensamiento"],
      ["stage", stage],
      ["created", raw(createdAt ?? date)],
      ["draft", borrador ? true : undefined]
    ]) + `\n${body}\n`;

  return { slug, title, section: "jardin", draft: borrador, files: [{ path: `src/content/jardin/${slug}.md`, content }] };
}

// Viaje mínimo creado al vuelo por `#viaje <slug>`: publicado (la foto enlaza a su página) y con datos
// provisionales (título derivado del slug, lugar = título) que se pulen a mano después.
export function buildTripEntry({ slug, date }) {
  const title = slug.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());
  const content =
    frontmatter([
      ["title", title],
      ["slug", slug],
      ["place", title],
      ["startDate", raw(date)],
      ["summary", `Fotos de ${title}.`],
      ["draft", undefined]
    ]) + `\nEscribe aquí el relato del viaje.\n`;

  return { title, file: { path: `src/content/viajes/${slug}.md`, content } };
}

// Foto del carrete: título = primera línea del pie; el resto de líneas es el `caption`.
export function buildPhotoEntry({ text, date, exif = {}, viaje, slugs, image }) {
  const { first, rest } = splitLines(text);
  const title = first ? shorten(first) : `Foto del ${longDate(date)}`;
  const slug = uniqueSlug(title, slugs, `foto-${date}`);
  const imageName = `${slug}.jpg`;

  const content = frontmatter([
    ["title", title],
    ["slug", slug],
    ["date", raw(date)],
    ["image", `../../assets/images/carrete/${imageName}`],
    ["caption", rest],
    ["trip", viaje],
    ["camera", exif.camera],
    ["focalLength", exif.focalLength],
    ["aperture", exif.aperture],
    ["shutterSpeed", exif.shutterSpeed],
    ["iso", exif.iso],
    ["draft", undefined]
  ]);

  return {
    slug,
    title,
    section: "carrete",
    draft: false,
    files: [
      { path: `src/content/carrete/${slug}.md`, content },
      { path: `src/assets/images/carrete/${imageName}`, content: image }
    ]
  };
}
