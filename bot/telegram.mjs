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

  const call = (method, body) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

  // `buttons`: [{ text, data }] en una fila (botones en línea bajo el mensaje).
  async function reply(chatId, text, { buttons } = {}) {
    await call("sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...(buttons ? { reply_markup: { inline_keyboard: [buttons.map(({ text: label, data }) => ({ text: label, callback_data: data }))] } } : {})
    });
  }

  // Quita el "cargando" del botón pulsado.
  async function answerCallback(id, text) {
    await call("answerCallbackQuery", { callback_query_id: id, ...(text ? { text } : {}) });
  }

  // Sustituye el texto de un mensaje y, al no mandar `reply_markup`, le quita los botones.
  async function editMessage(chatId, messageId, text) {
    await call("editMessageText", { chat_id: chatId, message_id: messageId, text, disable_web_page_preview: true });
  }

  return { downloadFile, reply, answerCallback, editMessage };
}
