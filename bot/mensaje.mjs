// Interpreta un mensaje de Telegram: qué es (texto, foto, comando) y qué etiquetas lleva.
import { NOW_LISTS, normalize } from "./ahora.mjs";

const NOW_USAGE = [
  "Uso de /ahora:",
  "• /ahora → muestra el estado actual.",
  "• /ahora leyendo Dune, Ubik → añade a la lista (leyendo, jugando, escuchando o construyendo).",
  "• /ahora quitar leyendo Dune → quita un elemento.",
  "• /ahora vaciar jugando → vacía la lista.",
  "• /ahora nota <texto> → cambia la nota; sin texto, la borra."
].join("\n");

export const HELP = [
  "Convenciones:",
  "• Texto sin foto → pensamiento del jardín. La primera línea es el título; el resto, el cuerpo (con una sola línea, sirve de ambos).",
  "• #semilla, #creciendo o #perenne (solo en texto) → etapa de la entrada (por defecto, semilla).",
  "• #destacada (solo en texto) → fija la entrada en la rejilla de la portada (featured).",
  "• Foto con pie → foto del carrete. La primera línea del pie es el título; el resto, el pie.",
  "• #viaje <slug> (solo en fotos) → asocia la foto a ese viaje; si no existe, lo crea (título derivado del slug, editable después).",
  "• Cualquier otra #palabra (p. ej. #rutina), en texto o en fotos → tema; no queda en el título y enlaza a /temas/<tema>/.",
  "• #borrador → deja el texto sin publicar (no vale con fotos: el repo es público).",
  "• /ahora → gestiona la tarjeta «Ahora» de la portada (leyendo, jugando, escuchando, construyendo y una nota). Escribe /ahora solo para ver el estado actual.",
  "Las etiquetas pueden ir en cualquier parte del mensaje o del pie y se quitan del texto.",
  "Puedes enviar la foto como documento para conservar la calidad original y la ficha técnica.",
  "",
  "Ejemplos:",
  "Leer despacio ⏎ Cuando leo con prisa no recuerdo nada. #creciendo #lectura",
  "Entreno de piernas #rutina #viaje cadiz-2026 (como pie de una foto)"
].join("\n");

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

// Quita las etiquetas del texto y las devuelve aparte.
function extractTags(raw = "") {
  const tags = { viaje: undefined, borrador: false, destacada: false, stage: undefined, topics: [] };
  const text = raw
    .replace(/(^|\s)#(semilla|creciendo|perenne)\b/gi, (_, space, stage) => {
      tags.stage = stage.toLowerCase();
      return space;
    })
    .replace(/(^|\s)#viaje\s+([a-z0-9]+(?:-[a-z0-9]+)*)/gi, (_, space, slug) => {
      tags.viaje = slug.toLowerCase();
      return space;
    })
    .replace(/(^|\s)#destacada\b/gi, (_, space) => {
      tags.destacada = true;
      return space;
    })
    .replace(/(^|\s)#borrador\b/gi, (_, space) => {
      tags.borrador = true;
      return space;
    })
    // Cualquier otra #palabra es un tema (`topics`). Se ejecuta la última para no pisar las etiquetas con significado.
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, space, topic) => {
      const name = topic.toLowerCase();
      if (!tags.topics.includes(name)) tags.topics.push(name);
      return space;
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return { text, tags };
}

const splitItems = (text) =>
  text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

// `/ahora …` → acción sobre `now.md`, o un error con el uso.
function parseNowCommand(rest) {
  const [first = "", ...others] = rest.trim().split(/\s+/);
  const tail = rest.trim().slice(first.length).trim();
  const word = normalize(first);
  const error = (reply = NOW_USAGE) => ({ kind: "error", reply });

  if (!word) return { kind: "ahora", action: { op: "ver" } };
  if (word === "nota") return { kind: "ahora", action: { op: "nota", text: tail } };

  if (word === "vaciar") {
    const list = NOW_LISTS[normalize(others[0] ?? "")];
    return list && others.length === 1 ? { kind: "ahora", action: { op: "vaciar", list } } : error();
  }

  // `quitar <lista> <elementos>` o `<lista> <elementos>`: lo que sigue a la palabra de la lista son los elementos.
  const removing = word === "quitar";
  const afterVerb = removing ? tail : rest.trim();
  const listWord = afterVerb.split(/\s+/)[0];
  const list = NOW_LISTS[normalize(listWord)];
  if (!listWord) return error();
  if (!list) return error(`No conozco la lista "${listWord}".\n\n${NOW_USAGE}`);

  const items = splitItems(afterVerb.slice(listWord.length));
  if (items.length === 0) return error();
  return { kind: "ahora", action: { op: removing ? "quitar" : "añadir", list, items } };
}

export function parseMessage(message) {
  const raw = message.text ?? message.caption ?? "";

  if (/^\/(start|ayuda|help)\b/i.test(raw)) return { kind: "comando", reply: HELP };

  const now = raw.match(/^\/ahora(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if (now) return parseNowCommand(now[1] ?? "");

  const photo = message.photo?.at(-1);
  const document = message.document;

  let fileId;
  if (photo) {
    fileId = photo.file_id;
  } else if (document) {
    if (!IMAGE_MIMES.includes(document.mime_type)) {
      const heic = /heic|heif/i.test(document.mime_type ?? "");
      return {
        kind: "error",
        reply: heic ? "No puedo procesar HEIC. Envíala como foto normal o en JPEG." : "Ese archivo no es una imagen JPEG, PNG o WebP."
      };
    }
    fileId = document.file_id;
  }

  const { text, tags } = extractTags(raw);

  if (fileId) return { kind: "carrete", text, fileId, tags };
  if (!text) return { kind: "ignorar" };
  return { kind: "jardin", text, tags };
}
