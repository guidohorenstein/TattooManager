import { prisma } from "../config/prisma.js";
import type { Prisma } from "@prisma/client";
import { filtroCanal } from "../mensajes/mensajes.repository.js";
import { filtroConversaciones } from "../whatsapp/whatsapp.repository.js";
import {
  camposMensaje,
  ordenMensajes,
  presentarMensajes,
} from "../mensajes/historial-mensajes.js";
import type { AmbitoConsultas } from "../solicitudes/solicitudes.entity.js";
import type { CanalGestion } from "./gestion-conversaciones.entity.js";
export function buscarHilo(
  a: AmbitoConsultas,
  canal: CanalGestion,
  id: string,
  db: Prisma.TransactionClient = prisma,
) {
  return canal === "WHATSAPP"
    ? db.conversacionWhatsApp.findFirst({
        where: { id, ...filtroConversaciones(a) },
      })
    : db.conversacionCanal.findFirst({
        where: { id, canal, ...filtroCanal(a) },
      });
}
export async function mensajesHilo(
  canal: CanalGestion,
  id: string,
  cantidad = 60,
) {
  const filas =
    canal === "WHATSAPP"
      ? await prisma.mensajeWhatsApp.findMany({
          where: { conversacionId: id },
          select: camposMensaje,
          orderBy: ordenMensajes,
          take: cantidad + 1,
        })
      : await prisma.mensajeCanal.findMany({
          where: { conversacionId: id, ecoInstagram: false },
          select: camposMensaje,
          orderBy: ordenMensajes,
          take: cantidad + 1,
        });
  return presentarMensajes(filas, cantidad);
}
export const claveGestion = (canal: string, conversacionId: string) => ({
  canal_conversacionId: { canal, conversacionId },
});
export async function asegurarGestion(
  canal: CanalGestion,
  hilo: { id: string; estudioId: string | null; artistaId: string | null },
  manual = false,
) {
  return prisma.gestionConversacion.upsert({
    where: claveGestion(canal, hilo.id),
    create: {
      canal,
      conversacionId: hilo.id,
      estudioId: hilo.estudioId,
      artistaId: hilo.estudioId ? null : hilo.artistaId,
      atencion: manual ? "MANUAL" : "AUTOMATICA",
    },
    update: {},
  });
}
export function consultaDeHilo(id: string, a: AmbitoConsultas) {
  return prisma.solicitud.findFirst({
    where: {
      id,
      estudioId: a.estudioId,
      ...(!a.estudioId ? { artistaDestinoId: a.usuarioId } : {}),
    },
    include: {
      contacto: true,
      artistaAsignado: {
        select: {
          id: true,
          nombre: true,
          nombreArtistico: true,
          estadoEnEstudio: true,
          suspendidoAt: true,
        },
      },
      cotizaciones: {
        where: a.administra ? {} : { artistaId: a.usuarioId },
        include: {
          artista: {
            select: { id: true, nombre: true, nombreArtistico: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      citas: {
        where: a.administra ? {} : { artistaId: a.usuarioId },
        orderBy: { inicioAt: "desc" },
        take: 20,
      },
    },
  });
}
export async function programarResumen(
  canal: CanalGestion,
  hilo: { id: string; estudioId: string | null; artistaId: string | null },
  tx: Prisma.TransactionClient = prisma,
) {
  if (!hilo.estudioId && !hilo.artistaId) return;
  const resumenPendienteAt = new Date(Date.now() + 10000);
  await tx.gestionConversacion.upsert({
    where: claveGestion(canal, hilo.id),
    create: {
      canal,
      conversacionId: hilo.id,
      estudioId: hilo.estudioId,
      artistaId: hilo.estudioId ? null : hilo.artistaId,
      resumenPendienteAt,
    },
    update: { resumenPendienteAt },
  });
}
export async function pedirAtencion(
  tx: Prisma.TransactionClient,
  canal: CanalGestion,
  hilo: { id: string; estudioId: string | null; artistaId: string | null },
  motivo: string,
  urgente = false,
) {
  const actual = await tx.gestionConversacion.upsert({
    where: claveGestion(canal, hilo.id),
    create: {
      canal,
      conversacionId: hilo.id,
      estudioId: hilo.estudioId,
      artistaId: hilo.estudioId ? null : hilo.artistaId,
      atencion: "PENDIENTE",
      prioridad: urgente ? "URGENTE" : "NORMAL",
      motivo,
    },
    update: {
      atencion: "PENDIENTE",
      motivo,
      resueltaAt: null,
      ...(urgente ? { prioridad: "URGENTE" } : {}),
      version: { increment: 1 },
    },
  });
  await tx.eventoConversacion.create({
    data: { gestionId: actual.id, accion: "DERIVACION", detalle: motivo },
  });
}
