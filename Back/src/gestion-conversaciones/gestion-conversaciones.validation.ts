import { HttpError } from "../errors/http-error.js";
import {
  objetoEntrada,
  validarVersion,
} from "../solicitudes/solicitudes.validation.js";
import {
  canales,
  type CanalGestion,
  atenciones,
} from "./gestion-conversaciones.entity.js";
export function validarCanal(valor: unknown): CanalGestion {
  const c = typeof valor === "string" ? valor.toUpperCase() : "";
  if (!canales.includes(c as CanalGestion))
    throw new HttpError(404, "No encontramos el canal.");
  return c as CanalGestion;
}
export function validarGestion(entrada: unknown) {
  const b = objetoEntrada(entrada),
    version = validarVersion(b);
  if (
    Object.keys(b).some(
      (k) =>
        ![
          "version",
          "accion",
          "atencion",
          "prioridad",
          "motivo",
          "responsableId",
          "reactivarBot",
        ].includes(k),
    )
  )
    throw new HttpError(400, "La solicitud contiene campos no permitidos.");
  if (
    typeof b.accion !== "string" ||
    !["ACTUALIZAR", "TOMAR", "RESOLVER"].includes(b.accion)
  )
    throw new HttpError(400, "Elegí una acción válida.");
  if (
    b.atencion !== undefined &&
    !atenciones.includes(b.atencion as (typeof atenciones)[number])
  )
    throw new HttpError(400, "Revisá el estado de atención.");
  if (
    b.prioridad !== undefined &&
    (typeof b.prioridad !== "string" ||
      !["NORMAL", "URGENTE"].includes(b.prioridad))
  )
    throw new HttpError(400, "Revisá la prioridad.");
  if (
    b.motivo !== undefined &&
    (typeof b.motivo !== "string" || b.motivo.length > 1200)
  )
    throw new HttpError(400, "Usá un motivo de hasta 1200 caracteres.");
  if (
    b.responsableId !== undefined &&
    b.responsableId !== null &&
    (typeof b.responsableId !== "string" ||
      !b.responsableId.trim() ||
      b.responsableId.length > 80)
  )
    throw new HttpError(400, "Revisá el responsable.");
  if (b.reactivarBot !== undefined && typeof b.reactivarBot !== "boolean")
    throw new HttpError(400, "Revisá la reactivación del bot.");
  return {
    version,
    accion: b.accion,
    atencion: b.atencion as string | undefined,
    prioridad: b.prioridad as string | undefined,
    motivo: typeof b.motivo === "string" ? b.motivo.trim() : undefined,
    responsableId: b.responsableId as string | null | undefined,
    reactivarBot: b.reactivarBot === true,
  };
}
