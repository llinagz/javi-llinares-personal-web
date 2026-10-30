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
  "📝 PUBLICAR UN PENSAMIENTO (jardín)",
  "Envía solo texto. La primera línea es el título (máx. ~70 caracteres) y el resto, el cuerpo; con una sola línea, sirve de ambos. Se publica como «pensamiento» en etapa semilla, en ~1 minuto.",
  "",
  "📷 PUBLICAR UNA FOTO (carrete)",
  "Envía una foto con pie. La primera línea del pie es el título y el resto, el texto de la foto; sin pie, el título es «Foto del <fecha>». Se reduce a 2560 px y se le quitan los metadatos (GPS incluido).",
  "Para conservar la ficha técnica (cámara, objetivo, ISO…) y la hora real de la toma, envíala como documento/archivo: Telegram borra el EXIF de las fotos normales. Solo JPEG, PNG o WebP (HEIC no).",
  "",
  "🏷 ETIQUETAS (van en cualquier parte del mensaje o del pie y se quitan del texto)",
  "• #semilla, #creciendo, #perenne (solo texto) → etapa de la entrada. Por defecto, semilla.",
  "• #destacada (solo texto) → va la primera en la rejilla de la portada.",
  "• #borrador (solo texto) → se guarda sin publicar. Con fotos se rechaza: el repo es público.",
  "• #viaje <slug> (solo fotos) → asocia la foto a ese viaje. Si no existe, lo crea publicado, con datos provisionales que editas luego. El slug va en minúsculas y con guiones.",
  "• Cualquier otra #palabra (texto o foto) → tema. Enlaza a /temas/<tema>/ y no queda en el título.",
  "",
  "⏱ TARJETA «AHORA» DE LA PORTADA",
  "• /ahora → muestra el estado actual (no publica nada).",
  "• /ahora leyendo Dune, Ubik → añade a la lista. Listas: leyendo, jugando, escuchando, construyendo. Separa con comas; no duplica.",
  "• /ahora quitar leyendo Dune → quita un elemento.",
  "• /ahora vaciar jugando → vacía la lista (su fila desaparece).",
  "• /ahora nota Mudándome de piso → cambia la nota; /ahora nota sin texto la borra.",
  "",
  "💡 EJEMPLOS",
  "1) Pensamiento corto:",
  "Leer despacio ⏎ Cuando leo con prisa no recuerdo nada. #creciendo #lectura",
  "2) Idea guardada para pulir luego:",
  "Newsletter semanal ⏎ Probar un formato de tres enlaces y una nota. #borrador",
  "3) Pensamiento fijado en portada:",
  "Mi regla de oro ⏎ Escribir antes de decidir. #perenne #destacada",
  "4) Foto suelta (pie de la foto):",
  "Luz de la tarde ⏎ Última hora en la azotea. #atardecer",
  "5) Foto de un viaje (si el viaje no existe, se crea):",
  "Playa de la Caleta #viaje cadiz-2026 #mar",
  "6) Qué estoy haciendo ahora:",
  "/ahora leyendo Ubik, Dune",
  "/ahora escuchando Khruangbin",
  "/ahora quitar leyendo Dune",
  "",
  "Respuestas: «Publicado» con el enlace, «Guardado como borrador» o el motivo del error. Los mensajes de otras cuentas se ignoran. /ayuda muestra este texto."
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
