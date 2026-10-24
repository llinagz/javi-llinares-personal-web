import assert from "node:assert/strict";
import { describe, test } from "node:test";
import exifr from "exifr";
import sharp from "sharp";
import { POST } from "../api/telegram.mjs";
import { createGithub } from "../bot/github.mjs";
import { buildGardenEntry, buildPhotoEntry } from "../bot/entrada.mjs";
import { processPhoto } from "../bot/foto.mjs";
import { parseMessage } from "../bot/mensaje.mjs";
import { handleUpdate, madridToIso } from "../bot/procesar.mjs";

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
    const photo = buildPhotoEntry({ text: "Foto", date: "2026-10-23", topics: ["rutina"], slugs: [], image: Buffer.from("x") });
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

  test("foto: pie de varias líneas, viaje y ficha técnica", () => {
    const entry = buildPhotoEntry({
      text: "Faro\nCon niebla",
      date: "2026-10-20",
      exif: { camera: "Sony ILCE-7M4", focalLength: "35 mm", aperture: "f/1.8", shutterSpeed: "1/250", iso: 100 },
      viaje: "asturias-2026",
      slugs: [],
      image: Buffer.from("x")
    });
    const [md, img] = entry.files;
    assert.equal(img.path, "src/assets/images/carrete/faro.jpg");
    assert.equal(
      md.content,
      '---\ntitle: "Faro"\nslug: "faro"\ndate: 2026-10-20\nimage: "../../assets/images/carrete/faro.jpg"\ncaption: "Con niebla"\ntrip: "asturias-2026"\ncamera: "Sony ILCE-7M4"\nfocalLength: "35 mm"\naperture: "f/1.8"\nshutterSpeed: "1/250"\niso: 100\n---\n'
    );
  });

  test("foto sin pie: título por defecto con la fecha", () => {
    const entry = buildPhotoEntry({ text: "", date: "2026-10-23", slugs: [], image: Buffer.from("x") });
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

    const { image, exif } = await processPhoto(original);
    const meta = await sharp(image).metadata();
    assert.equal(Math.max(meta.width, meta.height), 2560);
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
  function setup({ trips = ["asturias-2026"], processed = false } = {}) {
    const calls = { commits: [], replies: [] };
    const deps = {
      allowedUsers: [1],
      siteUrl: "https://ejemplo.eu",
      github: {
        tripExists: async (slug) => trips.includes(slug),
        alreadyProcessed: async () => processed,
        readSlugs: async () => [],
        commitFiles: async (commit) => calls.commits.push(commit)
      },
      telegram: {
        downloadFile: async () => Buffer.from("raw"),
        reply: async (_, text) => calls.replies.push(text)
      },
      processPhoto: async () => ({ image: Buffer.from("jpg"), exif: { takenOn: "2026-10-20" } })
    };
    return { calls, deps };
  }
  const base = { update_id: 7, message: { from: { id: 1 }, chat: { id: 1 }, date: 1792000000 } };
  const withMessage = (extra) => ({ ...base, message: { ...base.message, ...extra } });

  test("usuario no autorizado: no hace nada ni responde", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ from: { id: 99 }, text: "hola" }), deps);
    assert.deepEqual(calls, { commits: [], replies: [] });
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

  test("texto: un commit con el .md y respuesta con la URL", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ text: "Una idea" }), deps);
    assert.equal(calls.commits.length, 1);
    assert.match(calls.commits[0].message, /Telegram-Update: 7/);
    assert.match(calls.replies[0], /https:\/\/ejemplo\.eu\/jardin\/una-idea\//);
  });

  test("foto: un único commit con imagen y .md, con la fecha del EXIF", async () => {
    const { calls, deps } = setup();
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Faro #viaje asturias-2026" }), deps);
    assert.equal(calls.commits.length, 1);
    assert.deepEqual(calls.commits[0].files.map((file) => file.path), [
      "src/content/carrete/faro.md",
      "src/assets/images/carrete/faro.jpg"
    ]);
    assert.match(calls.commits[0].files[0].content, /date: 2026-10-20\n/);
  });

  test("foto sin EXIF: la fecha lleva la hora del mensaje; con hora EXIF, esa hora (Madrid)", async () => {
    const { calls, deps } = setup();
    deps.processPhoto = async () => ({ image: Buffer.from("jpg"), exif: {} });
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Sin exif" }), deps);
    assert.match(calls.commits[0].files[0].content, /date: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\n/);

    deps.processPhoto = async () => ({ image: Buffer.from("jpg"), exif: { takenOn: "2026-10-20", takenAt: "2026-10-20T10:05:00" } });
    await handleUpdate(withMessage({ photo: [{ file_id: "a" }], caption: "Con exif" }), deps);
    assert.match(calls.commits[1].files[0].content, /date: 2026-10-20T08:05:00Z\n/);
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
  test("commitFiles: un solo commit con todos los ficheros y reintento si la rama avanzó", async () => {
    const log = [];
    let patches = 0;
    const fetch = async (url, { method = "GET", body } = {}) => {
      const path = new URL(url).pathname.replace("/repos/a/b", "");
      log.push(`${method} ${path}`);
      const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
      if (path === "/git/ref/heads/main") return json({ object: { sha: "p" + patches } });
      if (path.startsWith("/git/commits/p")) return json({ tree: { sha: "t" } });
      if (path === "/git/blobs") return json({ sha: "b" });
      if (path === "/git/trees") return json({ sha: "nt" });
      if (path === "/git/commits") return json({ sha: "c" + patches });
      if (method === "PATCH") return ++patches === 1 ? json({ message: "no fast-forward" }, 422) : json({});
      throw new Error("ruta inesperada " + path);
    };
    const github = createGithub({ token: "x", repo: "a/b", fetch });
    const sha = await github.commitFiles({
      files: [{ path: "a.md", content: "hola" }, { path: "b.jpg", content: Buffer.from("img") }],
      message: "m"
    });
    assert.equal(sha, "c1");
    assert.equal(log.filter((line) => line === "POST /git/blobs").length, 2);
    assert.equal(log.filter((line) => line === "POST /git/commits").length, 2);
  });
});
