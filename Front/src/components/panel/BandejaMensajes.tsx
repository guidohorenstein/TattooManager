'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { PanelMessages } from './PanelMessages';
import { PageHeader } from './PanelUI';
import { useConsultas } from '@/hooks/useConsultas';
import { mutarPanel, usePanelData } from '@/hooks/usePanelData';
import { usePanelFilters } from '@/hooks/usePanelFilters';
import { apiFetch } from '@/lib/api-client';
import { notificar } from '@/lib/notificar';
import type { ConversacionPanel, MensajePanel, PaginaMensajes } from '@/types/panel-artista';

type Canal = ConversacionPanel['canal'];
type Bandeja = {
  conectado: boolean;
  administra: boolean;
  requierePlanIndividual?: boolean;
  conversaciones: ConversacionPanel[];
};
const ruta = (canal: Canal, id: string) => '/mensajes/' + canal.toLowerCase() + '/' + id;

export function BandejaMensajes({
  actualizarResumen,
  configuracion,
}: {
  actualizarResumen: () => Promise<void>;
  configuracion: '/artista/configuracion' | '/estudio/configuracion';
}) {
  const { params } = usePanelFilters();
  const consulta = params.get('consulta');
  const urlBandeja = consulta ? `/mensajes?consulta=${encodeURIComponent(consulta)}` : '/mensajes';
  const { datos, error, cargando, recargar, actualizar } = usePanelData<Bandeja>(urlBandeja, 8000);
  const consultas = useConsultas();
  const [borradores, setBorradores] = useState<Record<string, string>>({});
  const [errorLectura, setErrorLectura] = useState('');
  const leyendo = useRef(new Set<string>());
  const intento = useRef<{ id: string; texto: string; clave: string } | null>(null);
  const leerConversacion = useCallback(
    async (id: string, canal: Canal, hasta: string) => {
      const clave = id + hasta;
      if (leyendo.current.has(clave)) return;
      leyendo.current.add(clave);
      try {
        await mutarPanel(ruta(canal, id) + '/lectura', 'PATCH', { hasta });
        setErrorLectura('');
        actualizar((d) => ({
          ...d,
          conversaciones: d.conversaciones.map((c) =>
            c.id === id && !c.mensajes.some((m) => !m.propio && m.fecha > hasta)
              ? { ...c, sinLeer: 0 }
              : c,
          ),
        }));
        void actualizarResumen();
      } catch (e) {
        setErrorLectura(
          e instanceof Error ? e.message : 'No pudimos marcar la conversación como leída.',
        );
      } finally {
        leyendo.current.delete(clave);
      }
    },
    [actualizar, actualizarResumen],
  );

  if (!datos)
    return (
      <>
        <PageHeader titulo="Mensajes" />
        {cargando ? (
          <p role="status">Cargando conversaciones…</p>
        ) : (
          <div className="alert alert-danger" role="alert">
            {error}{' '}
            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={() => void recargar()}
            >
              Reintentar
            </button>
          </div>
        )}
      </>
    );

  if (datos.requierePlanIndividual)
    return (
      <>
        <PageHeader titulo="Mensajes" />
        <p>Activá el Plan Individual para usar tu bandeja de mensajes.</p>
        <Link href="/artista/suscripcion">Ver suscripción</Link>
      </>
    );

  async function enviarMensaje(id: string, canal: Canal, texto: string) {
    if (!intento.current || intento.current.id !== id || intento.current.texto !== texto)
      intento.current = { id, texto, clave: crypto.randomUUID() };
    const respuesta = await mutarPanel(ruta(canal, id), 'POST', {
      texto,
      clave: intento.current.clave,
    });
    if (respuesta.status !== 204) {
      const mensaje = (await respuesta.json()) as MensajePanel | null;
      if (!mensaje?.id)
        throw new Error(
          'No pudimos comprobar el envío. Actualizá la conversación antes de volver a intentar.',
        );
      actualizar((d) => ({
        ...d,
        conversaciones: d.conversaciones.map((c) =>
          c.id === id
            ? { ...c, mensajes: [...c.mensajes.filter((m) => m.id !== mensaje.id), mensaje] }
            : c,
        ),
      }));
      if (mensaje.estado === 'ERROR') notificar.error('El canal rechazó el mensaje. No se envió.');
      if (mensaje.estado === 'INCIERTO' || mensaje.estado === 'ENVIANDO')
        notificar.info('El envío sigue sin confirmar. Revisá su estado antes de repetirlo.');
    }
    intento.current = null;
    void recargar();
    void actualizarResumen();
  }

  return (
    <PanelMessages
      administra={datos.administra}
      base={configuracion.startsWith('/estudio') ? '/estudio' : '/artista'}
      actualizarBandeja={recargar}
      datos={{ conversaciones: datos.conversaciones, borradoresMensajes: borradores }}
      conectado={datos.conectado}
      errorConexion={error || errorLectura}
      configuracion={datos.administra ? `${configuracion}#cuentas-asociadas` : undefined}
      consultas={consultas.datos?.contexto.administra ? consultas.datos.consultas : undefined}
      buscarCliente={(id) => {
        const c = datos.conversaciones.find((item) => item.id === id);
        return {
          id,
          nombre: c?.nombre || c?.telefono || 'Contacto',
          telefono: c?.telefono || '',
          email: '',
          ciudad: '',
          notas: '',
        };
      }}
      leerConversacion={leerConversacion}
      cargarHistorial={async (id, canal, antes): Promise<PaginaMensajes> =>
        (
          await apiFetch(ruta(canal, id) + '/historial?antes=' + encodeURIComponent(antes), {
            cache: 'no-store',
          })
        ).json()
      }
      enviarMensaje={enviarMensaje}
      cambiarBot={async (id, activo) => {
        await mutarPanel(ruta('INSTAGRAM', id) + '/bot', 'PUT', { activo });
        await recargar();
      }}
      guardarBorradorMensaje={(id, texto) => setBorradores((d) => ({ ...d, [id]: texto }))}
      vincularConsulta={async (id, canal, solicitudId) => {
        await mutarPanel(ruta(canal, id) + '/consulta', 'PUT', { solicitudId });
        await Promise.all([recargar(), actualizarResumen()]);
      }}
    />
  );
}
