export interface ArtistaPagina {
  id: string;
  nombre: string;
  biografia: string | null;
  foto: string | null;
  estilos: string[];
}
export interface TrabajoPagina {
  id: string;
  url: string;
  descripcion: string;
  estilos: string[];
  artistaId: string;
  artista: string;
}
export interface HorarioPagina {
  artista: string;
  semana: { dia: number; rangos: { desde: string; hasta: string }[] }[];
}
export interface PaginaPublica {
  tipo: "ESTUDIO" | "ARTISTA";
  nombre: string;
  biografia: string | null;
  ciudad: string | null;
  direccion: string | null;
  zonaHoraria: string;
  portada: string | null;
  formulario: string;
  artistas: ArtistaPagina[];
  trabajos: TrabajoPagina[];
  horarios: HorarioPagina[];
}
