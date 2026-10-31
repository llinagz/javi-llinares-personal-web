import assert from "node:assert/strict";
import { describe, test } from "node:test";
import exifr from "exifr";
import sharp from "sharp";
import { POST } from "../api/telegram.mjs";
import { createGithub } from "../bot/github.mjs";
import { applyNow, buildNow, emptyNow, parseNow } from "../bot/ahora.mjs";
import { buildGardenEntry, buildPhotoEntry, photoSlug } from "../bot/entrada.mjs";
import { processPhoto } from "../bot/foto.mjs";
import { formatRecent, imageOf, isExample, listRecent, setDraft, targetFrom } from "../bot/gestion.mjs";
import { parseMessage } from "../bot/mensaje.mjs";
import { handleUpdate, madridToIso } from "../bot/procesar.mjs";

const URL_BLOB = "https://abc123.public.blob.vercel-storage.com/carrete/faro-x1y2.jpg";

describe("parseMessage", () => {
  test("texto sin foto → jardín", () => {
    assert.deepEqual(parseMessage({ text: "Una idea" }), { kind: "jardin", text: "Una idea", tags: { viaje: undefined, borrador: false, destacada: false, stage: undefined, topics: [] } });
  });

  test("#palabra libre → tema, fuera del texto; no pisa las etiquetas con significado", () => {
    const parsed = parseMessage({
      photo: [{ file_id: "a" }],
      caption: "Hoy toca darle caña #Rutina #viaje cadiz-2026 #gym #rutina"
    });
    assert.equal(parsed.text, "Hoy toca darle caña");
    assert.deepEqual(parsed.tags.topics, ["rutina", "gym"]);
    assert.equal(parsed.tags.viaje, "cadiz-2026");
    assert.deepEqual(parseMessage({ text: "Idea #creciendo #lectura" }).tags.topics, ["lectura"]);
  });

  test("#creciendo / #perenne se detectan y se quitan (en cualquier posición)", () => {
    const parsed = parseMessage({ text: "Título\nCuerpo #Perenne" });
    assert.equal(parsed.text, "Título\nCuerpo");
    assert.equal(parsed.tags.stage, "perenne");
    assert.equal(parseMessage({ text: "#creciendo Algo" }).tags.stage, "creciendo");
  });

  test("foto con pie y etiquetas: usa el tamaño mayor y quita las etiquetas del pie", () => {
    const parsed = parseMessage({
      photo: [{ file_id: "pequena" }, { file_id: "grande" }],
      caption: "Faro al atardecer #viaje asturias-2026"
    });
    assert.equal(parsed.kind, "carrete");
    assert.equal(parsed.fileId, "grande");
    assert.equal(parsed.text, "Faro al atardecer");
    assert.equal(parsed.tags.viaje, "asturias-2026");
  });

  test("#borrador se detecta y se quita", () => {
    const parsed = parseMessage({ text: "Algo a medias #borrador" });
    assert.equal(parsed.text, "Algo a medias");
    assert.equal(parsed.tags.borrador, true);
  });

  test("#destacada se detecta y se quita", () => {
    const parsed = parseMessage({ text: "Idea clave #destacada" });
    assert.equal(parsed.text, "Idea clave");
    assert.equal(parsed.tags.destacada, true);
    assert.deepEqual(parsed.tags.topics, []);
  });

  test("documento de imagen sí; HEIC y otros formatos, error", () => {
    assert.equal(parseMessage({ document: { file_id: "a", mime_type: "image/jpeg" } }).kind, "carrete");
    assert.equal(parseMessage({ document: { file_id: "a", mime_type: "image/heic" } }).kind, "error");
    assert.equal(parseMessage({ document: { file_id: "a", mime_type: "application/pdf" } }).kind, "error");
  });

  test("/start devuelve la ayuda y un mensaje vacío se ignora", () => {
    assert.equal(parseMessage({ text: "/start" }).kind, "comando");
    assert.equal(parseMessage({}).kind, "ignorar");
  });

  test("la ayuda cubre cada etiqueta y comando, con ejemplos, y cabe en un mensaje de Telegram", () => {
    const { reply } = parseMessage({ text: "/ayuda" });
    for (const word of ["#semilla", "#creciendo", "#perenne", "#destacada", "#borrador", "#viaje", "/ahora", "quitar", "vaciar", "nota", "/borrar", "/ocultar", "/mostrar", "/ultimas", "EJEMPLOS"]) {
      assert.ok(reply.includes(word), `falta "${word}" en la ayuda`);
    }
    assert.ok(reply.length < 4096, "Telegram corta los mensajes de más de 4096 caracteres");
  });

  test("/borrar, /ocultar y /mostrar: slug opcional y mensaje citado", () => {
    assert.deepEqual(parseMessage({ text: "/borrar Mi-Slug" }), { kind: "gestion", op: "borrar", arg: "mi-slug", quoted: undefined });
    assert.deepEqual(parseMessage({ text: "/ocultar@mi_bot", reply_to_message: { text: "Publicado: https://x.eu/jardin/a/" } }), {
      kind: "gestion",
      op: "ocultar",
      arg: undefined,
      quoted: "Publicado: https://x.eu/jardin/a/"
    });
    assert.equal(parseMessage({ text: "/mostrar a" }).op, "mostrar");
    assert.equal(parseMessage({ text: "/ultimas" }).kind, "ultimas");
    assert.equal(parseMessage({ text: "/borrar a b" }).kind, "error"); // más de un argumento: no se publica como pensamiento
  });
});

