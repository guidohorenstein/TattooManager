import {
  crearSesion,
  buscarSesionPorId,
  extenderSesion,
} from "./sesiones.repository.js";

import {
  duracionSesionSegundos,
  duracionMaximaSesionSegundos,
  intervaloRenovacionSesionSegundos,
} from "../config/auth.js";
import { HttpError } from "../errors/http-error.js";
import type { Sesion } from "./sesiones.entity.js";

export async function abrirSesion(usuarioId: string) {
  const expiraAt = new Date(Date.now() + duracionSesionSegundos * 1000);

  return crearSesion(usuarioId, expiraAt);
}

export async function validarSesion(sesionId: string, usuarioId: string) {
  const sesion = await buscarSesionPorId(sesionId);

  if (
    !sesion ||
    sesion.usuarioId !== usuarioId ||
    sesion.revocadaAt !== null ||
    sesion.expiraAt.getTime() <= Date.now()
  ) {
    throw new HttpError(401, "Sesión inválida o vencida.");
  }

  return sesion;
}

/**
 * Corre el vencimiento de una sesión activa. Devuelve el nuevo vencimiento, o null
 * si todavía no pasó un día desde la última renovación o ya se alcanzó el máximo.
 */
export async function renovarSesion(
  sesion: Pick<Sesion, "id" | "usuarioId" | "expiraAt" | "createdAt">,
  ahora = Date.now(),
): Promise<Date | null> {
  if (!(sesion.createdAt instanceof Date)) return null;
  const renovadaHace =
    duracionSesionSegundos * 1000 - (sesion.expiraAt.getTime() - ahora);
  if (renovadaHace < intervaloRenovacionSesionSegundos * 1000) return null;

  const limite = sesion.createdAt.getTime() + duracionMaximaSesionSegundos * 1000;
  const nueva = Math.min(ahora + duracionSesionSegundos * 1000, limite);
  if (nueva <= sesion.expiraAt.getTime()) return null;

  const expiraAt = new Date(nueva);
  const { count } = await extenderSesion(sesion.id, sesion.usuarioId, expiraAt);
  if (count === 0) return null;
  return expiraAt;
}
