import type { Request, Response } from "express";
import {
  obtenerPaginaArtista,
  obtenerPaginaEstudio,
} from "./paginas-publicas.service.js";
export async function mostrarEstudio(req: Request, res: Response) {
  const datos = await obtenerPaginaEstudio(String(req.params.slug));
  res.set("Cache-Control", "no-store").json(datos);
}
export async function mostrarArtista(req: Request, res: Response) {
  const datos = await obtenerPaginaArtista(String(req.params.id));
  res.set("Cache-Control", "no-store").json(datos);
}
