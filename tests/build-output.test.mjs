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
const allPages = htmlFiles.map((file) => ({
  file,
  route: "/" + relative(dist, file).replaceAll("\\", "/").replace(/(^|\/)index\.html$/, "$1"),
  html: read(file)
}));
// Las páginas de redirección (/blog/...) no llevan metadatos propios ni van al sitemap.
const isRedirect = ({ html }) => /http-equiv="refresh"/i.test(html);
const pages = allPages.filter((page) => !isRedirect(page));
const redirects = allPages.filter(isRedirect);

function entries(collection) {
  return readdirSync(join(content, collection))
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = read(join(content, collection, name));
      return {
        name,
        // El slug puede ir con o sin comillas: el bot de publicación no tiene por qué entrecomillarlo.
        slug: raw.match(/^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1],
        draft: /^draft:\s*true/m.test(raw),
        // Fecha del último riego (`updated ?? created`); solo aplica al jardín.
        tended: raw.match(/^updated:\s*(\S+)/m)?.[1] ?? raw.match(/^created:\s*(\S+)/m)?.[1]
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
  for (const collection of ["jardin", "carrete", "viajes", "projects"]) {
    test(`${collection}: cada entrada tiene slug y los slugs son únicos`, () => {
      const items = entries(collection);
      assert.ok(items.every((item) => item.slug), "Hay entradas sin slug");
      assert.equal(new Set(items.map((item) => item.slug)).size, items.length);
    });
  }

  const routes = { jardin: ["jardin"], carrete: ["carrete"], viajes: ["carrete", "viajes"] };

  test("los borradores no se publican", (t) => {
    let drafts = 0;
    for (const [collection, base] of Object.entries(routes)) {
      for (const entry of entries(collection).filter((item) => item.draft)) {
        drafts++;
        assert.ok(!existsSync(join(dist, ...base, entry.slug)), `Borrador publicado: /${base.join("/")}/${entry.slug}/`);
      }
    }
    if (drafts === 0) t.skip("No hay borradores: el filtro no se está comprobando");
  });

  // Las fotos privadas no deben commitearse aunque sean borrador: el repositorio es público.
  test("ninguna página referencia imágenes de borradores", () => {
    const linked = allPages.filter(({ html }) => /\/_astro\/ejemplo-/.test(html)).map(({ route }) => route);
    assert.deepEqual(linked, []);
  });

  // Astro emite a dist/_astro/ el original de toda imagen declarada con `image()`; los quita
  // src/lib/astro-drop-unused-originals.mjs.
  test("no se publican imágenes sin referenciar en _astro/", () => {
    const files = walk(dist);
    const texts = files.filter((file) => /\.(html|css|js|xml|json|txt)$/.test(file)).map(read).join("\n");
    const unused = files
      .filter((file) => /\.(png|jpe?g|webp|avif|gif|tiff)$/.test(file))
      .map((file) => relative(dist, file).replaceAll("\\", "/"))
      .filter((path) => path.startsWith("_astro/"))
      .filter((path) => {
        const name = path.split("/").at(-1);
        return !texts.includes(name) && !texts.includes(encodeURIComponent(name));
      });
    assert.deepEqual(unused, []);
  });

  test("toda imagen de _astro/ enlazada en el HTML existe", () => {
    for (const { route, html } of pages) {
      for (const [path] of html.matchAll(/\/_astro\/[^"'\s,)]+\.(?:png|jpe?g|webp|avif|gif|tiff)/g)) {
        assert.ok(existsSync(join(dist, decodeURIComponent(path))), `${route} enlaza ${path}, que no existe`);
      }
    }
  });

  test("hay una página por cada entrada publicada", () => {
    for (const [collection, base] of Object.entries(routes)) {
      for (const entry of entries(collection).filter((item) => !item.draft)) {
        assert.ok(existsSync(join(dist, ...base, entry.slug, "index.html")), `Falta /${base.join("/")}/${entry.slug}/`);
      }
    }
    for (const project of entries("projects")) {
      assert.ok(existsSync(join(dist, "projects", project.slug, "index.html")), `Falta /projects/${project.slug}/`);
    }
  });
});

describe("portada", () => {
  test("enlaza la entrada del jardín regada más recientemente", () => {
    const published = entries("jardin").filter((entry) => !entry.draft);
    const latest = published.map((entry) => entry.tended).sort().at(-1);
    const slugs = published.filter((entry) => entry.tended === latest).map((entry) => entry.slug);
    const home = pages.find(({ route }) => route === "/");
    assert.ok(slugs.some((slug) => home.html.includes(`href="/jardin/${slug}"`)), `La portada no enlaza ninguna de: ${slugs}`);
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

  test("las entradas del jardín declaran og:type=article y og:image absoluta", () => {
    const post = pages.find(({ route, html }) => /^\/jardin\/[^/]+\/$/.test(route) && meta(html, "property", "og:image"));
    assert.ok(post, "Ningún artículo con og:image");
    assert.equal(meta(post.html, "property", "og:type"), "article");
    assert.match(meta(post.html, "property", "og:image"), new RegExp(`^${site}/_astro/.+\\.jpg$`));
  });
});

describe("redirecciones", () => {
  // URLs antiguas del blog que no deben romperse.
  const legacySlugs = [
    "arquitectura-limpia-para-proyectos-pequenos",
    "leer-mejor-para-construir-mejor-tecnologia",
    "por-que-escribir-mientras-construyo"
  ];

  test("/blog/ y cada /blog/<slug>/ antiguo redirigen al jardín", () => {
    const targets = new Map(redirects.map(({ route, html }) => [route, html.match(/url=([^"]+)"/i)?.[1]]));
    assert.equal(targets.get("/blog/"), "/jardin");
    for (const slug of legacySlugs) {
      assert.equal(targets.get(`/blog/${slug}/`), `/jardin/${slug}`, `/blog/${slug}/ no redirige`);
      assert.ok(existsSync(join(dist, "jardin", slug, "index.html")), `El destino /jardin/${slug}/ no existe`);
    }
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

  // La serif de lectura (Literata) va autoalojada: ninguna página debe pedir fuentes a Google.
  test("no se cargan fuentes de Google", () => {
    for (const { route, html } of pages) {
      assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), `${route} carga fuentes de Google`);
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

  test("el RSS contiene exactamente las entradas publicadas del jardín", () => {
    const feed = read(join(dist, "rss.xml"));
    const published = entries("jardin").filter((entry) => !entry.draft);
    assert.equal([...feed.matchAll(/<item>/g)].length, published.length);
    for (const entry of published) {
      assert.ok(feed.includes(`${site}/jardin/${entry.slug}/`), `Falta en el RSS: ${entry.slug}`);
    }
  });
});
describe("temas", () => {
  const topicSlug = (topic) =>
    topic.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // Temas de lo publicado (jardín y carrete), con el slug de cada pieza que los lleva.
  const topics = new Map();
  for (const [collection, section] of [["jardin", "jardin"], ["carrete", "carrete"]]) {
    for (const item of entries(collection).filter((entry) => !entry.draft)) {
      const raw = read(join(content, collection, item.name));
      const list = raw.match(/^topics:\s*(\[.*\])\s*$/m)?.[1];
      for (const topic of list ? JSON.parse(list) : []) {
        const slug = topicSlug(topic);
        if (!topics.has(slug)) topics.set(slug, []);
        topics.get(slug).push(`/${section}/${item.slug}`);
      }
    }
  }

  test("cada tema publicado tiene su página y lista todo lo que lo lleva", () => {
    assert.ok(topics.size > 0, "No hay ningún tema publicado que comprobar");
    for (const [slug, hrefs] of topics) {
      const page = allPages.find(({ route }) => route === `/temas/${slug}/`);
      assert.ok(page, `Falta la página del tema: ${slug}`);
      for (const href of hrefs) {
        assert.ok(page.html.includes(`href="${href}"`), `/temas/${slug}/ no enlaza ${href}`);
      }
    }
  });

  test("/temas/ enlaza todos los temas publicados", () => {
    const index = allPages.find(({ route }) => route === "/temas/");
    assert.ok(index, "Falta /temas/");
    for (const slug of topics.keys()) {
      assert.ok(index.html.includes(`href="/temas/${slug}"`), `/temas/ no enlaza ${slug}`);
    }
  });

  test("no hay páginas de tema sin contenido publicado", () => {
    const routes = allPages.filter(({ route }) => route.startsWith("/temas/") && route !== "/temas/").map(({ route }) => route);
    assert.deepEqual(routes.sort(), [...topics.keys()].map((slug) => `/temas/${slug}/`).sort());
  });
});
