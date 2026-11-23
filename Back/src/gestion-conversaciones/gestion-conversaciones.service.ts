import { leerResumenConversacion } from "./resumen-narrativo.js";
import { hechosDeConsulta, huellaHechos } from "./resumen-operativo.js";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../errors/http-error.js";
import type { AmbitoConsultas } from "../solicitudes/solicitudes.entity.js";
import type { CanalGestion } from "./gestion-conversaciones.entity.js";
import {
  presentarGestion,
  etapaConsulta,
} from "./gestion-conversaciones.entity.js";
import * as repo from "./gestion-conversaciones.repository.js";
import { validarGestion } from "./gestion-conversaciones.validation.js";
import { bloquearConversacionCanal } from "../mensajes/mensajes.repository.js";
import { bloquearConversacionWhatsApp } from "../whatsapp/whatsapp.repository.js";

export async function hiloAutorizado(
  a: AmbitoConsultas,
  canal: CanalGestion,
  id: string,
) {
  if (!a.administra && !a.puedeProponer)
    throw new HttpError(403, "Tu acceso a mensajes está suspendido.");
  const hilo = await repo.buscarHilo(a, canal, id);
  if (!hilo) throw new HttpError(404, "No encontramos la conversación.");
  return hilo;
}
export async function contextoConversacion(
  a: AmbitoConsultas,
  canal: CanalGestion,
  id: string,
) {
  const hilo = await hiloAutorizado(a, canal, id);
  const [s, pagina, flujo] = await Promise.all([
    hilo.solicitudId ? repo.consultaDeHilo(hilo.solicitudId, a) : null,
    repo.mensajesHilo(canal, id),
    canal === "INSTAGRAM"
      ? prisma.flujoInstagram.findUnique({
          where: { conversacionId: id },
          select: { pausadoAt: true },
        })
      : null,
  ]);
  const [g, estudio, eventos] = await Promise.all([
    repo.asegurarGestion(canal, hilo, Boolean(flujo?.pausadoAt)),
    hilo.estudioId
      ? prisma.estudio.findUnique({
          where: { id: hilo.estudioId },
          select: { propietarioId: true },
        })
      : null,
    prisma.eventoConversacion.findMany({
      where: { gestion: { canal, conversacionId: id } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, accion: true, detalle: true, createdAt: true },
    }),
  ]);
  const responsables = await prisma.usuario.findMany({
    where: {
      id: {
        in: [
          estudio?.propietarioId,
          s?.artistaAsignadoId,
          a.tipo === "INDEPENDIENTE" ? a.usuarioId : null,
        ].filter((v): v is string => Boolean(v)),
      },
      suspendidoAt: null,
      OR: [
        { rol: "ESTUDIO_ADMIN" },
        { rol: "ARTISTA", estadoEnEstudio: "ACTIVO" },
      ],
    },
    select: { id: true, nombre: true, nombreArtistico: true },
  });

  const previo =
    g.resumen && typeof g.resumen === "object" && !Array.isArray(g.resumen)
      ? g.resumen
      : null;
  const cambioOperativo =
    previo?.huella !==
    huellaHechos(
      hechosDeConsulta(s, g, pagina.mensajes.at(-1)?.propio ?? false),
    );
  const pendiente =
    Boolean(g.resumenPendienteAt) ||
    Boolean(
      (pagina.mensajes.length || s) &&
      (cambioOperativo ||
        (pagina.mensajes.length > 0 &&
          !leerResumenConversacion(previo?.conversacion) &&
          !g.errorResumen) ||
        pagina.mensajes.at(-1)?.id !== g.ultimoMensajeResumenId),
    );
  if (pendiente && !g.resumenPendienteAt)
    await repo.programarResumen(canal, hilo);
  const proximos =
    s?.citas
      .filter(
        (c) =>
          ["PENDIENTE", "CONFIRMADA"].includes(c.estado) &&
          c.finAt > new Date(),
      )
      .sort((a, b) => a.inicioAt.getTime() - b.inicioAt.getTime()) ?? [];
  return {
    canal,
    conversacionId: id,
    cliente: {
      nombre: s?.contacto?.nombre || hilo.nombre,
      email: s?.contacto?.email || "",
      telefono: s?.contacto?.telefono || "",
    },
    zonaHoraria: a.zonaHoraria,
    gestion: presentarGestion(g, canal === "INSTAGRAM" && !flujo?.pausadoAt),
    responsables: responsables.map((u) => ({
      id: u.id,
      nombre: u.nombreArtistico || u.nombre || "Integrante",
    })),
    puedeAsignar: a.administra,
    puedeGestionar: a.administra || a.puedeProponer,
    puedeReactivarBot:
      a.administra && Boolean(a.estudioId) && canal === "INSTAGRAM",
    botActivo:
      canal === "INSTAGRAM" && Boolean(a.estudioId) ? !flujo?.pausadoAt : null,
    etapa: etapaConsulta(s, pagina.mensajes.at(-1)?.propio ?? false),
    resumen: g.resumen,
    resumenActualizadoAt: g.resumenActualizadoAt,
    resumenPendiente: pendiente,
    resumenDisponible: true,
    errorResumen: g.errorResumen,
    pagina,
    eventos,
    consulta: s
      ? {
          id: s.id,
          titulo: s.titulo,
          descripcion: s.descripcion,
          estilo: s.estilo,
          zona: s.subZona,
          referencias: s.referencias,
          imagenZonaMarcada: s.imagenZonaMarcada,
          estado: s.estado,
          version: s.version,
          artistaId: s.artistaAsignadoId,
          artista:
            s.artistaAsignado?.nombreArtistico ||
            s.artistaAsignado?.nombre ||
            null,
          propuestas: s.cotizaciones.map((c) => ({
            id: c.id,
            artistaId: c.artistaId,
            artista: c.artista.nombreArtistico || c.artista.nombre,
            importe: Number(c.monto),
            sena: Number(c.montoSena),
            moneda: s.moneda,
            detalle: c.mensaje,
            boceto: c.bocetoUrl,
            duracionMinutos: c.duracionMinutos,
            validaHasta: c.validaHasta,
            vencida: Boolean(c.validaHasta && c.validaHasta < new Date()),
            elegida: s.artistaAsignadoId === c.artistaId,
          })),
          turnos: proximos.map((c) => ({
            id: c.id,
            titulo: c.titulo,
            inicio: c.inicioAt,
            fin: c.finAt,
            estado: c.estado,
            version: c.version,
            importe: Number(c.importe),
          })),
        }
      : null,
  };
}
export async function cambiarGestion(
  a: AmbitoConsultas,
  canal: CanalGestion,
  id: string,
  entrada: unknown,
) {
  const hilo = await hiloAutorizado(a, canal, id),
    b = validarGestion(entrada);
  if (
    !a.administra &&
    b.responsableId !== undefined &&
    b.responsableId !== a.usuarioId
  )
    throw new HttpError(403, "Solo podés tomar la conversación para vos.");
  if (
    b.reactivarBot &&
    (!a.administra || !a.estudioId || canal !== "INSTAGRAM")
  )
    throw new HttpError(
      403,
      "Solo el titular puede reactivar el bot de Instagram.",
    );
  if (b.responsableId) {
    const [estudio, solicitud] = await Promise.all([
      hilo.estudioId
        ? prisma.estudio.findUnique({
            where: { id: hilo.estudioId },
            select: { propietarioId: true },
          })
        : null,
      hilo.solicitudId
        ? prisma.solicitud.findFirst({
            where: {
              id: hilo.solicitudId,
              estudioId: a.estudioId,
              ...(!a.estudioId ? { artistaDestinoId: a.usuarioId } : {}),
            },
            select: { artistaAsignadoId: true },
          })
        : null,
    ]);
    const ids = [
      estudio?.propietarioId,
      solicitud?.artistaAsignadoId,
      a.tipo === "INDEPENDIENTE" ? a.usuarioId : null,
    ];
    if (
      !ids.includes(b.responsableId) ||
      !(await prisma.usuario.findFirst({
        where: {
          id: b.responsableId,
          suspendidoAt: null,
          OR: [
            { rol: "ESTUDIO_ADMIN" },
            { rol: "ARTISTA", estadoEnEstudio: "ACTIVO" },
          ],
        },
        select: { id: true },
      }))
    )
      throw new HttpError(
        400,
        "Ese integrante no puede atender esta conversación.",
      );
  }
  await repo.asegurarGestion(canal, hilo);
  const actual = await prisma.$transaction(async (tx) => {
    if (canal === "WHATSAPP") await bloquearConversacionWhatsApp(tx, id);
    else await bloquearConversacionCanal(tx, id);
    if (!(await repo.buscarHilo(a, canal, id, tx)))
      throw new HttpError(
        404,
        "La conversación ya no está asignada a tu equipo.",
      );
    const g = await tx.gestionConversacion.findUniqueOrThrow({
      where: repo.claveGestion(canal, id),
    });
    if (g.version !== b.version)
      throw new HttpError(
        409,
        "La atención cambió. Actualizá antes de volver a guardar.",
      );
    if (b.reactivarBot && b.accion !== "RESOLVER")
      throw new HttpError(
        400,
        "Resolvé la atención antes de reactivar el bot.",
      );
    if (b.atencion === "RESUELTA" || b.atencion === "AUTOMATICA")
      throw new HttpError(
        400,
        "Usá la acción Resolver para cerrar la atención.",
      );
    const atencion =
      b.accion === "TOMAR"
        ? "MANUAL"
        : b.accion === "RESOLVER"
          ? "RESUELTA"
          : (b.atencion ?? g.atencion);
    const responsableId =
      b.accion === "TOMAR"
        ? a.usuarioId
        : b.responsableId === undefined
          ? g.responsableId
          : b.responsableId;
    const motivo = b.motivo ?? g.motivo;
    if (atencion === "PENDIENTE" && !motivo)
      throw new HttpError(400, "Indicá por qué necesita atención.");
    if (canal === "INSTAGRAM" && hilo.estudioId) {
      if (b.reactivarBot)
        await tx.flujoInstagram.updateMany({
          where: { conversacionId: id },
          data: { pausadoAt: null },
        });
      else if (["PENDIENTE", "MANUAL"].includes(atencion)) {
        const ahora = new Date();
        await tx.flujoInstagram.upsert({
          where: { conversacionId: id },
          create: {
            conversacionId: id,
            token: randomUUID(),
            enlaceHasta: ahora,
            pausadoAt: ahora,
          },
          update: { pausadoAt: ahora },
        });
        await tx.conversacionCanal.update({
          where: { id },
          data: { botResponderAt: null },
        });
        await tx.mensajeCanal.updateMany({
          where: { conversacionId: id, botPendiente: true },
          data: { botPendiente: false },
        });
      }
    }
    const result = await tx.gestionConversacion.update({
      where: { id: g.id },
      data: {
        atencion,
        prioridad: b.prioridad ?? g.prioridad,
        motivo,
        responsableId,
        resueltaAt:
          b.accion === "RESOLVER"
            ? new Date()
            : atencion === "PENDIENTE" || atencion === "MANUAL"
              ? null
              : g.resueltaAt,
        version: { increment: 1 },
        resumenPendienteAt: new Date(Date.now() + 10000),
      },
    });
    const acciones: Record<string, string> = {
      TOMAR: "Conversación tomada por el equipo",
      RESOLVER: b.reactivarBot
        ? "Caso resuelto y bot reactivado"
        : "Caso resuelto; continúa en atención manual",
      ACTUALIZAR: "Atención actualizada",
    };
    await tx.eventoConversacion.create({
      data: {
        gestionId: g.id,
        actorId: a.usuarioId,
        accion: b.accion,
        detalle: acciones[b.accion] + (b.motivo ? " · " + b.motivo : ""),
      },
    });
    return result;
  });
  return presentarGestion(actual);
}
export async function anexarGestion<
  T extends {
    id: string;
    canal: string;
    solicitudId: string | null;
    mensajes: { propio: boolean }[];
    botActivo?: boolean;
  },