describe("gestión de lo publicado", () => {
  const post = '---\ntitle: "Hola"\nslug: "hola"\ncreated: 2026-10-23T10:00:00Z\n---\n\nCuerpo\n';

  test("targetFrom saca sección y slug de la URL o de «jardin/slug»", () => {
    assert.deepEqual(targetFrom("Publicado (visible en ~1 min): https://x.eu/jardin/leer-despacio/"), { collection: "jardin", slug: "leer-despacio" });
    assert.deepEqual(targetFrom("¿Borrar carrete/faro-2?\n«Faro»"), { collection: "carrete", slug: "faro-2" });
    assert.equal(targetFrom("hola"), undefined);
    assert.equal(targetFrom(undefined), undefined);
  });

  test("setDraft añade, quita y es idempotente; toca solo el frontmatter", () => {
    const hidden = setDraft(post, true);
    assert.match(hidden, /created: 2026-10-23T10:00:00Z\ndraft: true\n---\n\nCuerpo\n$/);
    assert.equal(setDraft(hidden, true), hidden);
    assert.equal(setDraft(hidden, false), post);
    assert.equal(setDraft(post, false), post);
    assert.equal(setDraft("sin frontmatter", true), "sin frontmatter");
  });

  test("imageOf distingue la URL del almacén de una imagen local", () => {
    assert.deepEqual(imageOf("src/content/carrete/a.md", `---\nimage: "${URL_BLOB}"\n---\n`), { url: URL_BLOB });
    assert.deepEqual(imageOf("src/content/carrete/a.md", '---\nimage: "../../assets/images/carrete/a.jpg"\n---\n'), {
      path: "src/assets/images/carrete/a.jpg"
    });
    assert.equal(imageOf("src/content/jardin/a.md", post), undefined);
  });

  test("listRecent ordena por fecha, limita y marca los borradores", () => {
    const entries = [
      { collection: "jardin", slug: "viejo", raw: '---\ntitle: "Viejo"\nslug: "viejo"\ncreated: 2026-01-01\n---\n' },
      { collection: "carrete", slug: "foto", raw: '---\ntitle: "Foto"\nslug: "foto"\ndate: 2026-10-20T08:05:00Z\n---\n' },
      { collection: "jardin", slug: "oculto", raw: '---\ntitle: "Oculto"\nslug: "oculto"\ncreated: 2026-05-05\ndraft: true\n---\n' }
    ];
    const items = listRecent(entries, 2);
    assert.deepEqual(items.map((item) => item.slug), ["foto", "oculto"]);
    assert.equal(formatRecent(items), "• carrete/foto\n  Foto · 2026-10-20\n• jardin/oculto\n  Oculto · 2026-05-05 · borrador");
    assert.match(formatRecent([]), /Todavía no hay nada/);
  });

  test("isExample reconoce los borradores de prueba", () => {
    assert.ok(isExample("ejemplo-costa"));
    assert.ok(!isExample("mi-ejemplo"));
  });
});

describe("/ahora: mensaje", () => {
  const action = (text) => parseMessage({ text }).action;

  test("las formas del comando", () => {
    assert.deepEqual(action("/ahora"), { op: "ver" });
    assert.deepEqual(action("/ahora leyendo Dune, Ubik"), { op: "añadir", list: "reading", items: ["Dune", "Ubik"] });
    assert.deepEqual(action("/ahora Escuchando Café Tacvba"), { op: "añadir", list: "listening", items: ["Café Tacvba"] });
    assert.deepEqual(action("/ahora quitar leyendo Dune"), { op: "quitar", list: "reading", items: ["Dune"] });
    assert.deepEqual(action("/ahora vaciar jugando"), { op: "vaciar", list: "playing" });
    assert.deepEqual(action("/ahora nota Mucho trabajo\ny poco sueño"), { op: "nota", text: "Mucho trabajo\ny poco sueño" });
    assert.deepEqual(action("/ahora nota"), { op: "nota", text: "" });
    assert.deepEqual(action("/ahora@mi_bot leyendo Dune"), { op: "añadir", list: "reading", items: ["Dune"] });
  });

  test("uso incorrecto → error con el uso, sin acción", () => {
    for (const text of ["/ahora comiendo pizza", "/ahora leyendo", "/ahora quitar", "/ahora quitar leyendo", "/ahora vaciar", "/ahora vaciar leyendo Dune"]) {
      const parsed = parseMessage({ text });
      assert.equal(parsed.kind, "error", text);
      assert.match(parsed.reply, /Uso de \/ahora/);
    }
  });
});

