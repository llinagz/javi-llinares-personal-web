// Pruebas de humo sobre el resultado de `astro build` (dist/).
// Ejecutar con `npm test`, que construye el sitio antes.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import config from "../astro.config.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const content = fileURLToPath(new URL("../src/content/", import.meta.url));
const site = config.site.replace(/\/$/, "");

assert.ok(existsSync(dist), "No existe dist/. Ejecuta `npm run build` antes de las pruebas.");

const read = (path) => readFileSync(path, "utf8");
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const pages = htmlFiles.map((file) => ({
  file,
  route: "/" + relative(dist, file).replaceAll("\\", "/").replace(/(^|\/)index\.html$/, "$1"),
  html: read(file)
}));

function entries(collection) {
  return readdirSync(join(content, collection))
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = read(join(content, collection, name));
      return {
        name,
        slug: raw.match(/^slug:\s*"([^"]+)"/m)?.[1],
        draft: /^draft:\s*true/m.test(raw)
      };
    });
}

const resolves = (href) => {
  const target = join(dist, href);
  return (existsSync(target) && statSync(target).isFile()) || existsSync(join(target, "index.html"));
};

const meta = (html, attr, key) =>
  html.match(new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`))?.[1];

describe("contenido", () => {
  for (const collection of ["blog", "projects"]) {
    test(`${collection}: cada entrada tiene slug y los slugs son únicos`, () => {
      const items = entries(collection);
      assert.ok(items.every((item) => item.slug), "Hay entradas sin slug");
      assert.equal(new Set(items.map((item) => item.slug)).size, items.length);
    });
  }

  test("los borradores no se publican", () => {
    for (const post of entries("blog").filter((entry) => entry.draft)) {
      assert.ok(!existsSync(join(dist, "blog", post.slug)), `Borrador publicado: ${post.slug}`);
    }
  });

  test("hay una página por cada entrada publicada", () => {
    for (const post of entries("blog").filter((entry) => !entry.draft)) {
      assert.ok(existsSync(join(dist, "blog", post.slug, "index.html")), `Falta /blog/${post.slug}/`);
    }
    for (const project of entries("projects")) {
      assert.ok(existsSync(join(dist, "projects", project.slug, "index.html")), `Falta /projects/${project.slug}/`);
    }
  });
});

describe("metadatos de página", () => {
  for (const { route, html } of pages) {
    test(`${route}: título, descripción, canonical y Open Graph`, () => {
      assert.match(html, /<html lang="es"/);
      assert.match(html, /<title>[^<]+<\/title>/);
      assert.ok(meta(html, "name", "description"), "falta meta description");
      assert.match(html, new RegExp(`<link rel="canonical" href="${site}/`));
      for (const key of ["og:title", "og:description", "og:url", "og:type"]) {
        assert.ok(meta(html, "property", key), `falta ${key}`);
      }
      assert.ok(meta(html, "name", "twitter:card"), "falta twitter:card");
    });
  }

  test("los artículos declaran og:type=article y og:image absoluta", () => {
    const post = pages.find(({ route, html }) => route.startsWith("/blog/") && route !== "/blog/" && meta(html, "property", "og:image"));
    assert.ok(post, "Ningún artículo con og:image");
    assert.equal(meta(post.html, "property", "og:type"), "article");
    assert.match(meta(post.html, "property", "og:image"), new RegExp(`^${site}/_astro/.+\\.jpg$`));
  });
});

describe("integridad del build", () => {
  test("todos los enlaces internos apuntan a un fichero existente", () => {
    const broken = [];
    for (const { route, html } of pages) {
      for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
        if (href.startsWith("//")) continue;
        if (!resolves(href)) broken.push(`${route} -> ${href}`);
      }
    }
    assert.deepEqual(broken, []);
  });

  test("las imágenes se sirven optimizadas (WebP) con dimensiones", () => {
    for (const { route, html } of pages) {
      assert.ok(!/\/_astro\/[^"\s]+\.png/.test(html), `${route} referencia un PNG sin optimizar`);
      for (const [tag] of html.matchAll(/<img[^>]*>/g)) {
        assert.match(tag, /width="\d+"/, `${route}: <img> sin width`);
        assert.match(tag, /height="\d+"/, `${route}: <img> sin height`);
      }
    }
  });

  test("no hay JavaScript de terceros", () => {
    for (const { route, html } of pages) {
      assert.ok(!/<script[^>]*\ssrc="https?:/.test(html), `${route} carga un script externo`);
      assert.ok(!/gsap/i.test(html), `${route} menciona GSAP`);
    }
  });
});

describe("SEO", () => {
  test("robots.txt apunta al sitemap", () => {
    assert.match(read(join(dist, "robots.txt")), new RegExp(`Sitemap: ${site}/sitemap-index\\.xml`));
  });

  test("el sitemap lista todas las páginas salvo la 404", () => {
    const sitemap = read(join(dist, "sitemap-0.xml"));
    for (const { route } of pages.filter(({ route }) => route !== "/404.html")) {
      assert.ok(sitemap.includes(`<loc>${site}${route}</loc>`), `Falta en el sitemap: ${route}`);
    }
    assert.ok(!sitemap.includes("404"), "La 404 no debe estar en el sitemap");
  });

  test("el RSS contiene exactamente los artículos publicados", () => {
    const feed = read(join(dist, "rss.xml"));
    const published = entries("blog").filter((entry) => !entry.draft);
    assert.equal([...feed.matchAll(/<item>/g)].length, published.length);
    for (const post of published) {
      assert.ok(feed.includes(`${site}/blog/${post.slug}/`), `Falta en el RSS: ${post.slug}`);
    }
  });
});