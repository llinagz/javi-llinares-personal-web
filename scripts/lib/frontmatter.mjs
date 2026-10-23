// Utilidades compartidas por `scripts/nuevo.mjs` y el bot de Telegram (`bot/`).
// Sin dependencias. Los campos siguen los esquemas de src/content.config.ts.

export const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Slug declarado en el frontmatter de un .md (el nombre del fichero no tiene por qué coincidir).
export const slugFrom = (raw) => raw.match(/^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1];

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
