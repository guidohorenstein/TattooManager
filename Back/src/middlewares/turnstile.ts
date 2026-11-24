import type { RequestHandler } from "express";
import { HttpError } from "../errors/http-error.js";

const urlVerificacion =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type Verificar = (cuerpo: URLSearchParams) => Promise<{ success?: unknown }>;

const verificarEnCloudflare: Verificar = async (cuerpo) => {
  const respuesta = await fetch(urlVerificacion, {
    method: "POST",
    body: cuerpo,
    signal: AbortSignal.timeout(5000),
  });
  return (await respuesta.json()) as { success?: unknown };
};

/**
 * Exige un token válido de Cloudflare Turnstile en el header X-Turnstile-Token.
 * Sin TURNSTILE_SECRET_KEY no se exige: así el frontend puede publicarse antes
 * que la clave secreta sin bloquear los formularios.
 */
export function requerirHumano(verificar: Verificar = verificarEnCloudflare): RequestHandler {
  return async (req, res, next) => {
    const secreto = process.env.TURNSTILE_SECRET_KEY;
    if (!secreto) return next();

    const token = req.get("X-Turnstile-Token");
    if (!token || token.length > 2048) {
      return next(
        new HttpError(403, "Completá la verificación de seguridad antes de enviar."),
      );
    }

    const cuerpo = new URLSearchParams({ secret: secreto, response: token });
    const ip = res.locals.ipCliente ?? req.ip;
    if (typeof ip === "string" && ip) cuerpo.set("remoteip", ip);

    let valido = false;
    try {
      valido = (await verificar(cuerpo)).success === true;
    } catch {
      console.error("No pudimos consultar la verificación de Turnstile.");
      return next(
        new HttpError(503, "No pudimos verificar el envío. Intentá nuevamente en unos segundos."),
      );
    }
    if (!valido) {
      return next(
        new HttpError(403, "La verificación de seguridad venció. Volvé a intentarlo."),
      );
    }
    next();
  };
}
