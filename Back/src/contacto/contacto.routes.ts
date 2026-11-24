import { Router } from "express";
import { rateLimit } from "../middlewares/limitar-solicitudes.js";
import { recibirMensaje } from "./contacto.controller.js";
import { requerirHumano } from "../middlewares/turnstile.js";
export const contactoRouter = Router();
contactoRouter.post(
  "/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: "Recibimos varios mensajes. Volvé a intentar más tarde.",
    },
  }),
  requerirHumano(),
  recibirMensaje,
);
