// Interpreta un mensaje de Telegram: qué es (texto, foto, comando) y qué etiquetas lleva.

export const HELP = [
  "Convenciones:",
  "• Texto sin foto → pensamiento del jardín. La primera línea es el título; el resto, el cuerpo (con una sola línea, sirve de ambos).",
  "• #semilla, #creciendo o #perenne → etapa de la entrada (por defecto, semilla).",
  "• Foto con pie → foto del carrete. La primera línea del pie es el título; el resto, el pie.",
  "• #viaje <slug> → asocia la foto a ese viaje; si no existe, lo crea (título derivado del slug, editable después).",
  "• Cualquier otra #palabra (p. ej. #rutina) → tema de la entrada o la foto; no queda en el título.",
  "• #borrador → deja el texto sin publicar (no vale con fotos: el repo es público).",
  "Puedes enviar la foto como documento para conservar la calidad original y la ficha técnica."
].join("\n");

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

// Quita las etiquetas del texto y las devuelve aparte.
function extractTags(raw = "") {
  const tags = { viaje: undefined, borrador: false, stage: undefined, topics: [] };
  const text = raw
    .replace(/(^|\s)#(semilla|creciendo|perenne)\b/gi, (_, space, stage) => {
      tags.stage = stage.toLowerCase();
      return space;
    })
    .replace(/(^|\s)#viaje\s+([a-z0-9]+(?:-[a-z0-9]+)*)/gi, (_, space, slug) => {
      tags.viaje = slug.toLowerCase();
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

export function parseMessage(message) {
  const raw = message.text ?? message.caption ?? "";

  if (/^\/(start|ayuda|help)\b/i.test(raw)) return { kind: "comando", reply: HELP };

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
