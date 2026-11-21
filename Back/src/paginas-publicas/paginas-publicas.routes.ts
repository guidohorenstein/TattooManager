import { requerirSesion } from "../middlewares/autenticacion.js";
import { requerirRoles } from "../middlewares/roles.js";
import { requerirPlanVigente } from "../middlewares/plan-vigente.js";
import { Router } from "express";
import {
  mostrarArtista,
  configuracion,
  guardarConfiguracion,
  mostrarEstudio,
} from "./paginas-publicas.controller.js";
export const paginasPublicasRouter = Router();
paginasPublicasRouter.get("/estudios/:slug", mostrarEstudio);
paginasPublicasRouter.get("/artistas/:id", mostrarArtista);

paginasPublicasRouter.use(requerirSesion, requerirRoles("ARTISTA", "ESTUDIO_ADMIN"), requerirPlanVigente);
paginasPublicasRouter.get("/configuracion", configuracion);
paginasPublicasRouter.patch("/configuracion", guardarConfiguracion);
