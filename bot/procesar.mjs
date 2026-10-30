// Orquestador: de un update de Telegram a un commit en el repo. Las dependencias se inyectan (ver api/telegram.mjs).
import { NOW_PATH, applyNow, buildNow, formatNow, parseNow, summarize } from "./ahora.mjs";
import { fieldFrom } from "../scripts/lib/frontmatter.mjs";
import { buildGardenEntry, buildPhotoEntry, buildTripEntry, photoSlug } from "./entrada.mjs";
import { formatRecent, imageOf, isExample, listRecent, setDraft, targetFrom } from "./gestion.mjs";
import { parseMessage } from "./mensaje.mjs";

const CONFIRM_BUTTONS = [
  { text: "Sí, borrar", data: "borrar" },
  { text: "Cancelar", data: "cancelar" }
];

const madridDate = (unixSeconds) => new Date(unixSeconds * 1000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

const isoSeconds = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

// "2026-10-23T10:05:00" (hora de pared de Madrid) → instante UTC en ISO. Se muestra luego en Madrid, así que el día no se mueve.
export function madridToIso(wallTime) {
  const guess = new Date(`${wallTime}Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    })
      .formatToParts(guess)
      .map(({ type, value }) => [type, Number(value)])
  );
  const asMadrid = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return isoSeconds(new Date(guess.getTime() - (asMadrid - guess.getTime())));
}

// Destino de /borrar, /ocultar y /mostrar: el slug escrito (con o sin `jardin/`) o el del mensaje al que se responde.
function resolveTarget({ arg, quoted }) {
  if (arg) {
    const [, collection, slug] = arg.match(/^(?:(jardin|carrete)\/)?(.+)$/);
    return { collection, slug };
  }
  return targetFrom(quoted);
}

async function manage(parsed, update, { github, siteUrl }, say) {
  const target = resolveTarget(parsed);
  if (!target) return say(`Responde con /${parsed.op} a un mensaje mío («Publicado…» o «Guardado como borrador…»), o escribe /${parsed.op} <slug>.`);
  if (isExample(target.slug)) return say("Las entradas ejemplo-* son de prueba y las necesitan los tests: no las toco.");

  const entry = await github.findEntry(target.slug, target.collection && [target.collection]);
  if (!entry) return say(`No encuentro «${target.slug}». /ultimas muestra lo publicado.`);
  const ref = `${entry.collection}/${entry.slug}`;

  if (parsed.op === "borrar") {
    return say(`¿Borrar ${ref}?\n«${fieldFrom(entry.raw, "title") ?? entry.slug}»\n\nDesaparece de la web. Si es una foto, también se elimina del almacén.`, { buttons: CONFIRM_BUTTONS });
  }

  if (entry.collection !== "jardin") return say("Solo se ocultan los textos del jardín. Para una foto usa /borrar: su imagen se seguiría publicando.");
  const raw = setDraft(entry.raw, parsed.op === "ocultar");
  if (raw === entry.raw) return say(parsed.op === "ocultar" ? `${ref} ya estaba oculta.` : `${ref} ya estaba publicada.`);
  if (await github.alreadyProcessed(update.update_id)) return;
  await github.commitFiles({
    files: [{ path: entry.path, content: raw }],
    message: `chore(jardin): ${parsed.op} ${entry.slug}\n\nTelegram-Update: ${update.update_id}`
  });
  return say(parsed.op === "ocultar" ? `Oculta (borrador): ${ref}` : `Publicada otra vez (visible en ~1 min): ${siteUrl}/jardin/${entry.slug}/`);
}

// Pulsación de [Sí, borrar] / [Cancelar]. No guarda estado: el destino sale del texto del propio mensaje de confirmación.
async function handleCallback(update, { allowedUsers, github, telegram, blob }) {
  const query = update.callback_query;
  if (!allowedUsers.includes(query.from?.id)) return;

  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  await telegram.answerCallback(query.id).catch(() => {});
  if (!chatId || !messageId) return;
  const finish = (text) => telegram.editMessage(chatId, messageId, text);

  try {
    if (query.data === "cancelar") return await finish("Cancelado: no he borrado nada.");
    if (query.data !== "borrar") return;

    const target = targetFrom(query.message.text);
    if (!target || isExample(target.slug)) return await finish("No sé qué borrar. Vuelve a empezar con /borrar.");
    if (await github.alreadyProcessed(update.update_id)) return;

    const entry = await github.findEntry(target.slug, [target.collection]);
    if (!entry) return await finish(`${target.collection}/${target.slug} ya no existe.`);

    const files = [{ path: entry.path, delete: true }];
    const notes = [];
    const image = entry.collection === "carrete" ? imageOf(entry.path, entry.raw) : undefined;
    if (entry.collection === "carrete") {
      const others = (await github.readEntries("carrete")).filter((other) => other.path !== entry.path);
      // Una imagen local solo se borra si no la usa otra entrada.
      if (image?.path && !others.some((other) => imageOf(other.path, other.raw)?.path === image.path)) {
        files.push({ path: image.path, delete: true });
      }
      const trip = fieldFrom(entry.raw, "trip");
      if (trip && !others.some((other) => fieldFrom(other.raw, "trip") === trip)) {
        notes.push(`El viaje «${trip}» se queda sin fotos; no lo he borrado.`);
      }
    }

    await github.commitFiles({
      files,
      message: `chore(${entry.collection}): borrar ${entry.slug}\n\nTelegram-Update: ${update.update_id}`
    });

    // El commit va primero: si falla, la foto sigue en el almacén y la entrada sigue consistente.
    if (image?.url) {
      try {
        await blob.remove(image.url);
      } catch (error) {
        notes.push(`La entrada está borrada, pero no he podido quitar la imagen del almacén (${error.message}). Bórrala a mano en Vercel → Storage.`);
      }
    }
    if (entry.collection === "jardin") notes.push("El texto sigue en el historial de git (pesa unos KB).");
    await finish([`Borrado: ${entry.collection}/${entry.slug} (desaparece de la web en ~1 min).`, ...notes].join("\n"));
  } catch (error) {
    console.error(error);
    await finish(`No he podido borrar: ${error.message}`).catch(() => {});
  }
}

export async function handleUpdate(update, deps) {
  if (update.callback_query) return handleCallback(update, deps);

  const { allowedUsers, github, telegram, processPhoto, blob, siteUrl } = deps;
  const message = update.message;
  if (!message || !allowedUsers.includes(message.from?.id)) return; // los desconocidos se ignoran en silencio

  const chatId = message.chat.id;
  const say = (text, options) => telegram.reply(chatId, text, options);
  let uploadedUrl; // foto ya subida al almacén; si el commit falla, se retira para no dejar huérfanos
  let committed = false;

  try {
    const parsed = parseMessage(message);
    if (parsed.kind === "ignorar") return;
    if (parsed.reply) return await say(parsed.reply);
    if (parsed.kind === "gestion") return await manage(parsed, update, deps, say);

    if (parsed.kind === "ultimas") {
      const withCollection = async (collection) => (await github.readEntries(collection)).map((entry) => ({ ...entry, collection }));
      const entries = [...(await withCollection("jardin")), ...(await withCollection("carrete"))];
      return await say(formatRecent(listRecent(entries)));
    }

    if (parsed.kind === "ahora") {
      const today = madridDate(message.date);
      const current = parseNow(await github.readFile(NOW_PATH), today);
      if (parsed.action.op === "ver") return await say(formatNow(current));
      if (await github.alreadyProcessed(update.update_id)) return;

      let next;
      try {
        next = applyNow(current, parsed.action, today);
      } catch (error) {
        return await say(error.message); // uso incorrecto (p. ej. quitar algo que no está): sin commit
      }
      await github.commitFiles({
        files: [{ path: NOW_PATH, content: buildNow(next) }],
        message: `chore(ahora): ${summarize(parsed.action)}\n\nTelegram-Update: ${update.update_id}`
      });
      return await say(`${formatNow(next)}\n\nVisible en ~1 min: ${siteUrl}/`);
    }

    const { tags, text } = parsed;
    if (parsed.kind === "carrete" && tags.borrador) {
      return await say("#borrador no vale con fotos: el repositorio es público y la imagen quedaría accesible. Envíala sin la etiqueta.");
    }
    if (parsed.kind === "carrete" && tags.destacada) {
      return await say("#destacada solo vale con texto: las fotos no se destacan. Envíala sin la etiqueta.");
    }
    if (await github.alreadyProcessed(update.update_id)) return;

    const today = madridDate(message.date);
    let entry;
    let newTrip;
    if (parsed.kind === "jardin") {
      entry = buildGardenEntry({
        text,
        date: today,
        createdAt: isoSeconds(new Date(message.date * 1000)),
        borrador: tags.borrador,
        destacada: tags.destacada,
        stage: tags.stage,
        topics: tags.topics,
        slugs: await github.readSlugs("jardin")
      });
    } else {
      const { image, width, height, exif } = await processPhoto(await telegram.downloadFile(parsed.fileId));
      const photoDate = exif.takenOn ?? today;
      // Con EXIF, la hora de la cámara; sin él, la del mensaje. Si el EXIF solo trae día, se queda en día.
      const dateTime = exif.takenAt ? madridToIso(exif.takenAt) : exif.takenOn ? undefined : isoSeconds(new Date(message.date * 1000));
      const slugs = await github.readSlugs("carrete");
      // La imagen va al almacén (fuera de git); en el repo solo queda el `.md` con su URL.
      uploadedUrl = await blob.upload(`carrete/${photoSlug({ text, date: photoDate, slugs })}.jpg`, image);
      entry = buildPhotoEntry({
        text,
        date: photoDate,
        dateTime,
        exif,
        viaje: tags.viaje,
        topics: tags.topics,
        slugs,
        imageUrl: uploadedUrl,
        width,
        height
      });
      // Un `#viaje` desconocido crea el viaje en el mismo commit, con la fecha de la primera foto.
      if (tags.viaje && !(await github.tripExists(tags.viaje))) {
        newTrip = buildTripEntry({ slug: tags.viaje, date: photoDate });
        entry.files.push(newTrip.file);
      }
    }

    await github.commitFiles({
      files: entry.files,
      message: `feat(${entry.section}): ${entry.title}\n\nTelegram-Update: ${update.update_id}`
    });
    committed = true;

    const url = `${siteUrl}/${entry.section}/${entry.slug}/`;
    const created = newTrip ? `\nHe creado el viaje "${newTrip.title}" (edita ${newTrip.file.path} para ponerle lugar, resumen y relato).` : "";
    await say((entry.draft ? `Guardado como borrador: ${entry.section}/${entry.slug}` : `Publicado (visible en ~1 min): ${url}`) + created);
  } catch (error) {
    console.error(error);
    if (uploadedUrl && !committed) await blob.remove(uploadedUrl).catch(() => {});
    await say(`No he podido publicarlo: ${error.message}`).catch(() => {});
  }
}
