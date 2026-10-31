// Estado de "Ahora" (`src/content/now.md`): leerlo, modificarlo y volver a escribirlo. Funciones puras, sin red.
import { date, frontmatter } from "../scripts/lib/frontmatter.mjs";

export const NOW_PATH = "src/content/now.md";

// Etiqueta que escribe el usuario → campo del esquema (`now` en src/content.config.ts) y etiqueta de `nowRows`.
export const NOW_LISTS = {
  leyendo: "reading",
  jugando: "playing",
  escuchando: "listening",
  construyendo: "building"
};

const FIELDS = Object.values(NOW_LISTS);
const labelOf = (field) => Object.keys(NOW_LISTS).find((label) => NOW_LISTS[label] === field);

// Sin tildes ni mayúsculas, para comparar "Dune" con "dune" o "Café" con "cafe".
export const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const emptyNow = (updated) => ({ updated, lists: Object.fromEntries(FIELDS.map((field) => [field, []])), body: "" });

function parseItem(text) {
  const value = text.trim();
  if (/^".*"$/.test(value)) {
    try {
      return JSON.parse(value);
    } catch {
      // comillas mal escapadas: se queda con el texto entre comillas
    }
  }
  return value.replace(/^['"]|['"]$/g, "");
}

// Admite la lista en bloque (`  - "Noesis"`, como está a mano) y el array en línea (`["a","b"]`, como lo escribe `frontmatter()`).
export function parseNow(raw, fallbackDate) {
  const match = raw?.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return emptyNow(fallbackDate);

  const state = emptyNow(fallbackDate);
  state.body = match[2].trim();

  let current;
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && current) {
      state.lists[current].push(parseItem(item[1]));
      continue;
    }
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) continue;
    const [, key, value] = field;
    current = undefined;
    if (key === "updated") {
      state.updated = value.trim().slice(0, 10) || fallbackDate;
    } else if (FIELDS.includes(key)) {
      current = key;
      if (value.startsWith("[")) {
        state.lists[key] = JSON.parse(value);
        current = undefined;
      }
    }
  }
  return state;
}

export function buildNow(state) {
  const head = frontmatter([["updated", date(state.updated)], ...FIELDS.map((field) => [field, state.lists[field]])]);
  return state.body ? `${head}\n${state.body}\n` : head;
}

// Devuelve el estado nuevo, o lanza un Error con un mensaje para el usuario.
export function applyNow(state, action, today) {
  const next = { updated: today, lists: { ...state.lists }, body: state.body };
  const { op, list, items = [], text = "" } = action;

  if (op === "nota") {
    next.body = text.trim();
  } else if (op === "vaciar") {
    next.lists[list] = [];
  } else if (op === "añadir") {
    const known = new Set(next.lists[list].map(normalize));
    next.lists[list] = [...next.lists[list]];
    for (const item of items) {
      if (!known.has(normalize(item))) {
        known.add(normalize(item));
        next.lists[list].push(item);
      }
    }
  } else if (op === "quitar") {
    const missing = items.filter((item) => !next.lists[list].some((existing) => normalize(existing) === normalize(item)));
    if (missing.length > 0) throw new Error(`No hay "${missing.join('", "')}" en ${labelOf(list)}.`);
    const remove = new Set(items.map(normalize));
    next.lists[list] = next.lists[list].filter((existing) => !remove.has(normalize(existing)));
  } else {
    throw new Error(`Operación desconocida: ${op}`);
  }
  return next;
}

export function formatNow(state) {
  const rows = FIELDS.filter((field) => state.lists[field].length > 0).map((field) => `• ${labelOf(field)}: ${state.lists[field].join(" · ")}`);
  const lines = [`Ahora (actualizado el ${state.updated}):`, ...(rows.length > 0 ? rows : ["• (listas vacías)"])];
  if (state.body) lines.push("", `Nota: ${state.body}`);
  return lines.join("\n");
}

// Para el mensaje del commit.
export function summarize({ op, list, items = [] }) {
  if (op === "nota") return "nota";
  if (op === "vaciar") return `vaciar ${labelOf(list)}`;
  return `${op === "quitar" ? "quitar" : "añadir"} ${labelOf(list)}: ${items.join(", ")}`;
}