>(hilos: T[]) {
  if (!hilos.length)
    return hilos.map((h) => ({
      ...h,
      gestion: presentarGestion(null),
      etapa: "NUEVA",
    }));
  const [gestiones, solicitudes] = await Promise.all([
    prisma.gestionConversacion.findMany({
      where: {
        OR: hilos.map((h) => ({ canal: h.canal, conversacionId: h.id })),
      },
      include: {
        responsable: { select: { nombre: true, nombreArtistico: true } },
      },
    }),
    prisma.solicitud.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              hilos
                .map((h) => h.solicitudId)
                .filter((v): v is string => Boolean(v)),
            ),
          ],
        },
      },
      select: {
        id: true,
        estado: true,
        citas: {
          select: { estado: true, finAt: true },
          where: { estado: { not: "CANCELADA" } },
          orderBy: { inicioAt: "desc" },
          take: 10,
        },
      },
    }),
  ]);
  return hilos.map((h) => {
    const g = gestiones.find(
      (g) => g.canal === h.canal && g.conversacionId === h.id,
    );
    return {
      ...h,
      gestion: {
        ...presentarGestion(g ?? null, h.botActivo),
        responsable:
          g?.responsable?.nombreArtistico || g?.responsable?.nombre || null,
      },
      resumenRevision: g?.resumenActualizadoAt?.toISOString() ?? null,
      etapa: etapaConsulta(
        solicitudes.find((s) => s.id === h.solicitudId) ?? null,
        h.mensajes.at(-1)?.propio ?? false,
      ),
      dudaPendiente: Boolean(
        g?.resumen &&
        typeof g.resumen === "object" &&
        !Array.isArray(g.resumen) &&
        leerResumenConversacion(g.resumen.conversacion)?.preguntasPendientes
          .length,
      ),
    };
  });
}
