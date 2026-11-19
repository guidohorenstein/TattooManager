import { randomUUID } from "node:crypto";
import { HttpError } from "../errors/http-error.js";
import { enviarCorreo } from "../correos/correos.service.js";
import { correoCuenta } from "../correos/correos.templates.js";
import type { MensajeContacto } from "./contacto.entity.js";
export function validarMensaje(entrada: unknown): MensajeContacto {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada))
    throw new HttpError(400, "Revisá los datos del mensaje.");
  const d = entrada as Record<string, unknown>;
  if (
    typeof d.nombre !== "string" ||
    d.nombre.trim().length < 2 ||
    d.nombre.length > 100 ||
    typeof d.email !== "string" ||
    d.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()) ||
    typeof d.mensaje !== "string" ||
    d.mensaje.trim().length < 10 ||
    d.mensaje.length > 5000
  )
    throw new HttpError(400, "Revisá el nombre, email y mensaje.");
  return {
    nombre: d.nombre.trim(),
    email: d.email.trim(),
    mensaje: d.mensaje.trim(),
  };
}
export async function enviarMensajeContacto(entrada: unknown) {
  const datos = validarMensaje(entrada);
  const destinatario =
    process.env.CONTACT_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim();
  if (!destinatario)
    throw new HttpError(503, "El contacto todavía no está configurado.");
  await enviarCorreo(
    correoCuenta({
      para: destinatario,
      nombre: null,
      asunto: "Nueva consulta sobre TattooManager",
      mensaje:
        "Nombre: " +
        datos.nombre +
        "\nEmail: " +
        datos.email +
        "\n\n" +
        datos.mensaje,
      clave: "contacto-" + randomUUID(),
    }),
  );
}