describe("/ahora: now.md", () => {
  const manual = '---\nupdated: 2026-10-23\nreading: []\nplaying: []\nlistening: []\nbuilding:\n  - "Noesis"\n---\n';

  test("parseNow lee el fichero escrito a mano y el que escribe buildNow", () => {
    const state = parseNow(manual, "2026-01-01");
    assert.equal(state.updated, "2026-10-23");
    assert.deepEqual(state.lists, { reading: [], playing: [], listening: [], building: ["Noesis"] });
    assert.deepEqual(parseNow(buildNow(state), "2026-01-01"), state);
  });

  test("parseNow: sin fichero, estado vacío", () => {
    assert.deepEqual(parseNow(undefined, "2026-01-01"), emptyNow("2026-01-01"));
  });

  test("añadir sin duplicar (ni por mayúsculas ni tildes) y actualizar la fecha", () => {
    const state = parseNow(manual, "2026-01-01");
    const next = applyNow(state, { op: "añadir", list: "building", items: ["noesis", "Web"] }, "2026-10-24");
    assert.deepEqual(next.lists.building, ["Noesis", "Web"]);
    assert.equal(next.updated, "2026-10-24");
    assert.deepEqual(state.lists.building, ["Noesis"]); // no muta el original
  });

  test("quitar sin tildes ni mayúsculas; algo inexistente es un error", () => {
    const state = parseNow(buildNow({ ...emptyNow("2026-10-23"), lists: { ...emptyNow("x").lists, listening: ["Café Tacvba"] } }), "x");
    assert.deepEqual(applyNow(state, { op: "quitar", list: "listening", items: ["cafe tacvba"] }, "2026-10-24").lists.listening, []);
    assert.throws(() => applyNow(state, { op: "quitar", list: "listening", items: ["Otro"] }, "2026-10-24"), /No hay "Otro" en escuchando/);
  });

  test("vaciar y nota (poner, conservar al editar listas y borrar)", () => {
    let state = parseNow(manual, "x");
    state = applyNow(state, { op: "nota", text: "Mucho trabajo" }, "2026-10-24");
    assert.match(buildNow(state), /\n---\n\nMucho trabajo\n$/);
    state = parseNow(buildNow(state), "x");
    assert.equal(state.body, "Mucho trabajo");

    state = applyNow(state, { op: "vaciar", list: "building" }, "2026-10-24");
    assert.equal(state.body, "Mucho trabajo");
    assert.deepEqual(state.lists.building, []);
    assert.equal(applyNow(state, { op: "nota", text: "" }, "2026-10-24").body, "");
  });
});

