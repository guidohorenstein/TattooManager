import type { GestionConversacion } from "@prisma/client";
export const canales = ["INSTAGRAM", "WHATSAPP", "FACEBOOK", "TIKTOK"] as const;
export type CanalGestion = (typeof canales)[number];
export const atenciones = [
  "AUTOMATICA",
  "PENDIENTE",
  "MANUAL",
  "RESUELTA",
] as const;
export type Atencion = (typeof atenciones)[number];
export interface ResumenChat {
  resumen: string;
  preferencias: string[];
  preguntasPendientes: string[];
  proximoPaso: string;
  evidencias: string[];
}
export function presentarGestion(
  g: GestionConversacion | null,
  botActivo?: boolean,
) {
  return {
    atencion: g?.atencion ?? (botActivo === false ? "MANUAL" : "AUTOMATICA"),
    prioridad: g?.prioridad ?? "NORMAL",
    motivo: g?.motivo ?? "",
    responsableId: g?.responsableId ?? null,
    version: g?.version ?? 0,
    resueltaAt: g?.resueltaAt?.toISOString() ?? null,
  };
}
export function etapaConsulta(
  s: { estado: string; citas?: { estado: string; finAt: Date }[] } | null,
  ultimoPropio: boolean,
): import("./resumen-operativo.js").HechosOperativos["etapa"] {
  if (s?.estado === "ARCHIVADA" || s?.estado === "CANCELADO")
    return "ARCHIVADA";
  const proximas =
    s?.citas?.filter(
      (c) =>
        c.finAt > new Date() && ["CONFIRMADA", "PENDIENTE"].includes(c.estado),
    ) ?? [];
  if (proximas.some((c) => c.estado === "CONFIRMADA"))
    return "TURNO_CONFIRMADO";
  if (proximas.length) return "TURNO_PENDIENTE";
  if (s?.estado === "ELECCION_CLIENTE") return "ESPERANDO_CLIENTE";
  if (s?.estado === "POR_ASIGNAR") return "POR_ASIGNAR";
  if (s?.estado === "ASIGNADA" || s?.estado === "ACEPTADO")
    return s.citas?.some((c) => c.estado === "COMPLETADA")
      ? "COMPLETADA"
      : "COORDINAR_TURNO";
  if (s?.estado === "EN_COTIZACION") return "PROPUESTAS";
  if (s) return "CONSULTA";
  return ultimoPropio ? "ESPERANDO_CLIENTE" : "NUEVA";
}
