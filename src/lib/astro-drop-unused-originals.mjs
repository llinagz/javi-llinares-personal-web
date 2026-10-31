// Astro copia a `_astro/` el original de toda imagen declarada con `image()`, aunque solo se use para generar
// las versiones optimizadas. Esta integración quita al final del build las imágenes que nada enlaza.
// Decide por referencias y no por el nombre: lo que aparece en el HTML, CSS, etc. (og:image, lightbox) se queda.
import { readdir, readFile, rm, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".tiff"]);
const TEXT = new Set([".html", ".css", ".js", ".xml", ".json", ".txt"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))
  );
  return files.flat();
}

export default function dropUnusedOriginals() {
  return {
    name: "drop-unused-originals",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await walk(root);
        const assets = join(root, "_astro");
        const texts = await Promise.all(
          files.filter((file) => TEXT.has(extname(file))).map((file) => readFile(file, "utf8"))
        );
        const haystack = texts.join("\n");

        let removed = 0;
        let bytes = 0;
        for (const file of files) {
          if (!file.startsWith(assets) || !IMAGE.has(extname(file))) continue;
          const name = basename(file);
          if (haystack.includes(name) || haystack.includes(encodeURIComponent(name))) continue;
          bytes += (await stat(file)).size;
          await rm(file);
          removed++;
        }

        logger.info(`${removed} imágenes sin referenciar eliminadas (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
      }
    }
  };
}
