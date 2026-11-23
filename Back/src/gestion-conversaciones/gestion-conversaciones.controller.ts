import type { Request, Response } from "express";
import { resolverAmbito } from "../solicitudes/solicitudes.service.js";
import { validarIdConsulta } from "../solicitudes/solicitudes.validation.js";
import { validarCanal } from "./gestion-conversaciones.validation.js";
import {
  contextoConversacion,
  cambiarGestion,
} from "./gestion-conversaciones.service.js";
export async function contexto(req: Request, res: Response) {
  res
    .set("Cache-Control", "no-store")
    .json(
      await contextoConversacion(
        await resolverAmbito(req.usuario!.id),
        validarCanal(req.params.canal),
        validarIdConsulta(req.params.id),
      ),
    );
}
export async function actualizar(req: Request, res: Response) {
  res.json(
    await cambiarGestion(
      await resolverAmbito(req.usuario!.id),
      validarCanal(req.params.canal),
      validarIdConsulta(req.params.id),
      req.body,
    ),
  );
}
