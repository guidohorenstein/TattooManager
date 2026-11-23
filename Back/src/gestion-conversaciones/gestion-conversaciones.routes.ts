import { Router } from "express";
import { requerirSesion } from "../middlewares/autenticacion.js";
import { requerirRoles } from "../middlewares/roles.js";
import { requerirPlanVigente } from "../middlewares/plan-vigente.js";
import { contexto, actualizar } from "./gestion-conversaciones.controller.js";
export const gestionConversacionesRouter = Router();
const acceso = [
  requerirSesion,
  requerirRoles("ARTISTA", "ESTUDIO_ADMIN"),
  requerirPlanVigente,
];
gestionConversacionesRouter.get("/:canal/:id/contexto", ...acceso, contexto);
gestionConversacionesRouter.patch("/:canal/:id/gestion", ...acceso, actualizar);
