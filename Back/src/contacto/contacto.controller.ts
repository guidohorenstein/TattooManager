import type { Request, Response } from "express";
import { enviarMensajeContacto } from "./contacto.service.js";
export async function recibirMensaje(req: Request, res: Response) {
  if (!req.is("application/json")) {
    res.status(415).json({ error: "Enviá el mensaje como JSON." });
    return;
  }
  await enviarMensajeContacto(req.body);
  res
    .status(200)
    .json({ message: "Recibimos tu consulta. Te responderemos por email." });
}
