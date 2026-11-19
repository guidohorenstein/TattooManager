import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { trabajoPublicado } from "../catalogo/catalogo.repository.js";
import { planIndividualVigente, titularConPlan } from "../pagos/acceso-plan.js";

const perfilPublico = {
  id: true,
  nombreArtistico: true,
  biografia: true,
  fotoPerfil: true,
  estilosPrincipales: true,
  galeria: {
    where: trabajoPublicado,
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      url: true,
      descripcion: true,
      estilos: true,
      createdAt: true,
    },
  },
} satisfies Prisma.UsuarioSelect;

export function buscarPaginaEstudio(slug: string) {
  return prisma.estudio.findFirst({
    where: { slug, propietario: { ...titularConPlan(), estudio: { slug } } },
    select: {
      nombre: true,
      biografia: true,
      ciudad: true,
      ciudadId: true,
      direccion: true,
      zonaHoraria: true,
      slug: true,
      usuarios: {
        where: {
          rol: "ARTISTA",
          suspendidoAt: null,
          estadoEnEstudio: "ACTIVO",
        },
        select: perfilPublico,
        orderBy: { nombreArtistico: "asc" },
        take: 24,
      },
      disponibilidades: {
        where: {
          artista: {
            rol: "ARTISTA",
            suspendidoAt: null,
            estadoEnEstudio: "ACTIVO",
          },
        },
        select: { artistaId: true, semana: true },
        take: 24,
      },
    },
  });
}

export function buscarPaginaArtista(id: string) {
  return prisma.usuario.findFirst({
    where: {
      id,
      rol: "ARTISTA",
      estudioId: null,
      suspendidoAt: null,
      suscripciones: { some: planIndividualVigente() },
    },
    select: {
      ...perfilPublico,
      ciudad: true,
      ciudadId: true,
      direccion: true,
      zonaHoraria: true,
      fotoTrabajando: true,
      disponibilidades: {
        where: { estudioId: null, ambito: "INDEPENDIENTE" },
        select: { artistaId: true, semana: true },
        take: 1,
      },
    },
  });
}
