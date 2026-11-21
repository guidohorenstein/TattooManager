import { HttpError } from "../errors/http-error.js";
import { obtenerUbicacion } from "../ubicaciones/ubicaciones.service.js";
import {
  buscarConfiguracionPagina,
  guardarConfiguracionPagina,
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
    direccion: e.propietario?.publicarDireccion ? e.direccion : null,
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
    direccion: a.publicarDireccion ? a.direccion : null,
    zonaHoraria: a.zonaHoraria,
    portada: a.fotoTrabajando || galeria[0]?.url || a.fotoPerfil,
    formulario: "/cotizacion/artista/" + encodeURIComponent(a.id),
    artistas: [artista],
    trabajos: galeria,
    horarios: horarios(a.disponibilidades, [artista]),
  };
}

export async function configuracionPagina(usuarioId: string) {
  const cuenta = await buscarConfiguracionPagina(usuarioId);
  if (!cuenta || !["ARTISTA", "ESTUDIO_ADMIN"].includes(cuenta.rol)) throw new HttpError(403, "No tenés una página profesional.");
  const estudio = cuenta.estudio;
  if (cuenta.rol === "ESTUDIO_ADMIN" && estudio?.propietarioId !== cuenta.id) throw new HttpError(403, "Solo el titular puede gestionar esta página.");
  const independiente = !cuenta.estudioId;
  const pendiente: string[] = [];
  if (independiente) {
    if (!cuenta.nombreArtistico?.trim()) pendiente.push("nombre artístico");
    if (!cuenta.biografia?.trim()) pendiente.push("biografía");
    if (!cuenta.ciudadId) pendiente.push("ciudad");
    if (!cuenta.fotoPerfil) pendiente.push("foto de perfil");
    if (!cuenta.estilosPrincipales.length) pendiente.push("estilos principales");
    if (!cuenta._count.galeria) pendiente.push("un trabajo publicado");
  } else {
    if (!estudio?.nombre.trim()) pendiente.push("nombre del estudio");
    if (!estudio?.biografia?.trim()) pendiente.push("biografía del estudio");
    if (!estudio?.ciudadId) pendiente.push("ciudad");
    if (!estudio?.usuarios.some(a => a._count.galeria > 0)) pendiente.push("un trabajo publicado de un integrante activo");
  }
  return {
    publicada: independiente ? cuenta.paginaPublicada : Boolean(estudio?.propietario?.paginaPublicada),
    mostrarDireccion: independiente ? cuenta.publicarDireccion : Boolean(estudio?.propietario?.publicarDireccion),
    puedeEditar: independiente || cuenta.rol === "ESTUDIO_ADMIN",
    pendientes: pendiente,
    enlace: independiente ? "/a/" + cuenta.id : "/e/" + encodeURIComponent(estudio!.slug),
    perfil: independiente ? "/artista/perfil" : "/estudio/perfil",
    estudioId: cuenta.estudioId,
  };
}
export async function cambiarConfiguracionPagina(usuarioId: string, entrada: unknown) {
  const actual = await configuracionPagina(usuarioId);
  if (!actual.puedeEditar) throw new HttpError(403, "Solo el titular puede publicar la página del estudio.");
  const datos = entrada as { publicada?: unknown; mostrarDireccion?: unknown } | null;
  if (!datos || typeof datos.publicada !== "boolean" || typeof datos.mostrarDireccion !== "boolean") throw new HttpError(400, "Indicá el estado de publicación y de la dirección.");
  if (datos.publicada && actual.pendientes.length) throw new HttpError(400, "Completá: " + actual.pendientes.join(", ") + ".");
  const cambio = await guardarConfiguracionPagina(usuarioId, actual.estudioId, { paginaPublicada: datos.publicada, publicarDireccion: datos.mostrarDireccion });
  if (!cambio.count) throw new HttpError(409, "Tu pertenencia al estudio cambió. Actualizá la página.");
  return configuracionPagina(usuarioId);
}
