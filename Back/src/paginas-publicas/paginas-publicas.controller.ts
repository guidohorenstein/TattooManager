import type { Request, Response } from "express";
import {
  configuracionPagina,
  cambiarConfiguracionPagina,
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

export async function configuracion(req: Request, res: Response) {
  res.set("Cache-Control", "no-store").json(await configuracionPagina(req.usuario!.id));
}
export async function guardarConfiguracion(req: Request, res: Response) {
  res.set("Cache-Control", "no-store").json(await cambiarConfiguracionPagina(req.usuario!.id, req.body));
}