describe("entradas", () => {
  test("pensamiento de una línea: título = cuerpo, semilla, sin draft", () => {
    const entry = buildGardenEntry({ text: "Leer despacio", date: "2026-10-23", slugs: [] });
    assert.equal(entry.slug, "leer-despacio");
    const [file] = entry.files;
    assert.equal(file.path, "src/content/jardin/leer-despacio.md");
    assert.equal(
      file.content,
      '---\ntitle: "Leer despacio"\nslug: "leer-despacio"\ntype: "pensamiento"\nstage: "semilla"\ncreated: 2026-10-23\n---\n\nLeer despacio\n'
    );
  });

  test("varias líneas: la primera es el título, el resto el cuerpo; #borrador → draft", () => {
    const entry = buildGardenEntry({ text: "Título\nCuerpo largo", date: "2026-10-23", borrador: true, slugs: [] });
    assert.match(entry.files[0].content, /draft: true/);
    assert.match(entry.files[0].content, /\n\nCuerpo largo\n$/);
  });

  test("la etapa elegida llega al frontmatter", () => {
    const entry = buildGardenEntry({ text: "Algo", date: "2026-10-23", stage: "creciendo", slugs: [] });
    assert.match(entry.files[0].content, /stage: "creciendo"/);
  });

  test("destacada escribe featured: true en el frontmatter", () => {
    const entry = buildGardenEntry({ text: "Algo", date: "2026-10-23", destacada: true, slugs: [] });
    assert.match(entry.files[0].content, /featured: true\n/);
    assert.doesNotMatch(buildGardenEntry({ text: "Algo", date: "2026-10-23", slugs: [] }).files[0].content, /featured/);
  });

  test("createdAt con hora sustituye a la fecha sola (desempata entradas del mismo día)", () => {
    const entry = buildGardenEntry({ text: "Algo", date: "2026-10-23", createdAt: "2026-10-23T20:46:56Z", slugs: [] });
    assert.match(entry.files[0].content, /created: 2026-10-23T20:46:56Z\n/);
  });

  test("los temas llegan al frontmatter del jardín y del carrete", () => {
    const garden = buildGardenEntry({ text: "Algo", date: "2026-10-23", topics: ["rutina", "gym"], slugs: [] });
    assert.match(garden.files[0].content, /topics: \["rutina","gym"\]/);
    const photo = buildPhotoEntry({ text: "Foto", date: "2026-10-23", topics: ["rutina"], slugs: [], imageUrl: URL_BLOB, width: 3, height: 2 });
    assert.match(photo.files[0].content, /topics: \["rutina"\]/);
  });

  test("slug repetido → -2, y slug vacío → nota-fecha", () => {
    assert.equal(buildGardenEntry({ text: "Hola", date: "2026-10-23", slugs: ["hola"] }).slug, "hola-2");
    assert.equal(buildGardenEntry({ text: "¿¿??", date: "2026-10-23", slugs: [] }).slug, "nota-2026-10-23");
  });

  test("título largo: se recorta por palabra", () => {
    const entry = buildGardenEntry({ text: "palabra ".repeat(20), date: "2026-10-23", slugs: [] });
    assert.ok(entry.title.length <= 70 && entry.title.endsWith("…"));
  });

  test("foto: un único .md con la URL del almacén, sus dimensiones, pie de varias líneas, viaje y ficha técnica", () => {
    const entry = buildPhotoEntry({
      text: "Faro\nCon niebla",
      date: "2026-10-20",
      exif: { camera: "Sony ILCE-7M4", focalLength: "35 mm", aperture: "f/1.8", shutterSpeed: "1/250", iso: 100 },
      viaje: "asturias-2026",
      slugs: [],
      imageUrl: URL_BLOB,
      width: 2560,
      height: 1707
    });
    assert.equal(entry.files.length, 1);
    assert.equal(entry.files[0].path, "src/content/carrete/faro.md");
    assert.equal(
      entry.files[0].content,
      `---\ntitle: "Faro"\nslug: "faro"\ndate: 2026-10-20\nimage: "${URL_BLOB}"\nwidth: 2560\nheight: 1707\ncaption: "Con niebla"\ntrip: "asturias-2026"\ncamera: "Sony ILCE-7M4"\nfocalLength: "35 mm"\naperture: "f/1.8"\nshutterSpeed: "1/250"\niso: 100\n---\n`
    );
  });

  test("photoSlug coincide con el slug de la entrada (nombra el blob antes de crearla)", () => {
    const args = { text: "Faro", date: "2026-10-20", slugs: ["faro"] };
    assert.equal(photoSlug(args), "faro-2");
    assert.equal(buildPhotoEntry({ ...args, imageUrl: URL_BLOB, width: 1, height: 1 }).slug, "faro-2");
  });

  test("foto sin pie: título por defecto con la fecha", () => {
    const entry = buildPhotoEntry({ text: "", date: "2026-10-23", slugs: [], imageUrl: URL_BLOB, width: 3, height: 2 });
    assert.equal(entry.title, "Foto del 23 de octubre de 2026");
  });
});

describe("processPhoto", () => {
  test("reduce a 2560 px, quita el GPS y todo el EXIF, y lee la ficha técnica", async () => {
    const original = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#456" } })
      .withExif({
        IFD0: { Make: "Sony", Model: "Sony ILCE-7M4" },
        IFD3: { GPSLatitudeRef: "N", GPSLatitude: "43/1 21/1 0/1", GPSLongitudeRef: "W", GPSLongitude: "5/1 51/1 0/1" }
      })
      .jpeg()
      .toBuffer();
    assert.ok((await exifr.gps(original))?.latitude, "el original de la prueba debe llevar GPS");

    const { image, width, height, exif } = await processPhoto(original);
    const meta = await sharp(image).metadata();
    assert.equal(Math.max(meta.width, meta.height), 2560);
    assert.deepEqual({ width, height }, { width: meta.width, height: meta.height });
    assert.equal(meta.format, "jpeg");
    assert.equal(meta.exif, undefined);
    assert.equal(await exifr.gps(image), undefined);
    assert.equal(exif.camera, "Sony ILCE-7M4");
  });
});

