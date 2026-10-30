// Utilidades compartidas por `scripts/nuevo.mjs` y el bot de Telegram (`bot/`).
// Sin dependencias. Los campos siguen los esquemas de src/content.config.ts.

export const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Valor de un campo escalar del frontmatter de un .md, sin comillas (solo busca en la cabecera).
export function fieldFrom(raw, key) {
  const head = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  return head.match(new RegExp(`^${key}:[ \\t]*["']?([^"'\\r\\n]+?)["']?[ \\t]*$`, "m"))?.[1];
}

// Slug declarado en el frontmatter de un .md (el nombre del fichero no tiene por qué coincidir).
export const slugFrom = (raw) => fieldFrom(raw, "slug");

// Marca un valor que se escribe tal cual, sin comillas (fechas).
export const date = (text) => ({ raw: text });

function format(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if ("raw" in value) return value.raw;
    const entries = Object.entries(value).filter(([, inner]) => inner !== undefined && inner !== "");
    return `\n${entries.map(([key, inner]) => `  ${key}: ${format(inner)}`).join("\n")}`;
  }
  return typeof value === "string" || Array.isArray(value) ? JSON.stringify(value) : String(value);
}

export function frontmatter(fields) {
  const lines = fields
    .filter(([, value]) => value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => {
      const text = format(value);
      return text.startsWith("\n") ? `${key}:${text}` : `${key}: ${text}`;
    });
  return `---\n${lines.join("\n")}\n---\n`;
}
