import { Router } from "express";
import {
  mostrarArtista,
  mostrarEstudio,
} from "./paginas-publicas.controller.js";
export const paginasPublicasRouter = Router();
paginasPublicasRouter.get("/estudios/:slug", mostrarEstudio);
paginasPublicasRouter.get("/artistas/:id", mostrarArtista);
