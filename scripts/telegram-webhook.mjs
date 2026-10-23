// Registra el webhook del bot de Telegram: `npm run bot:webhook -- https://tu-dominio/api/telegram`.
// Lee TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET del entorno. Lo ejecuta una persona; nunca el CI.
const [url] = process.argv.slice(2);
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret } = process.env;

if (!url || !token || !secret) {
  console.error("Uso: TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… npm run bot:webhook -- <url-del-endpoint>");
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true })
});
const result = await response.json();
console.log(result.ok ? `✔ Webhook registrado en ${url}` : `✖ ${result.description}`);
process.exitCode = result.ok ? 0 : 1;
