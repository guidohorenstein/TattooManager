import { etapaConsulta } from "./gestion-conversaciones.entity.js";
import { createHash } from "node:crypto";
import { estilosCatalogo } from "../estilos/estilos.entity.js";

export const etapas = [
  "NUEVA",
  "CONSULTA",
  "PROPUESTAS",
  "ESPERANDO_CLIENTE",
  "POR_ASIGNAR",
  "COORDINAR_TURNO",
  "TURNO_PENDIENTE",
  "TURNO_CONFIRMADO",
  "COMPLETADA",
  "ARCHIVADA",
] as const;
export interface HechosOperativos {
  etapa: (typeof etapas)[number];
  atencion: "AUTOMATICA" | "PENDIENTE" | "MANUAL" | "RESUELTA";
  prioridad: "NORMAL" | "URGENTE";
  estilo: (typeof estilosCatalogo)[number] | null;
  tieneConsulta: boolean;
  tieneArtista: boolean;
  tienePropuestas: boolean;
  propuestaElegida: boolean;
  tieneTurnoProximo: boolean;
}
const claves = [
  "etapa",
  "atencion",
  "prioridad",
  "estilo",
  "tieneConsulta",
  "tieneArtista",
  "tienePropuestas",
  "propuestaElegida",
  "tieneTurnoProximo",
];
// La frontera con el proveedor admite solo estos valores cerrados.
export function validarHechos(valor: unknown): HechosOperativos {
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    throw new Error("Hechos inválidos");
  const b = valor as Record<string, unknown>;
  if (
    Object.keys(b).length !== claves.length ||
    Object.keys(b).some((k) => !claves.includes(k)) ||
    !etapas.includes(b.etapa as HechosOperativos["etapa"]) ||
    typeof b.atencion !== "string" ||
    !["AUTOMATICA", "PENDIENTE", "MANUAL", "RESUELTA"].includes(b.atencion) ||
    typeof b.prioridad !== "string" ||
    !["NORMAL", "URGENTE"].includes(b.prioridad) ||
    !(
      b.estilo === null ||
      estilosCatalogo.includes(b.estilo as (typeof estilosCatalogo)[number])
    ) ||
    claves.slice(4).some((k) => typeof b[k] !== "boolean")
  )
    throw new Error("Hechos inválidos");
  return Object.fromEntries(
    claves.map((k) => [k, b[k]]),
  ) as unknown as HechosOperativos;
}
export function huellaHechos(h: HechosOperativos) {
  return createHash("sha256")
    .update(JSON.stringify(validarHechos(h)))
    .digest("hex");
}
const pasos: Record<HechosOperativos["etapa"], string> = {
  NUEVA: "Enviar el formulario si el cliente quiere un presupuesto.",
  CONSULTA: "Revisar la consulta y preparar las propuestas.",
  PROPUESTAS: "Revisar las propuestas antes de compartirlas.",
  ESPERANDO_CLIENTE: "Esperar la elección del cliente.",
  POR_ASIGNAR: "Asignar un artista disponible.",
  COORDINAR_TURNO: "Ofrecer los días disponibles del artista.",
  TURNO_PENDIENTE: "Confirmar el turno pendiente.",
  TURNO_CONFIRMADO: "Revisar los detalles del turno antes de la sesión.",
  COMPLETADA: "Revisar el seguimiento posterior a la sesión.",
  ARCHIVADA: "La consulta está cerrada.",
};
export function resumenDesdeHechos(entrada: HechosOperativos) {
  const h = validarHechos(entrada);
  return {
    resumen: h.tieneConsulta
      ? [
          h.estilo ? "Consulta de " + h.estilo + "." : "Consulta recibida.",
          h.tieneArtista ? "Con artista asignado." : "Sin artista asignado.",
          h.tieneTurnoProximo ? "Hay un turno próximo." : "Sin turno próximo.",
        ].join(" ")
      : "Conversación sin consulta vinculada.",
    proximoPaso:
      h.atencion === "PENDIENTE"
        ? "El equipo debe revisar y resolver la atención pendiente."
        : pasos[h.etapa],
    origen: "DATOS" as "DATOS" | "IA",
    huella: huellaHechos(h),
  };
}
export async function generarResumenOperativo(
  entrada: unknown,
  transporte: typeof fetch = fetch,
) {
  const h = validarHechos(entrada),
    base = resumenDesdeHechos(h),
    clave = process.env.GROQ_API_KEY?.trim();
  if (!clave) return base;
  const respuesta = await transporte(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: "Bearer " + clave,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ASISTENTE_GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Redactá un resumen operativo breve y un próximo paso para un equipo de tatuajes usando exclusivamente estos hechos cerrados. No inventes detalles, preferencias, preguntas, nombres ni horarios. No tomás acciones. Si hay atención pendiente, debe resolverla una persona. Devolvé JSON con resumen y proximoPaso, cada uno de hasta 350 caracteres. tieneTurnoProximo indica únicamente reservas futuras; no implica que nunca haya tenido una sesión. No recomiendes trámites ni supongas preguntas del cliente.",
          },
          { role: "user", content: JSON.stringify(h) },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 500,
      }),
    },
  );
  if (!respuesta.ok) throw new Error("Resumen no disponible");
  const datos = (await respuesta.json()) as {
    choices?: { finish_reason?: string; message?: { content?: string } }[];
  };
  const opcion = datos.choices?.[0];
  if (opcion?.finish_reason !== "stop" || !opcion.message?.content)
    throw new Error("Resumen incompleto");
  const b = JSON.parse(opcion.message.content) as Record<string, unknown>;
  if (
    Object.keys(b).length !== 2 ||
    !["resumen", "proximoPaso"].every(
      (k) =>
        typeof b[k] === "string" &&
        b[k].length > 0 &&
        b[k].length <= 350 &&
        !/https?:|www\.|@|\d{4}/i.test(b[k] as string),
    )
  )
    throw new Error("Resumen inválido");
  return {
    ...base,
    resumen: b.resumen as string,
    proximoPaso: base.proximoPaso,
    origen: "IA" as const,
  };
}

export function hechosDeConsulta(
  s: {
    estado: string;
    estilo: string;
    artistaAsignadoId: string | null;
    cotizaciones: { artistaId?: string }[];
    citas: { estado: string; finAt: Date }[];
  } | null,
  g: { atencion: string; prioridad: string },
  ultimoPropio: boolean,
  ahora = new Date(),
): HechosOperativos {
  return validarHechos({
    etapa: etapaConsulta(s, ultimoPropio),
    atencion: g.atencion,
    prioridad: g.prioridad,
    estilo:
      s &&
      estilosCatalogo.includes(s.estilo as (typeof estilosCatalogo)[number])
        ? s.estilo
        : null,
    tieneConsulta: Boolean(s),
    tieneArtista: Boolean(s?.artistaAsignadoId),
    tienePropuestas: Boolean(s?.cotizaciones.length),
    propuestaElegida: Boolean(
      s?.artistaAsignadoId &&
      s.cotizaciones.some((c) => c.artistaId === s.artistaAsignadoId),
    ),
    tieneTurnoProximo: Boolean(
      s?.citas.some(
        (c) =>
          c.finAt > ahora && ["PENDIENTE", "CONFIRMADA"].includes(c.estado),
      ),
    ),
  });
}
