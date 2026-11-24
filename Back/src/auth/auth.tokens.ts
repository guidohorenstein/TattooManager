import jwt from "jsonwebtoken";
import { jwtSecret, duracionSesionSegundos } from "../config/auth.js";
import { HttpError } from "../errors/http-error.js";

// El token vence junto con la sesión; sin fecha, usa la duración estándar.
export function crearToken(
  usuarioId: string,
  sesionId: string,
  expiraAt?: Date,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = expiraAt
    ? Math.max(iat + 1, Math.floor(expiraAt.getTime() / 1000))
    : iat + duracionSesionSegundos;
  return jwt.sign({ iat, exp }, jwtSecret, {
    subject: usuarioId,
    jwtid: sesionId,
    algorithm: "HS256",
    issuer: "tattoomanager-api",
    audience: "tattoomanager-web",
  });
}

// Esta funcion verifica el token y devuelve el usuarioId si es válido, o lanza un error si no lo es.
export function verificarToken(token: string): {
  usuarioId: string;
  sesionId: string;
} {
  try {
    const contenido = jwt.verify(token, jwtSecret, {
      algorithms: ["HS256"],
      issuer: "tattoomanager-api",
      audience: "tattoomanager-web",
    });

    if (
      typeof contenido === "string" ||
      typeof contenido.sub !== "string" ||
      contenido.sub.length === 0 ||
      typeof contenido.jti !== "string" ||
      contenido.jti.length === 0
    ) {
      throw new Error("El token no contiene los identificadores.");
    }

    return {
      usuarioId: contenido.sub,
      sesionId: contenido.jti,
    };
  } catch {
    throw new HttpError(401, "Token inválido o vencido.");
  }
}
