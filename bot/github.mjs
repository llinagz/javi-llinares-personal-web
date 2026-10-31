// Cliente mínimo de la API de GitHub (Git Data API) con `fetch`; sin octokit.
import { slugFrom } from "../scripts/lib/frontmatter.mjs";

export function createGithub({ token, repo, branch = "main", fetch = globalThis.fetch }) {
  const base = `https://api.github.com/repos/${repo}`;

  async function api(path, { method = "GET", body, accept = "application/vnd.github+json" } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jardin-bot",
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = new Error(`GitHub ${method} ${path} → ${response.status} ${detail.slice(0, 200)}`);
      error.status = response.status;
      throw error;
    }
    return accept.includes("raw") ? response.text() : response.json();
  }

  const headSha = async () => (await api(`/git/ref/heads/${branch}`)).object.sha;

  // Todas las entradas `.md` de una colección: [{ path, raw, slug }].
  async function readEntries(collection) {
    const commit = await api(`/git/commits/${await headSha()}`);
    const tree = await api(`/git/trees/${commit.tree.sha}?recursive=1`);
    const prefix = `src/content/${collection}/`;
    const files = tree.tree.filter((node) => node.type === "blob" && node.path.startsWith(prefix) && node.path.endsWith(".md"));
    return Promise.all(
      files.map(async (node) => {
        const raw = await api(`/contents/${encodeURI(node.path)}?ref=${branch}`, { accept: "application/vnd.github.raw+json" });
        return { path: node.path, raw, slug: slugFrom(raw) };
      })
    );
  }

  async function readSlugs(collection) {
    return (await readEntries(collection)).map((entry) => entry.slug).filter(Boolean);
  }

  // La entrada del jardín o del carrete con ese slug, o `undefined`: { collection, path, raw, slug }.
  async function findEntry(slug, collections = ["jardin", "carrete"]) {
    for (const collection of collections) {
      const found = (await readEntries(collection)).find((entry) => entry.slug === slug);
      if (found) return { collection, ...found };
    }
    return undefined;
  }

  // Contenido de un fichero de la rama, o `undefined` si no existe.
  async function readFile(path) {
    try {
      return await api(`/contents/${encodeURI(path)}?ref=${branch}`, { accept: "application/vnd.github.raw+json" });
    } catch (error) {
      if (error.status === 404) return undefined;
      throw error;
    }
  }

  async function tripExists(slug) {
    return (await readSlugs("viajes")).includes(slug);
  }

  // El trailer `Telegram-Update: <id>` marca los commits ya hechos; Telegram puede reintentar el webhook.
  async function alreadyProcessed(updateId) {
    const commits = await api(`/commits?sha=${branch}&per_page=20`);
    return commits.some((entry) => entry.commit.message.includes(`Telegram-Update: ${updateId}`));
  }

  // Un único commit con todos los ficheros (texto o Buffer); `{ path, delete: true }` borra el fichero.
  // Reintenta si la rama avanzó mientras tanto.
  async function commitFiles({ files, message }) {
    const blobs = await Promise.all(
      files.map(async ({ path, content, delete: remove }) => {
        if (remove) return { path, mode: "100644", type: "blob", sha: null };
        const data = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
        const blob = await api("/git/blobs", { method: "POST", body: { content: data.toString("base64"), encoding: "base64" } });
        return { path, mode: "100644", type: "blob", sha: blob.sha };
      })
    );

    for (let attempt = 1; ; attempt++) {
      const parent = await headSha();
      const parentCommit = await api(`/git/commits/${parent}`);
      const tree = await api("/git/trees", { method: "POST", body: { base_tree: parentCommit.tree.sha, tree: blobs } });
      const commit = await api("/git/commits", { method: "POST", body: { message, tree: tree.sha, parents: [parent] } });
      try {
        await api(`/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: commit.sha } });
        return commit.sha;
      } catch (error) {
        if (error.status !== 422 || attempt >= 3) throw error;
      }
    }
  }

  return { readEntries, readSlugs, findEntry, readFile, tripExists, alreadyProcessed, commitFiles };
}
