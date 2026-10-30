// Almacén de las fotos del carrete (Vercel Blob público). Fuera de git, así que borrarlas libera el espacio de verdad.
import { del, put } from "@vercel/blob";

export function createBlob() {
  return {
    // → URL pública del fichero. El sufijo aleatorio evita colisiones y que la URL sea adivinable.
    async upload(name, buffer) {
      const blob = await put(name, buffer, { access: "public", addRandomSuffix: true, contentType: "image/jpeg" });
      return blob.url;
    },
    async remove(url) {
      await del(url);
    }
  };
}