describe("madridToIso", () => {
  test("hora de pared de Madrid → UTC, en verano (+2) y en invierno (+1)", () => {
    assert.equal(madridToIso("2026-10-23T10:05:00"), "2026-10-23T08:05:00Z");
    assert.equal(madridToIso("2026-12-01T10:05:00"), "2026-12-01T09:05:00Z");
  });

  test("cerca de medianoche el día de Madrid se conserva al ir y volver", () => {
    const iso = madridToIso("2026-10-23T00:30:00");
    assert.equal(iso, "2026-10-22T22:30:00Z");
    assert.equal(new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" }), "2026-10-23");
  });
});

describe("handleUpdate", () => {
  const nowFile = '---\nupdated: 2026-10-23\nreading: []\nplaying: []\nlistening: []\nbuilding:\n  - "Noesis"\n---\n';

  const gardenRaw = '---\ntitle: "Una idea"\nslug: "una-idea"\ncreated: 2026-10-23T10:00:00Z\n---\n\nCuerpo\n';
  const photoRaw = (slug, image = URL_BLOB, extra = "") =>
    `---\ntitle: "Faro"\nslug: "${slug}"\ndate: 2026-10-20\nimage: "${image}"\nwidth: 10\nheight: 5\n${extra}---\n`;

  function setup({ trips = ["asturias-2026"], processed = false, entries = [], failCommit = false, failRemove = false } = {}) {
    const calls = { commits: [], replies: [], uploads: [], removed: [], answered: [], edits: [] };
    const deps = {
      allowedUsers: [1],
      siteUrl: "https://ejemplo.eu",
      github: {
        readFile: async () => nowFile,
        tripExists: async (slug) => trips.includes(slug),
        alreadyProcessed: async () => processed,
        readSlugs: async () => [],
        readEntries: async (collection) => entries.filter((entry) => entry.collection === collection),
        findEntry: async (slug, collections) =>
          entries.find((entry) => entry.slug === slug && (!collections || collections.includes(entry.collection))),
        commitFiles: async (commit) => {
          if (failCommit) throw new Error("GitHub caído");
          calls.commits.push(commit);
        }
      },
      telegram: {
        downloadFile: async () => Buffer.from("raw"),
        reply: async (_, text, options) => calls.replies.push(options ? { text, ...options } : text),
        answerCallback: async (id) => calls.answered.push(id),
        editMessage: async (_chat, _message, text) => calls.edits.push(text)
      },
      blob: {
        upload: async (name) => {
          calls.uploads.push(name);
          return URL_BLOB;
        },
        remove: async (url) => {
          if (failRemove) throw new Error("Blob caído");
          calls.removed.push(url);
        }
      },
      processPhoto: async () => ({ image: Buffer.from("jpg"), width: 2560, height: 1707, exif: { takenOn: "2026-10-20" } })
    };
    return { calls, deps };
  }
  const base = { update_id: 7, message: { from: { id: 1 }, chat: { id: 1 }, date: 1792000000 } };
  const withMessage = (extra) => ({ ...base, message: { ...base.message, ...extra } });

  test("usuario no autorizado: no hace nada ni responde", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ from: { id: 99 }, text: "hola" }), deps);
    assert.ok(Object.values(calls).every((list) => list.length === 0));
  });

  test("update repetido: no duplica", async () => {
    const { calls, deps } = setup({ processed: true });
    await handleUpdate(withMessage({ text: "hola" }), deps);
    assert.equal(calls.commits.length, 0);
  });

  test("#borrador con foto: respuesta de error sin commit", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "x #borrador" }), deps);
    assert.equal(calls.commits.length, 0);
    assert.equal(calls.replies.length, 1);
  });

  test("#viaje inexistente: crea el viaje en el mismo commit que la foto", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Playa #viaje cadiz-2026" }), deps);
    assert.equal(calls.commits.length, 1);
    const trip = calls.commits[0].files.find((file) => file.path === "src/content/viajes/cadiz-2026.md");
    assert.ok(trip);
    assert.match(trip.content, /title: "Cadiz 2026"/);
    assert.match(trip.content, /startDate: 2026-10-20/);
    assert.doesNotMatch(trip.content, /draft/);
    assert.match(calls.replies[0], /He creado el viaje "Cadiz 2026"/);
  });

  test("#viaje existente: no vuelve a crearlo", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Faro #viaje asturias-2026" }), deps);
    assert.ok(!calls.commits[0].files.some((file) => file.path.includes("/viajes/")));
    assert.doesNotMatch(calls.replies[0], /He creado/);
  });

  test("/ahora leyendo: un commit en now.md que conserva el resto", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ text: "/ahora leyendo Dune" }), deps);
    assert.equal(calls.commits.length, 1);
    assert.match(calls.commits[0].message, /^chore\(ahora\): añadir leyendo: Dune\n\nTelegram-Update: 7$/);
    const [file] = calls.commits[0].files;
    assert.equal(file.path, "src/content/now.md");
    assert.match(file.content, /reading: \["Dune"\]/);
    assert.match(file.content, /building: \["Noesis"\]/);
    assert.match(calls.replies[0], /leyendo: Dune/);
  });

  test("/ahora sin argumentos o con un error: responde sin commit", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ text: "/ahora" }), deps);
    await handleUpdate(withMessage({ text: "/ahora quitar leyendo Dune" }), deps);
    assert.equal(calls.commits.length, 0);
    assert.match(calls.replies[0], /construyendo: Noesis/);
    assert.match(calls.replies[1], /No hay "Dune" en leyendo/);
  });

  test("texto: un commit con el .md y respuesta con la URL", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ text: "Una idea" }), deps);
    assert.equal(calls.commits.length, 1);
    assert.match(calls.commits[0].message, /Telegram-Update: 7/);
    assert.match(calls.replies[0], /https:\/\/ejemplo\.eu\/jardin\/una-idea\//);
  });

  test("foto: sube la imagen al almacén y el commit lleva solo el .md, con la fecha del EXIF", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Faro #viaje asturias-2026" }), deps);
    assert.deepEqual(calls.uploads, ["carrete/faro.jpg"]);
    assert.equal(calls.commits.length, 1);
    assert.deepEqual(calls.commits[0].files.map((file) => file.path), ["src/content/carrete/faro.md"]);
    const { content } = calls.commits[0].files[0];
    assert.match(content, /date: 2026-10-20\n/);
    assert.match(content, new RegExp(`image: "${URL_BLOB}"\\nwidth: 2560\\nheight: 1707\\n`));
    assert.deepEqual(calls.removed, []);
  });

  test("foto: si el commit falla, la imagen se retira del almacén", async () => {
    const { calls, deps } = setup({ failCommit: true });
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Faro" }), deps);
    assert.deepEqual(calls.removed, [URL_BLOB]);
    assert.match(calls.replies[0], /No he podido publicarlo: GitHub caído/);
  });

  test("foto sin EXIF: la fecha lleva la hora del mensaje; con hora EXIF, esa hora (Madrid)", async () => {
    const { calls, deps } = setup();
    deps.processPhoto = async () => ({ image: Buffer.from("jpg"), width: 3, height: 2, exif: {} });
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Sin exif" }), deps);
    assert.match(calls.commits[0].files[0].content, /date: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\n/);

    deps.processPhoto = async () => ({ image: Buffer.from("jpg"), width: 3, height: 2, exif: { takenOn: "2026-10-20", takenAt: "2026-10-20T10:05:00" } });
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Con exif" }), deps);
    assert.match(calls.commits[1].files[0].content, /date: 2026-10-20T08:05:00Z\n/);
  });

  test("borrador: la respuesta incluye jardin/<slug> para poder gestionarlo luego", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ text: "Idea #borrador" }), deps);
    assert.equal(calls.replies[0], "Guardado como borrador: jardin/idea");
  });

  describe("gestión", () => {
    const entries = [
      { collection: "jardin", slug: "una-idea", path: "src/content/jardin/una-idea.md", raw: gardenRaw },
      { collection: "jardin", slug: "ejemplo-pensamiento", path: "src/content/jardin/ejemplo-pensamiento.md", raw: gardenRaw },
      { collection: "carrete", slug: "faro", path: "src/content/carrete/faro.md", raw: photoRaw("faro", URL_BLOB, 'trip: "asturias-2026"\n') },
      { collection: "carrete", slug: "local", path: "src/content/carrete/local.md", raw: photoRaw("local", "../../assets/images/carrete/local.jpg") }
    ];
    const callback = (data, text, from = 1) => ({
      update_id: 8,
      callback_query: { id: "cb", from: { id: from }, data, message: { message_id: 5, chat: { id: 1 }, text } }
    });

    test("/ultimas lista lo publicado sin hacer commit", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(withMessage({ text: "/ultimas" }), deps);
      assert.equal(calls.commits.length, 0);
      assert.match(calls.replies[0], /jardin\/una-idea/);
      assert.match(calls.replies[0], /carrete\/faro/);
    });

    test("/borrar por slug o respondiendo: pide confirmación con botones y no hace commit", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(withMessage({ text: "/borrar una-idea" }), deps);
      await handleUpdate(withMessage({ text: "/borrar", reply_to_message: { text: "Publicado (visible en ~1 min): https://ejemplo.eu/carrete/faro/" } }), deps);
      assert.equal(calls.commits.length, 0);
      assert.match(calls.replies[0].text, /^¿Borrar jardin\/una-idea\?/);
      assert.match(calls.replies[1].text, /^¿Borrar carrete\/faro\?/);
      assert.deepEqual(calls.replies[0].buttons.map((button) => button.data), ["borrar", "cancelar"]);
    });

    test("/borrar: sin destino, con slug inexistente o ejemplo-*, responde sin botones", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(withMessage({ text: "/borrar" }), deps);
      await handleUpdate(withMessage({ text: "/borrar nada" }), deps);
      await handleUpdate(withMessage({ text: "/borrar ejemplo-pensamiento" }), deps);
      assert.equal(calls.commits.length, 0);
      assert.ok(calls.replies.every((reply) => typeof reply === "string"));
      assert.match(calls.replies[0], /Responde con \/borrar/);
      assert.match(calls.replies[1], /No encuentro «nada»/);
      assert.match(calls.replies[2], /ejemplo-\*/);
    });

    test("confirmar borra el .md y quita la imagen del almacén; avisa del viaje sin fotos", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(callback("borrar", "¿Borrar carrete/faro?\n«Faro»"), deps);
      assert.deepEqual(calls.answered, ["cb"]);
      assert.deepEqual(calls.commits[0].files, [{ path: "src/content/carrete/faro.md", delete: true }]);
      assert.match(calls.commits[0].message, /^chore\(carrete\): borrar faro\n\nTelegram-Update: 8$/);
      assert.deepEqual(calls.removed, [URL_BLOB]);
      assert.match(calls.edits[0], /Borrado: carrete\/faro/);
      assert.match(calls.edits[0], /viaje «asturias-2026» se queda sin fotos/);
    });

    test("confirmar una foto con imagen local borra también el fichero de imagen", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(callback("borrar", "¿Borrar carrete/local?"), deps);
      assert.deepEqual(calls.commits[0].files.map((file) => file.path), ["src/content/carrete/local.md", "src/assets/images/carrete/local.jpg"]);
      assert.deepEqual(calls.removed, []);
    });

    test("una imagen local compartida con otra entrada no se borra", async () => {
      const shared = [...entries, { collection: "carrete", slug: "copia", path: "src/content/carrete/copia.md", raw: photoRaw("copia", "../../assets/images/carrete/local.jpg") }];
      const { calls, deps } = setup({ entries: shared });
      await handleUpdate(callback("borrar", "¿Borrar carrete/local?"), deps);
      assert.deepEqual(calls.commits[0].files.map((file) => file.path), ["src/content/carrete/local.md"]);
    });

    test("confirmar un texto: un commit y aviso de que sigue en el historial", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(callback("borrar", "¿Borrar jardin/una-idea?"), deps);
      assert.deepEqual(calls.commits[0].files, [{ path: "src/content/jardin/una-idea.md", delete: true }]);
      assert.deepEqual(calls.removed, []);
      assert.match(calls.edits[0], /historial de git/);
    });

    test("si el almacén falla tras el commit, lo cuenta", async () => {
      const { calls, deps } = setup({ entries, failRemove: true });
      await handleUpdate(callback("borrar", "¿Borrar carrete/faro?"), deps);
      assert.equal(calls.commits.length, 1);
      assert.match(calls.edits[0], /no he podido quitar la imagen del almacén \(Blob caído\)/);
    });

    test("cancelar, un usuario ajeno o un segundo toque no borran nada", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(callback("cancelar", "¿Borrar jardin/una-idea?"), deps);
      assert.match(calls.edits[0], /Cancelado/);
      await handleUpdate(callback("borrar", "¿Borrar jardin/una-idea?", 99), deps);
      await handleUpdate(callback("borrar", "¿Borrar jardin/ya-borrada?"), deps);
      await handleUpdate(callback("borrar", "¿Borrar jardin/ejemplo-pensamiento?"), deps);
      assert.equal(calls.commits.length, 0);
      assert.deepEqual(calls.removed, []);
      assert.match(calls.edits[1], /ya no existe/);
      assert.match(calls.edits[2], /No sé qué borrar/);
      assert.equal(calls.answered.length, 3); // el de otra cuenta ni se contesta
    });

    test("/ocultar y /mostrar solo cambian draft; con fotos o repetido, responden sin commit", async () => {
      const { calls, deps } = setup({ entries });
      await handleUpdate(withMessage({ text: "/ocultar una-idea" }), deps);
      assert.match(calls.commits[0].message, /^chore\(jardin\): ocultar una-idea/);
      assert.match(calls.commits[0].files[0].content, /created: 2026-10-23T10:00:00Z\ndraft: true\n---/);
      assert.match(calls.replies[0], /Oculta \(borrador\): jardin\/una-idea/);

      await handleUpdate(withMessage({ text: "/mostrar una-idea" }), deps); // ya publicada: sin cambios
      await handleUpdate(withMessage({ text: "/ocultar faro" }), deps);
      assert.equal(calls.commits.length, 1);
      assert.match(calls.replies[1], /ya estaba publicada/);
      assert.match(calls.replies[2], /Para una foto usa \/borrar/);
    });
  });
});

