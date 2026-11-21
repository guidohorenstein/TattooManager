import { rateLimit } from "./limitar-solicitudes.js";
export const limitarRegistro = rateLimit({
  windowMs: 60 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Recibimos varios intentos de registro. Esperá un momento antes de volver a intentar." },
});
