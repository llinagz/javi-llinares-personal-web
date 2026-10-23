// Webhook del bot de Telegram (función de Vercel). Ver docs/bot-telegram.md.
import { createGithub } from "../bot/github.mjs";
import { processPhoto } from "../bot/foto.mjs";
import { handleUpdate } from "../bot/procesar.mjs";
import { createTelegram } from "../bot/telegram.mjs";

const REQUIRED = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_ALLOWED_USERS", "GITHUB_TOKEN", "GITHUB_REPO"];

export async function POST(request) {
  const env = process.env;

  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    console.error(`Faltan variables de entorno: ${missing.join(", ")}`);
    return new Response("Configuración incompleta", { status: 500 });
  }

  if (request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("No autorizado", { status: 401 });
  }

  const update = await request.json().catch(() => null);
  if (update) {
    await handleUpdate(update, {
      allowedUsers: env.TELEGRAM_ALLOWED_USERS.split(",").map((id) => Number(id.trim())).filter(Boolean),
      github: createGithub({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH || "main" }),
      telegram: createTelegram({ token: env.TELEGRAM_BOT_TOKEN }),
      processPhoto,
      siteUrl: env.SITE_URL || "https://javierllinares.eu"
    });
  }

  // Siempre 200 tras procesar: si no, Telegram reintentaría el webhook.
  return new Response("ok");
}
