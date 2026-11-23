import type { ConversacionPanel } from '@/types/panel-artista';
import { nombresEtapa } from '@/lib/gestion-conversaciones';
import { PanelIcon } from './PanelUI';
import css from './conversation-context.module.css';
export function IndicadoresChat({
  hilo,
  completo = false,
}: {
  hilo: Pick<ConversacionPanel, 'etapa' | 'gestion' | 'botActivo'>;
  completo?: boolean;
}) {
  const g = hilo.gestion;
  return (
    <span className={css.indicadores} aria-label="Estado de la conversación">
      {hilo.etapa && (
        <span className={hilo.etapa === 'TURNO_CONFIRMADO' ? css.positivo : css.neutro}>
          <PanelIcon nombre={hilo.etapa.includes('TURNO') ? 'agenda' : 'reloj'} size={13} />
          {nombresEtapa[hilo.etapa]}
        </span>
      )}
      {typeof hilo.botActivo === 'boolean' && (
        <span className={hilo.botActivo ? css.positivo : css.neutro}>
          <PanelIcon nombre={hilo.botActivo ? 'bot' : 'pausa'} size={13} />
          {hilo.botActivo ? 'Bot activo' : 'Bot pausado'}
        </span>
      )}
      {g?.atencion === 'PENDIENTE' && (
        <span className={css.pendiente}>
          <PanelIcon nombre="atencion" size={13} />
          Necesita atención
        </span>
      )}
      {g?.atencion === 'MANUAL' && (
        <span className={css.neutro}>
          <PanelIcon nombre="perfil" size={13} />
          Atención manual
        </span>
      )}
      {g?.atencion === 'RESUELTA' && completo && (
        <span className={css.positivo}>
          <PanelIcon nombre="check" size={13} />
          Resuelto
        </span>
      )}
      {(g?.prioridad === 'URGENTE' || completo) && (
        <span className={g?.prioridad === 'URGENTE' ? css.urgente : css.neutro}>
          <PanelIcon nombre="bandera" size={13} />
          {g?.prioridad === 'URGENTE' ? 'Urgente' : 'Prioridad normal'}
        </span>
      )}
    </span>
  );
}
