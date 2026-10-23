// Crea un fichero de contenido nuevo con el frontmatter relleno: `npm run nuevo`.
// Sin dependencias. Los campos y valores siguen los esquemas de src/content.config.ts.
// Uso: `npm run nuevo` o `npm run nuevo -- jardin "Título de la entrada"` (tipos: jardin, carrete, viaje).
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const content = join(root, "src", "content");
const images = join(root, "src", "assets", "images");

const rl = createInterface({ input: process.stdin, output: process.stdout });
// Con iterador (y no con rl.question) también funciona con la entrada redirigida.
const lines = rl[Symbol.asyncIterator]();

let closed = false;
rl.on("close", () => {
  closed = true;
});
rl.on("SIGINT", () => {
  console.log("\nCancelado. No se ha creado nada.");
  process.exit(130);
});

async function ask(question, { def, required = false } = {}) {
  for (;;) {
    if (!closed) {
      rl.setPrompt(def !== undefined ? `${question} [${def}]: ` : `${question}: `);
      rl.prompt();
    }
    const { value, done } = await lines.next();
    const text = done ? "" : value.trim();
    if (text) return text;
    if (def !== undefined) return def;
    if (!required) return "";
    if (done) throw new Error("La entrada terminó antes de completar los datos.");
    console.log("  Este dato es obligatorio.");
  }
}

// Como `ask`, pero repite la pregunta hasta que `validate` no devuelva un error.
async function askValid(question, validate, options) {
  for (;;) {
    const answer = await ask(question, options);
    if (answer === "") return answer;
    const error = validate(answer);
    if (!error) return answer;
    console.log(`  ${error}`);
  }
}

async function choose(question, options, def) {
  const answer = await askValid(
    `${question} (${options.join(" / ")})`,
    (text) => (pick(options, text) ? null : `Elige una de: ${options.join(", ")} (o su número).`),
    { def }
  );
  return pick(options, answer);
}

const pick = (options, text) => options.find((option, index) => option === text.toLowerCase() || String(index + 1) === text);

async function yesNo(question, def) {
  const answer = await askValid(
    `${question} [${def ? "S/n" : "s/N"}]`,
    (text) => (/^(s|si|sí|n|no)$/i.test(text) ? null : "Responde s o n."),
    {}
  );
  return answer === "" ? def : /^s/i.test(answer);
}

const today = () => new Date().toLocaleDateString("sv-SE");

function isDate(text) {
  const parsed = new Date(text);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
}
const dateError = (text) => (isDate(text) ? null : "Usa el formato AAAA-MM-DD, por ejemplo 2026-10-24.");

const slugify = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Slugs ya usados en una colección (el nombre del fichero no tiene por qué coincidir).
function slugsOf(collection) {
  const dir = join(content, collection);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => readFileSync(join(dir, name), "utf8").match(/^slug:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1])
    .filter(Boolean);
}

function askSlug(collection, title) {
  const used = slugsOf(collection);
  const def = slugify(title) || undefined;
  return askValid(
    "Slug (la URL)",
    (text) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text)) return "Solo minúsculas, números y guiones, sin espacios ni tildes.";
      if (used.includes(text)) return `Ya existe un "${text}" en ${collection}.`;
      return null;
    },
    { def, required: true }
  );
}

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

