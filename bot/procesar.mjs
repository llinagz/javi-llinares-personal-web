// Orquestador: de un update de Telegram a un commit en el repo. Las dependencias se inyectan (ver api/telegram.mjs).
import { buildGardenEntry, buildPhotoEntry } from "./entrada.mjs";
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
    if (tags.viaje && !(await github.tripExists(tags.viaje))) {
      return await say(`No existe ningún viaje con el slug "${tags.viaje}".`);
    }
    if (await github.alreadyProcessed(update.update_id)) return;

    const today = madridDate(message.date);
    let entry;
    if (parsed.kind === "jardin") {
      entry = buildGardenEntry({ text, date: today, borrador: tags.borrador, slugs: await github.readSlugs("jardin") });
    } else {
      const { image, exif } = await processPhoto(await telegram.downloadFile(parsed.fileId));
      entry = buildPhotoEntry({
        text,
        date: exif.takenOn ?? today,
        exif,
        viaje: tags.viaje,
        slugs: await github.readSlugs("carrete"),
        image
      });
    }

    await github.commitFiles({
      files: entry.files,
      message: `feat(${entry.section}): ${entry.title}\n\nTelegram-Update: ${update.update_id}`
    });

    const url = `${siteUrl}/${entry.section}/${entry.slug}/`;
    await say(entry.draft ? `Guardado como borrador: ${entry.slug}` : `Publicado (visible en ~1 min): ${url}`);
  } catch (error) {
    console.error(error);
    await say(`No he podido publicarlo: ${error.message}`).catch(() => {});
  }
}
