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

// Carrete: una entrada por foto. `image` es una ruta relativa a `src/assets/images/carrete/` (fotos manuales) o una URL
// de Vercel Blob (fotos del bot de Telegram, que no se guardan en git); en ese caso `width` y `height` son obligatorios.
const carrete = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/carrete" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    image: z.union([z.string().url(), image()]),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
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
  }).superRefine((data, ctx) => {
    // Al validar, una imagen local es un marcador de texto (`__ASTRO_IMAGE_…`): solo las URL empiezan por http.
    if (typeof data.image === "string" && /^https?:\/\//.test(data.image) && !(data.width && data.height)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["width"],
        message: "Una imagen remota necesita `width` y `height`."
      });
    }
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

// Ahora: estado vital actual, un único fichero `src/content/now.md` editado a mano o con `/ahora` del bot.
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
