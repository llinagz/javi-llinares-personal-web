import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { sortByDateDesc } from "@/lib/content";

export async function GET(context: APIContext) {
  const posts = sortByDateDesc(await getCollection("blog", ({ data }) => !data.draft));

  return rss({
    title: "Javi Llinares | Blog",
    description: "Artículos, ensayos y notas de trabajo sobre código, producto, lectura y cultura digital.",
    site: context.site!,
    customData: "<language>es-es</language>",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: `/blog/${post.data.slug}/`,
      categories: [post.data.category, ...post.data.tags]
    }))
  });
}
