import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { excerpt, gardenTypes, isPublished, sortByTendedDesc } from "@/lib/content";

export async function GET(context: APIContext) {
  const entries = sortByTendedDesc(await getCollection("jardin", isPublished));

  return rss({
    title: "Javi Llinares | Jardín",
    description: "Pensamientos, reflexiones, artículos y análisis de libros y videojuegos: el jardín digital de Javi Llinares.",
    site: context.site!,
    customData: "<language>es-es</language>",
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: excerpt(entry),
      pubDate: entry.data.created,
      link: `/jardin/${entry.data.slug}/`,
      categories: [gardenTypes[entry.data.type], ...entry.data.topics]
    }))
  });
}
