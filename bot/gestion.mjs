// Gestión de lo ya publicado (/borrar, /ocultar, /mostrar, /ultimas): funciones puras sobre el texto de las entradas.
import { posix } from "node:path";
import { fieldFrom } from "../scripts/lib/frontmatter.mjs";

const TARGET = /\b(jardin|carrete)\/([a-z0-9]+(?:-[a-z0-9]+)*)/;

// "Publicado … /jardin/mi-slug/" o "Guardado como borrador: jardin/mi-slug" → { collection, slug }.
export function targetFrom(text = "") {
  const match = text.match(TARGET);
  return match ? { collection: match[1], slug: match[2] } : undefined;
}

// Las entradas `ejemplo-*` son borradores de prueba que los tests del sitio necesitan.
export const isExample = (slug) => slug.startsWith("ejemplo-");

export const isDraft = (raw) => fieldFrom(raw, "draft") === "true";

// Pone o quita `draft: true` tocando solo esa línea del frontmatter.
export function setDraft(raw, draft) {
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!match) return raw;
  const [whole, open, head, close] = match;
  const lines = head.split(/\r?\n/).filter((line) => !/^draft:/.test(line));
  if (draft) lines.push("draft: true");
  return `${open}${lines.join("\n")}${close}${raw.slice(whole.length)}`;
}

// Imagen de una entrada del carrete: { url } si está en Blob, { path } (ruta en el repo) si es local.
export function imageOf(mdPath, raw) {
  const image = fieldFrom(raw, "image");
  if (!image) return undefined;
  if (/^https?:\/\//.test(image)) return { url: image };
  return { path: posix.normalize(posix.join(posix.dirname(mdPath), image)) };
}

// Últimas `limit` piezas, de la más reciente a la más antigua. `entries`: [{ collection, raw, slug }].
export function listRecent(entries, limit = 10) {
  return entries
    .map((entry) => ({
      ...entry,
      title: fieldFrom(entry.raw, "title") ?? entry.slug,
      when: fieldFrom(entry.raw, entry.collection === "jardin" ? "created" : "date") ?? "",
      draft: isDraft(entry.raw)
    }))
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, limit);
}

export function formatRecent(items) {
  if (items.length === 0) return "Todavía no hay nada publicado.";
  return items
    .map(({ collection, slug, title, when, draft }) => `• ${collection}/${slug}\n  ${title} · ${when.slice(0, 10)}${draft ? " · borrador" : ""}`)
    .join("\n");
}
