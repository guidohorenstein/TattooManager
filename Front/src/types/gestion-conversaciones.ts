import type { PaginaMensajes } from './panel-artista';
export type EtapaChat =
  | 'NUEVA'
  | 'CONSULTA'
  | 'PROPUESTAS'
  | 'ESPERANDO_CLIENTE'
  | 'POR_ASIGNAR'
  | 'COORDINAR_TURNO'
  | 'TURNO_PENDIENTE'
  | 'TURNO_CONFIRMADO'
  | 'COMPLETADA'
  | 'ARCHIVADA';
export interface GestionChat {
  atencion: 'AUTOMATICA' | 'PENDIENTE' | 'MANUAL' | 'RESUELTA';
  prioridad: 'NORMAL' | 'URGENTE';
  motivo: string;
  responsableId: string | null;
  responsable?: string | null;
  version: number;
  resueltaAt: string | null;
}
export interface PuntoResumenChat {
  texto: string;
  evidencias: { id: string; texto: string; propio: boolean; fecha: string }[];
}
export interface ResumenDialogo {
  preferencias: PuntoResumenChat[];
  preguntasPendientes: PuntoResumenChat[];
  acuerdos: PuntoResumenChat[];
  omitidos: number;
  recortado: boolean;
}
export interface ContextoChat {
  canal: string;
  conversacionId: string;
  cliente: { nombre: string; email: string; telefono: string };
  zonaHoraria: string;
  gestion: GestionChat;
  responsables: { id: string; nombre: string }[];
  puedeAsignar: boolean;
  puedeGestionar: boolean;
  puedeReactivarBot: boolean;
  botActivo: boolean | null;
  etapa: EtapaChat;
  resumen: {
    resumen: string;
    proximoPaso: string;
    origen: 'IA' | 'DATOS';
    conversacion?: ResumenDialogo | null;
  } | null;
  resumenActualizadoAt: string | null;
  resumenPendiente: boolean;
  errorResumen: boolean;
  pagina: PaginaMensajes;
  eventos: { id: string; accion: string; detalle: string; createdAt: string }[];
  consulta: null | {
    id: string;
    titulo: string;
    descripcion: string;
    estilo: string;
    zona: string;
    referencias: string[];
    imagenZonaMarcada: string | null;
    estado: string;
    version: number;
    artistaId: string | null;
    artista: string | null;
    propuestas: {
      id: string;
      artistaId: string;
      artista: string;
      importe: number;
      sena: number;
      moneda: string;
      detalle: string;
      boceto: string | null;
      duracionMinutos: number;
      validaHasta: string | null;
      vencida: boolean;
      elegida: boolean;
    }[];
    turnos: {
      id: string;
      titulo: string;
      inicio: string;
      fin: string;
      estado: string;
      version: number;
      importe: number;
    }[];
  };
}
