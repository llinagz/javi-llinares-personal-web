import { getCollection, type CollectionEntry } from "astro:content";

export type GardenEntry = CollectionEntry<"jardin">;
export type Trip = CollectionEntry<"viajes">;
export type Photo = CollectionEntry<"carrete">;
export type Project = CollectionEntry<"projects">;
export type Now = CollectionEntry<"now">;

export type GardenType = GardenEntry["data"]["type"];
export type GardenStage = GardenEntry["data"]["stage"];

export const gardenTypes: Record<GardenType, string> = {
  pensamiento: "Pensamiento",
  reflexion: "Reflexión",
  articulo: "Artículo",
  analisis: "Análisis"
};

export const gardenStages: Record<GardenStage, { label: string; icon: string }> = {
  semilla: { label: "Semilla", icon: "🌱" },
  creciendo: { label: "Creciendo", icon: "🌿" },
  perenne: { label: "Perenne", icon: "🌳" }
};

// Los borradores se ven con `npm run dev` y nunca llegan al build.
export function isPublished(entry: { data: { draft: boolean } }): boolean {
  return !entry.data.draft || import.meta.env.DEV;
}

// "Carrete" solo aparece en la navegación cuando hay al menos una foto publicada.
export async function hasPublishedPhotos(): Promise<boolean> {
  return (await getCollection("carrete", isPublished)).length > 0;
}

export function sortByDateDesc<T extends { data: { date: Date } }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Fecha del último cuidado: cuándo se regó por última vez la entrada.
export function lastTended(entry: GardenEntry): Date {
  return entry.data.updated ?? entry.data.created;
}

export function sortByTendedDesc(items: GardenEntry[]): GardenEntry[] {
  return [...items].sort((a, b) => lastTended(b).getTime() - lastTended(a).getTime());
}

// Filas de "ahora" con contenido, en orden de visualización. Las vacías no se pintan.
export function nowRows(now: Now | undefined): { label: string; items: string[] }[] {
  const { reading = [], playing = [], listening = [], building = [] } = now?.data ?? {};

  return [
    { label: "leyendo", items: reading },
    { label: "jugando", items: playing },
    { label: "escuchando", items: listening },
    { label: "construyendo", items: building }
  ].filter((row) => row.items.length > 0);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid"
  }).format(date);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(date);
}

export function readingTime(body: string | undefined): string {
  const words = (body ?? "").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

// Texto plano del primer párrafo, para meta description y tarjetas cuando no hay `description`.
export function excerpt(entry: GardenEntry, maxLength = 160): string {
  if (entry.data.description) return entry.data.description;

  const firstParagraph = (entry.body ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|>|[-*]\s|\d+\.\s|```|!\[)/.test(block));
  const text = (firstParagraph ?? entry.data.title)
    .replace(/\[\^[^\]]+\]/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ");

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

export function photoAlt(photo: Photo): string {
  return photo.data.alt ?? photo.data.caption ?? photo.data.title;
}

// Props de `<Image>` / `getImage` para una foto: el import local, o la URL remota (Blob) con sus dimensiones.
export type PhotoSource = { src: ImageMetadata } | { src: string; width: number; height: number };

export function photoSource(photo: Photo): PhotoSource {
  const { image, width, height } = photo.data;
  // El esquema exige `width` y `height` cuando `image` es una URL.
  return typeof image === "string" ? { src: image, width: width!, height: height! } : { src: image };
}

// Tamaño original de la foto, sea local o remota.
export function photoSize(photo: Photo): { width: number; height: number } {
  const { image, width, height } = photo.data;
  return typeof image === "string" ? { width: width!, height: height! } : { width: image.width, height: image.height };
}

// Línea de micro-metadatos de una foto: lugar · fecha · cámara.
export function photoMeta(photo: Photo): string {
  const { location, date, camera, focalLength, aperture } = photo.data;
  return [location, formatDate(date), [camera, focalLength, aperture].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" · ");
}

// Slug de un tema para su URL: "cultura digital" → "cultura-digital", "programación" → "programacion".
export function topicSlug(topic: string): string {
  return topic
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface TopicIndexEntry {
  slug: string;
  label: string;
  entries: GardenEntry[];
  photos: Photo[];
}

// Un tema por slug (los que difieren solo en mayúsculas o tildes son el mismo), con todo lo publicado que lo lleva.
export async function getTopicIndex(): Promise<Map<string, TopicIndexEntry>> {
  const index = new Map<string, TopicIndexEntry>();
  const slot = (topic: string): TopicIndexEntry | undefined => {
    const slug = topicSlug(topic);
    if (!slug) return undefined;
    if (!index.has(slug)) index.set(slug, { slug, label: topic, entries: [], photos: [] });
    return index.get(slug);
  };

  for (const entry of sortByTendedDesc(await getCollection("jardin", isPublished))) {
    for (const topic of entry.data.topics) slot(topic)?.entries.push(entry);
  }
  for (const photo of sortByDateDesc(await getCollection("carrete", isPublished))) {
    for (const topic of photo.data.topics) slot(topic)?.photos.push(photo);
  }
  return index;
}
