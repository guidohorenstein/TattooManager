import "dotenv/config";

const secret = process.env.JWT_SECRET;

if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
  throw new Error(
    "Configurá JWT_SECRET con una clave aleatoria de al menos 32 bytes.",
  );
}

export const jwtSecret = secret;
// La sesión vence tras 7 días sin uso y se renueva, como mucho una vez por día,
// mientras la persona sigue activa. Nunca supera los 30 días desde el inicio.
export const duracionSesionSegundos = 7 * 24 * 60 * 60;
export const duracionMaximaSesionSegundos = 30 * 24 * 60 * 60;
export const intervaloRenovacionSesionSegundos = 24 * 60 * 60;

export const origenesPermitidos = process.env.FRONTEND_URL
  ? [new URL(process.env.FRONTEND_URL).origin]
  : ["http://localhost:3002", "http://127.0.0.1:3002"];
