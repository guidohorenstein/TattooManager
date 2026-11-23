import { titularConPlan, planIndividualVigente } from "../pagos/acceso-plan.js";
import { prisma } from "../config/prisma.js";
import { resumenDesdeHechos, hechosDeConsulta } from "./resumen-operativo.js";

import {
  generarResumenNarrativo,
  leerResumenConversacion,
  prepararDialogo,
} from "./resumen-narrativo.js";
import { bloquearConversacionCanal } from "../mensajes/mensajes.repository.js";
import { bloquearConversacionWhatsApp } from "../whatsapp/whatsapp.repository.js";

export async function procesarResumenes() {
  const ahora = new Date();
  const pendientes = await prisma.gestionConversacion.findMany({
    where: {
      resumenPendienteAt: { lte: ahora },
      AND: [
        {
          OR: [
            { estudio: { propietario: titularConPlan(ahora) } },
            {
              artista: {
                rol: "ARTISTA",
                estudioId: null,
                suspendidoAt: null,
                suscripciones: { some: planIndividualVigente(ahora) },
              },
            },
          ],
        },
      ],
      OR: [{ leaseResumenHasta: null }, { leaseResumenHasta: { lt: ahora } }],
    },
    orderBy: { resumenPendienteAt: "asc" },
    take: 3,
  });
  for (const g of pendientes) {
    const lease = new Date(Date.now() + 60000);
    const where = {
      id: g.id,
      resumenPendienteAt: g.resumenPendienteAt,
      OR: [{ leaseResumenHasta: null }, { leaseResumenHasta: { lt: ahora } }],
    };
    if (
      !(
        await prisma.gestionConversacion.updateMany({
          where,
          data: { leaseResumenHasta: lease, intentoResumenAt: ahora },
        })
      ).count
    )
      continue;
    try {
      const hilo =
        g.canal === "WHATSAPP"
          ? await prisma.conversacionWhatsApp.findUnique({
              where: { id: g.conversacionId },
            })
          : await prisma.conversacionCanal.findUnique({
              where: { id: g.conversacionId },
            });
      if (
        !hilo ||
        hilo.estudioId !== g.estudioId ||
        (!g.estudioId && hilo.artistaId !== g.artistaId)
      ) {
        await prisma.gestionConversacion.updateMany({
          where: { id: g.id, leaseResumenHasta: lease },
          data: { resumenPendienteAt: null },
        });
        continue;
      }
      const [s, ultimo] = await Promise.all([
        hilo.solicitudId
          ? prisma.solicitud.findFirst({
              where: {
                id: hilo.solicitudId,
                estudioId: g.estudioId,
                ...(!g.estudioId ? { artistaDestinoId: g.artistaId } : {}),
              },
              select: {
                createdAt: true,
                contacto: {
                  select: { nombre: true, email: true, telefono: true },
                },
                cliente: {
                  select: { nombre: true, email: true, telefono: true },
                },
                estado: true,
                estilo: true,
                artistaAsignadoId: true,
                cotizaciones: { select: { artistaId: true } },
                citas: {
                  select: { estado: true, finAt: true },
                  where: { estado: { not: "CANCELADA" } },
                  orderBy: { inicioAt: "desc" },
                  take: 20,
                },
              },
            })
          : null,
        g.canal === "WHATSAPP"
          ? prisma.mensajeWhatsApp.findFirst({
              where: { conversacionId: hilo.id },
              orderBy: [{ fecha: "desc" }, { id: "desc" }],
              select: { id: true, propio: true, fecha: true },
            })
          : prisma.mensajeCanal.findFirst({
              where: { conversacionId: hilo.id, ecoInstagram: false },
              orderBy: [{ fecha: "desc" }, { id: "desc" }],
              select: { id: true, propio: true, fecha: true },
            }),
      ]);

      const hechos = hechosDeConsulta(s, g, ultimo?.propio ?? false, ahora);
      const previo =
        g.resumen && typeof g.resumen === "object" && !Array.isArray(g.resumen)
          ? g.resumen
          : null;
      const mismoCaso = previo?.casoId === (hilo.solicitudId ?? null);
      const anterior = mismoCaso
        ? leerResumenConversacion(previo?.conversacion)
        : null;
      // Los nombres y contactos se usan únicamente para ocultarlos antes de salir de la app.
      const identidades = [
        hilo.nombre,
        hilo.remitente,
        s?.contacto?.nombre,
        s?.contacto?.email,
        s?.contacto?.telefono,
        s?.cliente?.nombre,
        s?.cliente?.email,
        s?.cliente?.telefono,
      ].filter((v): v is string => Boolean(v));
      const whereMensajes = {
        conversacionId: hilo.id,
        ...(s?.createdAt ? { fecha: { gte: s.createdAt } } : {}),
        ...(ultimo
          ? {
              OR: [
                { fecha: { lt: ultimo.fecha } },
                { fecha: ultimo.fecha, id: { lte: ultimo.id } },
              ],
            }
          : {}),
      };
      const select = {
        id: true,
        texto: true,
        propio: true,
        fecha: true,
        estado: true,
      } as const;
      const filas =
        g.canal === "WHATSAPP"
          ? await prisma.mensajeWhatsApp.findMany({
              where: whereMensajes,
              select,
              orderBy: [{ fecha: "desc" }, { id: "desc" }],
              take: 40,
            })
          : await prisma.mensajeCanal.findMany({
              where: { ...whereMensajes, ecoInstagram: false },
              select,
              orderBy: [{ fecha: "desc" }, { id: "desc" }],
              take: 40,
            });
      const dialogo = prepararDialogo(
        filas.reverse(),
        identidades,
        anterior,
        ultimo?.id ?? null,
      );
      let conversacion = anterior,
        errorResumen = false;
      const intentosAnteriores =
        mismoCaso &&
        previo?.mensajeIntentado === (ultimo?.id ?? null) &&
        typeof previo?.intentosConversacion === "number"
          ? previo.intentosConversacion
          : 0;
      let intentosConversacion = 0;
      try {
        conversacion =
          anterior?.huella === dialogo.huella
            ? {
                ...anterior,
                omitidos: dialogo.omitidos,
                recortado: dialogo.recortado,
                hastaId: dialogo.hastaId,
              }
            : await generarResumenNarrativo(hechos, dialogo, identidades);
      } catch {
        errorResumen = true;
        intentosConversacion = intentosAnteriores + 1;
      }
      const resumen = {
        ...resumenDesdeHechos(hechos),
        casoId: hilo.solicitudId ?? null,
        conversacion,
        intentosConversacion,
        mensajeIntentado: ultimo?.id ?? null,
      };
      await prisma.$transaction(async (tx) => {
        if (g.canal === "WHATSAPP")
          await bloquearConversacionWhatsApp(tx, hilo.id);
        else await bloquearConversacionCanal(tx, hilo.id);
        const actual =
          g.canal === "WHATSAPP"
            ? await tx.conversacionWhatsApp.findUnique({
                where: { id: hilo.id },
              })
            : await tx.conversacionCanal.findUnique({ where: { id: hilo.id } });
        if (
          !actual ||
          actual.estudioId !== hilo.estudioId ||
          actual.artistaId !== hilo.artistaId ||
          actual.solicitudId !== hilo.solicitudId
        )
          return;
        await tx.gestionConversacion.updateMany({
          where: {
            id: g.id,
            leaseResumenHasta: lease,
            resumenPendienteAt: g.resumenPendienteAt,
            version: g.version,
          },
          data: {
            resumen,
            ultimoMensajeResumenId: ultimo?.id ?? null,
            resumenActualizadoAt: new Date(),
            resumenPendienteAt:
              errorResumen && intentosConversacion < 3
                ? new Date(Date.now() + 60000)
                : null,
            errorResumen,
          },
        });
      });
    } catch {
      console.error("No pudimos actualizar un resumen operativo.");
    } finally {
      await prisma.gestionConversacion.updateMany({
        where: { id: g.id, leaseResumenHasta: lease },
        data: { leaseResumenHasta: null },
      });
    }
  }
}
export function iniciarResumenes() {
  let ejecutando = false;
  setInterval(async () => {
    if (ejecutando) return;
    ejecutando = true;
    try {
      await procesarResumenes();
    } catch {
      console.error("No pudimos revisar los resúmenes pendientes.");
    } finally {
      ejecutando = false;
    }
  }, 15000).unref();
}
