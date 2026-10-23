import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import rehypeSidenotes from "./src/lib/rehype-sidenotes.mjs";

export default defineConfig({
  site: "https://javierllinares.eu",
  markdown: {
    rehypePlugins: [rehypeSidenotes]
  },
  redirects: {
    "/blog": "/jardin",
    "/blog/[slug]": "/jardin/[slug]"
  },
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    sitemap()
  ]
});