describe("api/telegram", () => {
  const env = {
    TELEGRAM_BOT_TOKEN: "t",
    TELEGRAM_WEBHOOK_SECRET: "secreto",
    TELEGRAM_ALLOWED_USERS: "1",
    GITHUB_TOKEN: "g",
    GITHUB_REPO: "a/b"
  };

  test("secreto incorrecto → 401; configuración incompleta → 500", async () => {
    const saved = { ...process.env };
    try {
      Object.assign(process.env, env);
      const bad = new Request("https://x/api/telegram", { method: "POST", headers: { "x-telegram-bot-api-secret-token": "otro" }, body: "{}" });
      assert.equal((await POST(bad)).status, 401);

      delete process.env.GITHUB_TOKEN;
      assert.equal((await POST(bad)).status, 500);
    } finally {
      process.env = saved;
    }
  });
});

describe("cliente de GitHub", () => {
  test("readFile: devuelve el contenido, o undefined si el fichero no existe", async () => {
    const fetch = async (url) =>
      new URL(url).pathname.endsWith("/now.md") ? new Response("hola") : new Response("no", { status: 404 });
    const github = createGithub({ token: "x", repo: "a/b", fetch });
    assert.equal(await github.readFile("src/content/now.md"), "hola");
    assert.equal(await github.readFile("src/content/nada.md"), undefined);
  });

  test("commitFiles: un solo commit con todos los ficheros y reintento si la rama avanzó", async () => {
    const log = [];
    let patches = 0;
    let tree;
    const fetch = async (url, { method = "GET", body } = {}) => {
      const path = new URL(url).pathname.replace("/repos/a/b", "");
      log.push(`${method} ${path}`);
      const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
      if (path === "/git/ref/heads/main") return json({ object: { sha: "p" + patches } });
      if (path.startsWith("/git/commits/p")) return json({ tree: { sha: "t" } });
      if (path === "/git/blobs") return json({ sha: "b" });
      if (path === "/git/trees") {
        tree = JSON.parse(body).tree;
        return json({ sha: "nt" });
      }
      if (path === "/git/commits") return json({ sha: "c" + patches });
      if (method === "PATCH") return ++patches === 1 ? json({ message: "no fast-forward" }, 422) : json({});
      throw new Error("ruta inesperada " + path);
    };
    const github = createGithub({ token: "x", repo: "a/b", fetch });
    const sha = await github.commitFiles({
      files: [{ path: "a.md", content: "hola" }, { path: "b.jpg", content: Buffer.from("img") }, { path: "c.jpg", delete: true }],
      message: "m"
    });
    assert.equal(sha, "c1");
    assert.equal(log.filter((line) => line === "POST /git/blobs").length, 2); // el borrado no sube blob
    assert.equal(log.filter((line) => line === "POST /git/commits").length, 2);
    assert.deepEqual(tree.map(({ path, sha }) => [path, sha]), [["a.md", "b"], ["b.jpg", "b"], ["c.jpg", null]]);
  });

  test("findEntry: busca por slug en las colecciones y devuelve el fichero", async () => {
    const files = { "src/content/jardin/a.md": '---\nslug: "a"\n---\n', "src/content/carrete/b.md": '---\nslug: "b"\n---\n' };
    const fetch = async (url) => {
      const path = new URL(url).pathname.replace("/repos/a/b", "");
      const json = (data) => new Response(JSON.stringify(data));
      if (path === "/git/ref/heads/main") return json({ object: { sha: "p" } });
      if (path === "/git/commits/p") return json({ tree: { sha: "t" } });
      if (path === "/git/trees/t") return json({ tree: Object.keys(files).map((p) => ({ type: "blob", path: p })) });
      if (path.startsWith("/contents/")) return new Response(files[decodeURI(path.slice("/contents/".length))]);
      throw new Error("ruta inesperada " + path);
    };
    const github = createGithub({ token: "x", repo: "a/b", fetch });
    assert.deepEqual(await github.findEntry("b"), { collection: "carrete", path: "src/content/carrete/b.md", raw: files["src/content/carrete/b.md"], slug: "b" });
    assert.equal(await github.findEntry("b", ["jardin"]), undefined);
    assert.equal(await github.findEntry("nada"), undefined);
  });
});
