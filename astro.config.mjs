import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import rehypeSidenotes from "./src/lib/rehype-sidenotes.mjs";
import dropUnusedOriginals from "./src/lib/astro-drop-unused-originals.mjs";

export default defineConfig({
  site: "https://javierllinares.eu",
  markdown: {
    rehypePlugins: [rehypeSidenotes]
  },
  image: {
    // Las fotos del bot viven en Vercel Blob; Astro las descarga y optimiza (WebP + srcset) durante el build.
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }]
  },
  redirects: {
    "/blog": "/jardin",
    "/blog/[slug]": "/jardin/[slug]"
  },
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    sitemap(),
    dropUnusedOriginals()
  ]
});
