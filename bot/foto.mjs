// Reduce la foto y la deja sin metadatos; antes lee la ficha técnica para el frontmatter.
import exifr from "exifr";
import sharp from "sharp";

const MAX_SIDE = 2560;

function shutter(seconds) {
  if (!seconds) return undefined;
  return seconds >= 1 ? `${Number(seconds.toFixed(1))} s` : `1/${Math.round(1 / seconds)}`;
}

// "2026:10:23 10:05:00" → "2026-10-23" (sin pasar por Date: la hora de la cámara es local, no UTC).
function takenOn(value) {
  const match = typeof value === "string" && value.match(/^(\d{4}):(\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

// "2026:10:23 10:05:00" → "2026-10-23T10:05:00" (hora local de la cámara, sin zona).
function takenAt(value) {
  const match = typeof value === "string" && value.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}` : undefined;
}

async function readCard(buffer) {
  try {
    const tags = await exifr.parse(buffer, {
      pick: ["Make", "Model", "FocalLength", "FNumber", "ExposureTime", "ISO", "DateTimeOriginal"],
      reviveValues: false
    });
    if (!tags) return {};
    const model = [tags.Make, tags.Model].filter(Boolean).join(" ");
    // Muchos modelos repiten la marca ("Canon Canon EOS…"): se deja una sola vez.
    const camera = tags.Model?.toLowerCase().startsWith(String(tags.Make ?? "").toLowerCase()) ? tags.Model : model;
    return {
      camera: camera || undefined,
      focalLength: tags.FocalLength ? `${Math.round(tags.FocalLength)} mm` : undefined,
      aperture: tags.FNumber ? `f/${Number(tags.FNumber.toFixed(1))}` : undefined,
      shutterSpeed: shutter(tags.ExposureTime),
      iso: typeof tags.ISO === "number" ? tags.ISO : undefined,
      takenOn: takenOn(tags.DateTimeOriginal),
      takenAt: takenAt(tags.DateTimeOriginal)
    };
  } catch {
    return {};
  }
}

// → { image: Buffer (JPEG sin metadatos, ≤2560 px), exif: {...} }
export async function processPhoto(buffer) {
  const exif = await readCard(buffer);
  // Sin `withMetadata`, sharp no copia ningún metadato (EXIF, GPS, ICC…) al resultado.
  const image = await sharp(buffer)
    .rotate()
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
  return { image, exif };
}
