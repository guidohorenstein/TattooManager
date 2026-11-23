'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mutarPanel, usePanelData } from './usePanelData';
import { crearRecordatorios } from '@/mocks/recordatorios';
import type { ConversacionPanel, NotificacionPanel } from '@/types/panel-artista';
import type { PerfilEstudio } from '@/types/panel-estudio';
import type { RecordatoriosPanel } from '@/types/recordatorios';

type Operacion = {
  estudio:
    | (PerfilEstudio & {
        slug: string;
        ciudadId: number | null;
        provinciaId: number | null;
        pais: string | null;
        plazoPropuestasHoras: number;
      })
    | null;
  recordatorios: RecordatoriosPanel | null;
  recordatoriosClientes: RecordatoriosPanel | null;
  puedeEditarClientes: boolean;
  notificaciones: NotificacionPanel[];
  conversaciones: ConversacionPanel[];
};
const sinActivar = {
  ...crearRecordatorios(),
  clientesHabilitados: false,
  artistaHabilitado: false,
};

export function useOperacion() {
  const { datos, error, cargando, recargar, actualizar } = usePanelData<Operacion>(
    '/operacion',
    30000,
  );
  const [errorAccion, setErrorAccion] = useState('');
  const [preferenciasPendientes, setPreferenciasPendientes] = useState<RecordatoriosPanel | null>(
    null,
  );
  const colaGuardado = useRef(Promise.resolve());
  const revisionGuardado = useRef(0);
  const panelAbierto = useRef(true);
  useEffect(() => {
    panelAbierto.current = true;
    return () => {
      panelAbierto.current = false;
    };
  }, []);
  const propios = datos?.recordatorios || sinActivar;
  const negocio = datos?.recordatoriosClientes || sinActivar;
  const recordatorios = preferenciasPendientes ?? {
    ...propios,
    clientesHabilitados: negocio.clientesHabilitados,
    reglas: {
      ...propios.reglas,
      TURNO: negocio.reglas.TURNO,
      CUIDADOS: negocio.reglas.CUIDADOS,
      RESENA: negocio.reglas.RESENA,
    },
  };
  const leerNotificacion = useCallback(
    async (id?: string) => {
      if (!panelAbierto.current) return;
      try {
        await mutarPanel('/operacion/notificaciones', 'PATCH', id ? { id } : {});
        setErrorAccion('');
        await recargar();
      } catch (e) {
        setErrorAccion(e instanceof Error ? e.message : 'No pudimos actualizar la notificación.');
      }
    },
    [recargar],
  );
  function guardarRecordatorios(config: RecordatoriosPanel): Promise<string> {
    const revision = ++revisionGuardado.current;
    setPreferenciasPendientes(config);
    // Conservamos el orden de los cambios aunque la conexión sea lenta.
    const guardado = colaGuardado.current.then(async () => {
      if (!panelAbierto.current) return 'Se cerró el panel antes de guardar el cambio.';
      try {
        await mutarPanel('/operacion/recordatorios', 'PUT', config);
        actualizar((actual) => ({
          ...actual,
          recordatorios: config,
          recordatoriosClientes: actual.puedeEditarClientes ? config : actual.recordatoriosClientes,
        }));
        return '';
      } catch (error) {
        return error instanceof Error ? error.message : 'No pudimos guardar los recordatorios.';
      }
    });
    colaGuardado.current = guardado.then(() => undefined);
    return guardado.then((error) => {
      if (revisionGuardado.current === revision) setPreferenciasPendientes(null);
      return error;
    });
  }
  return {
    operacion: datos,
    errorOperacion: error || errorAccion,
    cargandoOperacion: cargando,
    recargarOperacion: recargar,
    guardarRecordatorios,
    leerNotificacion,
    recordatorios,
  };
}
