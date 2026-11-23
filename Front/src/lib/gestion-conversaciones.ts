import type { ConversacionPanel } from '@/types/panel-artista';
import type { EtapaChat } from '@/types/gestion-conversaciones';
export const nombresEtapa: Record<EtapaChat, string> = {
  NUEVA: 'Nueva conversación',
  CONSULTA: 'Consulta recibida',
  PROPUESTAS: 'Preparando propuestas',
  ESPERANDO_CLIENTE: 'Esperando al cliente',
  POR_ASIGNAR: 'Por asignar',
  COORDINAR_TURNO: 'Coordinar turno',
  TURNO_PENDIENTE: 'Turno por confirmar',
  TURNO_CONFIRMADO: 'Turno confirmado',
  COMPLETADA: 'Sesión completada',
  ARCHIVADA: 'Consulta cerrada',
};
export function coincideGestion(
  c: ConversacionPanel,
  f: { etapa: string; atencion: string; prioridad: string },
) {
  return (
    (!f.etapa || c.etapa === f.etapa) &&
    (!f.prioridad || c.gestion?.prioridad === f.prioridad) &&
    (!f.atencion ||
      (f.atencion === 'BOT_ACTIVO'
        ? c.botActivo === true
        : f.atencion === 'BOT_PAUSADO'
          ? c.botActivo === false
          : c.gestion?.atencion === f.atencion))
  );
}
