import { HttpError } from "../errors/http-error.js";
import { obtenerUbicacion } from "../ubicaciones/ubicaciones.service.js";
import {
  buscarPaginaArtista,
  buscarPaginaEstudio,
} from "./paginas-publicas.repository.js";
import type {
  PaginaPublica,
  HorarioPagina,
} from "./paginas-publicas.entity.js";

type Perfil = NonNullable<Awaited<ReturnType<typeof buscarPaginaArtista>>>;
function presentarArtista(
  a: Pick<
    Perfil,
    "id" | "nombreArtistico" | "biografia" | "fotoPerfil" | "estilosPrincipales"
  >,
) {
  return {
    id: a.id,
    nombre: a.nombreArtistico || "Artista",
    biografia: a.biografia,
    foto: a.fotoPerfil,
    estilos: a.estilosPrincipales,
  };
}
function trabajos(
  artistas: Pick<Perfil, "id" | "nombreArtistico" | "galeria">[],
) {
  return artistas
    .flatMap((a) =>
      a.galeria.map((t) => ({
        id: t.id,
        url: t.url,
        descripcion: t.descripcion,
        estilos: t.estilos,
        artistaId: a.id,
        artista: a.nombreArtistico || "Artista",
        createdAt: t.createdAt,
      })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 48)
    .map(({ createdAt: _fecha, ...t }) => t);
}
function horarios(
  filas: { artistaId: string; semana: unknown }[],
  artistas: { id: string; nombre: string }[],
): HorarioPagina[] {
  return artistas.flatMap((a) => {
    const fila = filas.find((f) => f.artistaId === a.id);
    if (!Array.isArray(fila?.semana)) return [];
    return [
      { artista: a.nombre, semana: fila.semana as HorarioPagina["semana"] },
    ];
  });
}

export async function obtenerPaginaEstudio(
  slug: string,
): Promise<PaginaPublica> {
  if (!slug || slug.length > 120)
    throw new HttpError(404, "No encontramos este estudio.");
  const e = await buscarPaginaEstudio(slug);
  if (!e) throw new HttpError(404, "Esta página no está disponible.");
  const artistas = e.usuarios.map(presentarArtista);
  const galeria = trabajos(e.usuarios);
  return {
    tipo: "ESTUDIO",
    nombre: e.nombre,
    biografia: e.biografia,
    ciudad: obtenerUbicacion(e.ciudadId)?.ubicacion || e.ciudad,
    direccion: e.direccion,
    zonaHoraria: e.zonaHoraria,
    portada: galeria[0]?.url || null,
    formulario: "/cotizacion/" + encodeURIComponent(e.slug),
    artistas,
    trabajos: galeria,
    horarios: horarios(e.disponibilidades, artistas),
  };
}
export async function obtenerPaginaArtista(id: string): Promise<PaginaPublica> {
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new HttpError(404, "No encontramos este artista.");
  const a = await buscarPaginaArtista(id);
  if (!a) throw new HttpError(404, "Esta página no está disponible.");
  const artista = presentarArtista(a),
    galeria = trabajos([a]);
  return {
    tipo: "ARTISTA",
    nombre: artista.nombre,
    biografia: a.biografia,
    ciudad: obtenerUbicacion(a.ciudadId)?.ubicacion || a.ciudad,
    direccion: a.direccion,
    zonaHoraria: a.zonaHoraria,
    portada: a.fotoTrabajando || galeria[0]?.url || a.fotoPerfil,
    formulario: "/cotizacion/artista/" + encodeURIComponent(a.id),
    artistas: [artista],
    trabajos: galeria,
    horarios: horarios(a.disponibilidades, [artista]),
  };
}
