import { DateTime } from "luxon";
import { validarConfiguracion } from "./configuracion.js";
import { minimizarTexto, textoPublicoParaIa } from "./privacidad.js";
export type TurnoAsistente = {
  fecha: string;
  dia: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  duracionMinutos: number;
  artista: string;
  estado: "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA";
};
export type TurnosAsistente = {
  proximos: TurnoAsistente[];
  ultimoPasado: TurnoAsistente | null;
  duracionEstimadaMinutos: number | null;
};
export interface ContextoAsistente {
  zonaHoraria: string;
  artistasActivos: { nombre: string; estilos: string[] }[];
  turnos?: TurnosAsistente;
  identificadoresPrivados?: readonly string[];
}
function presentarTurno(t: TurnoAsistente | null): TurnoAsistente | null {
  if (
    !t ||
    !/^\d{4}-\d{2}-\d{2}$/.test(t.fecha) ||
    !DateTime.fromISO(t.fecha).isValid ||
    !/^\d{4}-\d{2}-\d{2}$/.test(t.fechaFin) ||
    !DateTime.fromISO(t.fechaFin).isValid ||
    ![t.horaInicio, t.horaFin].every((h) =>
      /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(h),
    ) ||
    !Number.isInteger(t.duracionMinutos) ||
    t.duracionMinutos <= 0 ||
    t.duracionMinutos > 480 ||
    !["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"].includes(t.estado)
  )
    return null;
  return {
    fecha: t.fecha,
    dia: DateTime.fromISO(t.fecha).setLocale("es-AR").toFormat("cccc"),
    horaInicio: t.horaInicio,
    fechaFin: t.fechaFin,
    horaFin: t.horaFin,
    duracionMinutos: t.duracionMinutos,
    artista: textoPublicoParaIa(t.artista).slice(0, 100) || "Artista",
    estado: t.estado,
  };
}
export function prepararEntradaIa(
  configuracion: ReturnType<typeof validarConfiguracion>,
  mensaje: string,
  contexto?: ContextoAsistente,
) {
  const c = validarConfiguracion(configuracion),
    privados = contexto?.identificadoresPrivados ?? [];
  const publico = (s: string) => textoPublicoParaIa(s, privados);
  const configuracionPublica = {
    version: c.version,
    tono: publico(c.tono) || "Cercano y profesional.",
    servicios: c.servicios.map(publico).filter(Boolean),
    politicas: {
      senas: publico(c.politicas.senas),
      cancelaciones: publico(c.politicas.cancelaciones),
    },
    preguntasFrecuentes: c.preguntasFrecuentes
      .map((p) => ({
        pregunta: publico(p.pregunta),
        respuesta: publico(p.respuesta),
      }))
      .filter((p) => p.pregunta && p.respuesta),
    derivacion:
      publico(c.derivacion) ||
      "Derivar cuando corresponda una revisión del equipo.",
  };
  const turnos = contexto?.turnos;
  return {
    configuracion: configuracionPublica,
    mensaje: minimizarTexto(mensaje, privados).slice(-3000),
    ...(contexto && {
      hoyLocal: DateTime.now().setZone(contexto.zonaHoraria).toISODate(),
      artistasActivos: contexto.artistasActivos.slice(0, 50).map((a) => ({
        nombre: textoPublicoParaIa(a.nombre).slice(0, 100) || "Artista",
        estilos: a.estilos
          .slice(0, 12)
          .map((s) => textoPublicoParaIa(s))
          .filter(Boolean),
      })),
      ...(turnos && {
        turnosDeEsteChat: {
          proximos: turnos.proximos
            .slice(0, 3)
            .map(presentarTurno)
            .filter((t): t is TurnoAsistente => Boolean(t)),
          ultimoPasado: presentarTurno(turnos.ultimoPasado),
          duracionEstimadaMinutos:
            Number.isInteger(turnos.duracionEstimadaMinutos) &&
            turnos.duracionEstimadaMinutos! > 0 &&
            turnos.duracionEstimadaMinutos! <= 480
              ? turnos.duracionEstimadaMinutos
              : null,
        },
      }),
    }),
  };
}
