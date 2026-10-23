import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";

// Jardín: pensamientos, reflexiones, artículos y análisis, con distinto grado de madurez.
const jardin = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/jardin" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    type: z.enum(["pensamiento", "reflexion", "articulo", "analisis"]).default("pensamiento"),
    stage: z.enum(["semilla", "creciendo", "perenne"]).default("semilla"),
    created: z.coerce.date(),
    updated: z.coerce.date().optional(),
    topics: z.array(z.string()).default([]),
    image: image().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    work: z.object({
      title: z.string(),
      kind: z.enum(["libro", "videojuego"]),
      creator: z.string(),
      year: z.number().int().optional(),
      platform: z.string().optional()
    }).optional()
  }).superRefine((data, ctx) => {
    if (data.type === "analisis" && !data.work) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["work"],
        message: "Un análisis necesita la ficha de la obra (`work`)."
      });
    }
  })
});

// Viajes: agrupan fotos del carrete y llevan un relato breve en el cuerpo.
const viajes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/viajes" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string(),
    place: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    summary: z.string(),
    cover: image().optional(),
    draft: z.boolean().default(false)
  })
});

// Carrete: una entrada por foto.
const carrete = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/carrete" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    image: image(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    location: z.string().optional(),
    trip: reference("viajes").optional(),
    topics: z.array(z.string()).default([]),
    camera: z.string().optional(),
    focalLength: z.string().optional(),
    aperture: z.string().optional(),
    shutterSpeed: z.string().optional(),
    iso: z.number().optional(),
    draft: z.boolean().default(false)
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) => z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    longDescription: z.string(),
    image: image().optional(),
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

// Ahora: estado vital actual, un único fichero `src/content/now.md` editado a mano.
// Las listas vacías ocultan su fila en la portada.
const now = defineCollection({
  loader: glob({ pattern: "now.md", base: "./src/content" }),
  schema: z.object({
    updated: z.coerce.date(),
    reading: z.array(z.string()).default([]),
    playing: z.array(z.string()).default([]),
    listening: z.array(z.string()).default([]),
    building: z.array(z.string()).default([])
  })
});

export const collections = { jardin, viajes, carrete, projects, now };
