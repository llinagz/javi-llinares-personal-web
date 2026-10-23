// Orquestador: de un update de Telegram a un commit en el repo. Las dependencias se inyectan (ver api/telegram.mjs).
import { buildGardenEntry, buildPhotoEntry, buildTripEntry } from "./entrada.mjs";
import { parseMessage } from "./mensaje.mjs";

const madridDate = (unixSeconds) => new Date(unixSeconds * 1000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

export async function handleUpdate(update, { allowedUsers, github, telegram, processPhoto, siteUrl }) {
  const message = update.message;
  if (!message || !allowedUsers.includes(message.from?.id)) return; // los desconocidos se ignoran en silencio

  const chatId = message.chat.id;
  const say = (text) => telegram.reply(chatId, text);

  try {
    const parsed = parseMessage(message);
    if (parsed.kind === "ignorar") return;
    if (parsed.reply) return await say(parsed.reply);

    const { tags, text } = parsed;
    if (parsed.kind === "carrete" && tags.borrador) {
      return await say("#borrador no vale con fotos: el repositorio es público y la imagen quedaría accesible. Envíala sin la etiqueta.");
    }
    if (await github.alreadyProcessed(update.update_id)) return;

    const today = madridDate(message.date);
    let entry;
    let newTrip;
    if (parsed.kind === "jardin") {
      entry = buildGardenEntry({
        text,
        date: today,
        createdAt: new Date(message.date * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"),
        borrador: tags.borrador,
        stage: tags.stage,
        slugs: await github.readSlugs("jardin")
      });
    } else {
      const { image, exif } = await processPhoto(await telegram.downloadFile(parsed.fileId));
      const photoDate = exif.takenOn ?? today;
      entry = buildPhotoEntry({
        text,
        date: photoDate,
        exif,
        viaje: tags.viaje,
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