// Pide la ruta de una imagen (vale arrastrar el fichero a la terminal) y devuelve la ruta absoluta.
async function askImage(question, { required }) {
  const answer = await askValid(
    question,
    (text) => {
      const path = text.replace(/^["']|["']$/g, "");
      if (!existsSync(path)) return "No encuentro ese fichero.";
      if (!imageExtensions.includes(extname(path).toLowerCase())) return `Formatos admitidos: ${imageExtensions.join(", ")}.`;
      return null;
    },
    { required }
  );
  return answer && answer.replace(/^["']|["']$/g, "");
}

// --- Serialización del frontmatter -------------------------------------------------------------

const date = (text) => ({ raw: text });

function format(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if ("raw" in value) return value.raw;
    const entries = Object.entries(value).filter(([, inner]) => inner !== undefined && inner !== "");
    return `\n${entries.map(([key, inner]) => `  ${key}: ${format(inner)}`).join("\n")}`;
  }
  return typeof value === "string" || Array.isArray(value) ? JSON.stringify(value) : String(value);
}

function frontmatter(fields) {
  const lines = fields
    .filter(([, value]) => value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => {
      const text = format(value);
      return text.startsWith("\n") ? `${key}:${text}` : `${key}: ${text}`;
    });
  return `---\n${lines.join("\n")}\n---\n`;
}

// --- Un asistente por colección ----------------------------------------------------------------

async function nuevoJardin(title) {
  const slug = await askSlug("jardin", title);
  const type = await choose("Tipo", ["pensamiento", "reflexion", "articulo", "analisis"], "pensamiento");
  const stage = await choose("Estado", ["semilla", "creciendo", "perenne"], "semilla");
  const description = await ask("Descripción de una o dos frases (Enter para omitir)");
  const topics = (await ask("Temas separados por comas (Enter para omitir)")).split(",").map((topic) => topic.trim()).filter(Boolean);

  let work;
  if (type === "analisis") {
    console.log("\nUn análisis necesita la ficha de la obra:");
    const kind = await choose("  Tipo de obra", ["libro", "videojuego"], "libro");
    work = {
      title: await ask("  Título de la obra", { required: true }),
      kind,
      creator: await ask(kind === "libro" ? "  Autor" : "  Estudio", { required: true }),
      year: await askValid("  Año (Enter para omitir)", (text) => (/^\d{4}$/.test(text) ? null : "Un año de cuatro cifras.")),
      platform: kind === "videojuego" ? await ask("  Plataforma (Enter para omitir)") : ""
    };
    work.year = work.year ? Number(work.year) : undefined;
  }

  const created = await askValid("Fecha de creación", dateError, { def: today() });
  const draft = await yesNo("¿Dejarlo como borrador? (no se publica hasta que lo quites)", true);

  const file = join(content, "jardin", `${slug}.md`);
  const text =
    frontmatter([
      ["title", title],
      ["slug", slug],
      ["description", description],
      ["type", type],
      ["stage", stage],
      ["created", date(created)],
      ["topics", topics],
      ["work", work],
      ["draft", draft]
    ]) + "\nEscribe aquí el texto.\n";

  return { file, text, draft, notes: [] };
}

async function nuevoCarrete(title) {
  const slug = await askSlug("carrete", title);
  const source = await askImage("Ruta de la foto (arrastra el archivo aquí)", { required: true });
  const photoDate = await askValid("Fecha de la foto", dateError, { def: today() });
  const caption = await ask("Pie de foto (Enter para omitir)");
  const location = await ask("Lugar (Enter para omitir)");

  const trips = slugsOf("viajes");
  const trip = trips.length > 0 ? await choose("Viaje (Enter para ninguno)", trips) : "";
  const draft = await yesNo("¿Dejarla como borrador? (no se publica hasta que lo quites)", true);

  const imageName = `${slug}${extname(source).toLowerCase()}`;
  const copy = { from: source, to: join(images, "carrete", imageName) };
  const file = join(content, "carrete", `${slug}.md`);
  const text = frontmatter([
    ["title", title],
    ["slug", slug],
    ["date", date(photoDate)],
    ["image", `../../assets/images/carrete/${imageName}`],
    ["caption", caption],
    ["location", location],
    ["trip", trip],
    ["draft", draft]
  ]);

  const notes = [
    "Antes de publicarla: reduce la foto a ~2560 px de lado largo y quítale el GPS del EXIF.",
    "Los datos de cámara (camera, focalLength, aperture, shutterSpeed, iso) se añaden a mano si los quieres."
  ];
  return { file, text, draft, copies: [copy], notes };
}

async function nuevoViaje(title) {
  const slug = await askSlug("viajes", title);
  const place = await ask("Lugar", { required: true });
  const startDate = await askValid("Fecha de inicio", dateError, { def: today() });
  const endDate = await askValid("Fecha de fin (Enter para omitir)", dateError);
  const summary = await ask("Resumen de una frase", { required: true });
  const source = await askImage("Portada: ruta de una imagen (Enter para omitir)", { required: false });
  const draft = await yesNo("¿Dejarlo como borrador? (no se publica hasta que lo quites)", true);

  const coverName = source ? `${slug}-portada${extname(source).toLowerCase()}` : undefined;
  const file = join(content, "viajes", `${slug}.md`);
  const text =
    frontmatter([
      ["title", title],
      ["slug", slug],
      ["place", place],
      ["startDate", date(startDate)],
      ["endDate", endDate ? date(endDate) : undefined],
      ["summary", summary],
      ["cover", coverName ? `../../assets/images/carrete/${coverName}` : undefined],
      ["draft", draft]
    ]) + "\nEscribe aquí el relato del viaje.\n";

  const copies = source ? [{ from: source, to: join(images, "carrete", coverName) }] : [];
  const notes = source ? ["Antes de publicarla: reduce la imagen a ~2560 px de lado largo y quítale el GPS del EXIF."] : [];
  return { file, text, draft, copies, notes };
}

const kinds = {
  jardin: { label: "Jardín (pensamiento, reflexión, artículo, análisis)", run: nuevoJardin },
  carrete: { label: "Foto del carrete", run: nuevoCarrete },
  viaje: { label: "Viaje", run: nuevoViaje }
};
const aliases = { foto: "carrete", viajes: "viaje" };

async function main() {
  const [first, ...rest] = process.argv.slice(2);
  const given = aliases[first] ?? first;

  console.log("Nuevo contenido\n");
  const kind = kinds[given] ? given : await choose("¿Qué quieres crear?", Object.keys(kinds), "jardin");
  console.log(`→ ${kinds[kind].label}\n`);

  const title = (kinds[given] ? rest.join(" ").trim() : "") || (await ask("Título", { required: true }));
  const { file, text, draft, copies = [], notes } = await kinds[kind].run(title);

  // Nada se escribe hasta tenerlo todo, y nunca se sobrescribe un fichero existente.
  for (const path of [file, ...copies.map((copy) => copy.to)]) {
    if (existsSync(path)) throw new Error(`Ya existe ${relative(root, path)}. No se ha creado nada.`);
  }
  for (const { from, to } of copies) copyFileSync(from, to);
  writeFileSync(file, text, { flag: "wx" });

  console.log("\n✔ Creado:");
  console.log(`  ${relative(root, file)}`);
  for (const { to } of copies) console.log(`  ${relative(root, to)}`);

  console.log("\nSiguientes pasos:");
  console.log("  1. Edita el fichero y escribe el contenido.");
  console.log("  2. npm run dev  → míralo en http://localhost:4321 (los borradores se ven en local).");
  if (draft) console.log("  3. Para publicarlo, borra la línea `draft: true` (o ponla en false).");
  console.log(`  ${draft ? 4 : 3}. npm test  → comprueba, y luego commit y push.`);
  for (const note of notes) console.log(`\n⚠ ${note}`);
}

main()
  .catch((error) => {
    console.error(`\n✖ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
