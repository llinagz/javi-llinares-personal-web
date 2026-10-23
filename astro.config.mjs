import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://javierllinares.eu",
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
