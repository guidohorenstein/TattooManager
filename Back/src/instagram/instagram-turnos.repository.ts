import { randomUUID } from "node:crypto";
import { registrarAviso } from "../operacion/avisos.repository.js";
import { pedirAtencion } from "../gestion-conversaciones/gestion-conversaciones.repository.js";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../errors/http-error.js";
import {
  bloquearConversacionCanal,
  ventanaRespuesta,
} from "../mensajes/mensajes.repository.js";
import { mensajeTurno } from "./instagram-agenda.js";
import type { EnviarBot } from "./instagram-bot.service.js";
import { activaInstagram } from "./instagram.conexion.js";

export async function notificarTurnosInstagram(enviar: EnviarBot) {
  const ahora = new Date();
  const recientes = new Date(ahora.getTime() - ventanaRespuesta);
  const citas = await prisma.cita.findMany({
    where: {
      avisoInstagramConversacionId: { not: null },
      OR: [{ inicioAt: { gt: ahora } }, { estado: "CANCELADA" }],
      estado: { in: ["PENDIENTE", "CONFIRMADA", "CANCELADA"] },
      updatedAt: { gt: recientes },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      version: true,
      inicioAt: true,
      estado: true,
      artistaId: true,
      avisoInstagramConversacionId: true,
      solicitud: {
        select: { id: true, estudioId: true, artistaDestinoId: true },
      },
    },
  });
  for (const cita of citas) {
    const hiloId = cita.avisoInstagramConversacionId!;
    const s = cita.solicitud;
    const hilo = await prisma.conversacionCanal.findFirst({
      where: {
        id: hiloId,
        canal: "INSTAGRAM",
        solicitudId: s.id,
        estudioId: s.estudioId,
        artistaId: s.estudioId ? null : (s.artistaDestinoId ?? cita.artistaId),
      },
      include: {
        estudio: { select: { zonaHoraria: true } },
        artista: { select: { zonaHoraria: true } },
        flujoInstagram: { select: { pausadoAt: true } },
      },
    });
    try {
      let entregado = false;
      if (
        hilo &&
        !hilo.flujoInstagram?.pausadoAt &&
        hilo.ultimaEntradaAt > recientes
      ) {
        const conexion = await prisma.conexionCanal.findUnique({
          where: {
            canal_cuentaId: { canal: "INSTAGRAM", cuentaId: hilo.cuentaId },
          },
        });
        if (
          activaInstagram(conexion) &&
          conexion?.estudioId === hilo.estudioId &&
          conexion.artistaId === hilo.artistaId
        ) {
          const zona =
            hilo.estudio?.zonaHoraria ??
            hilo.artista?.zonaHoraria ??
            "America/Argentina/Buenos_Aires";
          const texto =
            cita.estado === "CANCELADA"
              ? "Se canceló tu turno del " +
                new Intl.DateTimeFormat("es-AR", {
                  dateStyle: "long",
                  timeStyle: "short",
                  timeZone: zona,
                }).format(cita.inicioAt) +
                ". Podés hablar con el equipo para coordinar otra fecha."
              : cita.version > 0
                ? "Se actualizó tu turno. " + mensajeTurno(cita, zona)
                : mensajeTurno(cita, zona, true);
          const estado = await enviar(
            hilo,
            "bot:turno-manual:" + cita.id + ":" + cita.version,
            texto,
          );
          entregado = ["ENVIADO", "ENTREGADO", "LEIDO"].includes(estado);
          if (estado === "ENVIANDO") continue;
        }
      }
      if (!entregado && hilo) {
        await prisma.$transaction(async (tx) => {
          await bloquearConversacionCanal(tx, hilo.id);
          const titular = s.estudioId
            ? await tx.estudio.findUnique({
                where: { id: s.estudioId },
                select: { propietarioId: true },
              })
            : null;
          const pausa = new Date();
          await tx.flujoInstagram.upsert({
            where: { conversacionId: hilo.id },
            create: {
              conversacionId: hilo.id,
              token: randomUUID(),
              enlaceHasta: pausa,
              pausadoAt: pausa,
            },
            update: { pausadoAt: pausa },
          });
          await tx.conversacionCanal.update({
            where: { id: hilo.id },
            data: { botResponderAt: null },
          });
          await tx.mensajeCanal.updateMany({
            where: { conversacionId: hilo.id, botPendiente: true },
            data: { botPendiente: false },
          });
          await pedirAtencion(
            tx,
            "INSTAGRAM",
            hilo,
            "El turno cambió y no pudimos avisar al cliente por este canal.",
            true,
          );
          await registrarAviso(tx, {
            usuarioId: titular?.propietarioId ?? cita.artistaId,
            clave: "turno-sin-aviso:" + cita.id + ":" + cita.version,
            titulo: "Avisar al cliente el cambio de turno",
            detalle:
              "El aviso automático no se entregó. Revisá la conversación y coordiná el cambio.",
            destino:
              (s.estudioId ? "/estudio" : "/artista") +
              "/mensajes?conversacion=" +
              hilo.id,
            urgente: true,
          });
        });
      }
      await prisma.cita.updateMany({
        where: {
          id: cita.id,
          version: cita.version,
          avisoInstagramConversacionId: hiloId,
        },
        data: { avisoInstagramConversacionId: null },
      });
    } catch (error) {
      if (!(error instanceof HttpError))
        console.error("No pudimos avisar un turno por Instagram.");
    }
  }
}
