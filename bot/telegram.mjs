// Cliente mínimo de la Bot API de Telegram.
const MAX_FILE_BYTES = 20 * 1024 * 1024; // límite de descarga de la Bot API

export function createTelegram({ token, fetch = globalThis.fetch }) {
  async function downloadFile(fileId) {
    const info = await (await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)).json();
    if (!info.ok) throw new Error("Telegram no ha dejado descargar el archivo (¿pasa de 20 MB?).");
    if (info.result.file_size > MAX_FILE_BYTES) throw new Error("El archivo pasa de 20 MB.");
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`);
    if (!response.ok) throw new Error(`No se pudo descargar el archivo (${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  }

  async function reply(chatId, text) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
  }

  return { downloadFile, reply };
}
