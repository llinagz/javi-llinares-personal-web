// Orquestador: de un update de Telegram a un commit en el repo. Las dependencias se inyectan (ver api/telegram.mjs).
import { NOW_PATH, applyNow, buildNow, formatNow, parseNow, summarize } from "./ahora.mjs";
import { buildGardenEntry, buildPhotoEntry, buildTripEntry } from "./entrada.mjs";
import { parseMessage } from "./mensaje.mjs";

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

export async function handleUpdate(update, { allowedUsers, github, telegram, processPhoto, siteUrl }) {
  const message = update.message;
  if (!message || !allowedUsers.includes(message.from?.id)) return; // los desconocidos se ignoran en silencio

  const chatId = message.chat.id;
  const say = (text) => telegram.reply(chatId, text);

  try {
    const parsed = parseMessage(message);
    if (parsed.kind === "ignorar") return;
    if (parsed.reply) return await say(parsed.reply);

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
      const { image, exif } = await processPhoto(await telegram.downloadFile(parsed.fileId));
      const photoDate = exif.takenOn ?? today;
      // Con EXIF, la hora de la cámara; sin él, la del mensaje. Si el EXIF solo trae día, se queda en día.
      const dateTime = exif.takenAt ? madridToIso(exif.takenAt) : exif.takenOn ? undefined : isoSeconds(new Date(message.date * 1000));
      entry = buildPhotoEntry({
        text,
        date: photoDate,
        dateTime,
        exif,
        viaje: tags.viaje,
        topics: tags.topics,
        slugs: await github.readSlugs("carrete"),
        image
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

    const url = `${siteUrl}/${entry.section}/${entry.slug}/`;
    const created = newTrip ? `\nHe creado el viaje "${newTrip.title}" (edita ${newTrip.file.path} para ponerle lugar, resumen y relato).` : "";
    await say((entry.draft ? `Guardado como borrador: ${entry.slug}` : `Publicado (visible en ~1 min): ${url}`) + created);
  } catch (error) {
    console.error(error);
    await say(`No he podido publicarlo: ${error.message}`).catch(() => {});
  }
}
