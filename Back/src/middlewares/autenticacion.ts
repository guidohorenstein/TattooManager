import type { Request, Response, NextFunction } from "express";
import { obtenerSesionActiva } from "../auth/auth.service.js";
import { crearToken } from "../auth/auth.tokens.js";
import { escribirCookieSesion, nombreCookieSesion } from "../auth/cookie-sesion.js";
import { renovarSesion } from "../sesiones/sesiones.service.js";
import { HttpError } from "../errors/http-error.js";

export async function requerirSesion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  res.set("Cache-Control", "no-store");

  try {
    const { usuario, sesion } = await obtenerSesionActiva(
      req.cookies?.[nombreCookieSesion],
    );
    req.usuario = usuario;
    await renovarCookie(res, sesion);
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    console.error("Error al comprobar la sesión.");
    res.status(500).json({ error: "No pudimos comprobar la sesión." });
    return;
  }

  next();
}

// Una falla al renovar no debe cortar la solicitud: la sesión actual sigue vigente.
async function renovarCookie(
  res: Response,
  sesion: Parameters<typeof renovarSesion>[0],
): Promise<void> {
  try {
    const expiraAt = await renovarSesion(sesion);
    if (expiraAt) {
      escribirCookieSesion(res, crearToken(sesion.usuarioId, sesion.id, expiraAt), expiraAt);
    }
  } catch {
    console.error("No pudimos renovar la sesión.");
  }
}
