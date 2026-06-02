import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    image: z.string().optional(),
    date: z.coerce.date(),
    readingTime: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false)
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    longDescription: z.string(),
    image: z.string().optional(),
    status: z.enum(["En desarrollo", "MVP", "Idea", "Publicado"]),
    techStack: z.array(z.string()),
    featured: z.boolean().default(false),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.string()
      })
    ),
    date: z.coerce.date(),
    problem: z.string(),
    solution: z.string(),
    currentStage: z.string()
  })
});

export const collections = { blog, projects };
