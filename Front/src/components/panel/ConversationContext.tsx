'use client';
import { ConversationSummary } from './ConversationSummary';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Offcanvas from 'react-bootstrap/Offcanvas';
import type { ContextoChat, GestionChat } from '@/types/gestion-conversaciones';
import type { ConversacionPanel, PaginaMensajes } from '@/types/panel-artista';
import { mutarPanel, usePanelData } from '@/hooks/usePanelData';
import { useUnsavedChanges, useDiscardChanges } from '@/components/forms/UnsavedChanges';
import { notificar } from '@/lib/notificar';
import { IndicadoresChat } from './IndicadoresChat';
import css from './conversation-context.module.css';

type Props = {
  hilo: ConversacionPanel;
  abierto: boolean;
  cerrar: () => void;
  onPagina: (id: string, pagina: PaginaMensajes) => void;
  onCambio: () => Promise<void>;
  onBorrador: (id: string, texto: string) => void;
  base: '/artista' | '/estudio';
};
export function ConversationContext({
  hilo,
  abierto,
  cerrar,
  onPagina,
  onCambio,
  onBorrador,
  base,
}: Props) {
  const url = '/mensajes/' + hilo.canal.toLowerCase() + '/' + hilo.id + '/contexto';
  const { datos, error, recargar, actualizar } = usePanelData<ContextoChat>(url);
  const revision = [
    hilo.id,
    hilo.mensajes.at(-1)?.id,
    hilo.gestion?.version,
    hilo.resumenRevision,
  ].join(':');
  const previa = useRef(revision);
  useEffect(() => {
    if (previa.current !== revision) {
      previa.current = revision;
      void recargar();
    }
  }, [revision, recargar]);
  useEffect(() => {
    if (datos) onPagina(datos.conversacionId, datos.pagina);
  }, [datos, onPagina]);
  const fecha = (v: string) =>
    new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: datos?.zonaHoraria,
    }).format(new Date(v));
  const consulta = datos?.consulta;
  const [revisionFormulario, setRevisionFormulario] = useState(0);
  return (
    <Offcanvas
      responsive="xxl"
      placement="end"
      show={abierto}
      onHide={cerrar}
      className={css.contexto}
      aria-labelledby="contexto-chat-titulo"
    >
      <Offcanvas.Header closeButton closeLabel="Cerrar detalles">
        <Offcanvas.Title id="contexto-chat-titulo">Detalles de la conversación</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className={css.cuerpo}>
        <h2 className={css.titulo}>Detalles de la conversación</h2>
        {error && (
          <div role="alert" className="alert alert-danger">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => void recargar()}
            >
              Reintentar
            </button>
          </div>
        )}
        {!datos && !error && <p role="status">Cargando detalles…</p>}
        {datos && (
          <>
            <IndicadoresChat
              hilo={{
                ...hilo,
                gestion: datos.gestion,
                etapa: datos.etapa,
                botActivo: datos.botActivo ?? undefined,
              }}
              completo
            />
            <section className={css.seccion}>
              <h3>Atención del equipo</h3>
              <GestionForm
                key={datos.conversacionId + ':' + revisionFormulario}
                datos={datos}
                url={url.replace('/contexto', '/gestion')}
                onReiniciar={() => setRevisionFormulario((v) => v + 1)}
                onGuardado={(gestion, reactivarBot) => {
                  actualizar((d) => ({
                    ...d,
                    gestion,
                    botActivo: reactivarBot
                      ? true
                      : ['PENDIENTE', 'MANUAL'].includes(gestion.atencion)
                        ? false
                        : d.botActivo,
                  }));
                  setRevisionFormulario((v) => v + 1);
                  void recargar();
                  void onCambio();
                }}
              />
            </section>
            <ConversationSummary datos={datos} fecha={fecha} />
            <section className={css.seccion}>
              <h3>Consulta</h3>
              {consulta ? (
                <>
                  <Link href={base + '/consultas?consulta=' + encodeURIComponent(consulta.id)}>
                    {consulta.titulo}
                  </Link>
                  <p>{consulta.descripcion}</p>
                  <dl className={css.ficha}>
                    <dt>Estilo</dt>
                    <dd>{consulta.estilo}</dd>
                    <dt>Zona</dt>
                    <dd>{consulta.zona}</dd>
                    <dt>Artista</dt>
                    <dd>{consulta.artista || 'Sin asignar'}</dd>
                  </dl>
                  <div className={css.imagenes}>
                    {[consulta.imagenZonaMarcada, ...consulta.referencias]
                      .filter((v): v is string => Boolean(v))
                      .map((v, i) => (
                        <a key={v + i} href={v} target="_blank" rel="noopener noreferrer">
                          <Image
                            width={152}
                            height={172}
                            sizes="76px"
                            src={v}
                            alt={
                              i === 0 && consulta.imagenZonaMarcada
                                ? 'Área marcada para el tatuaje'
                                : 'Referencia del cliente'
                            }
                            loading="lazy"
                          />
                        </a>
                      ))}
                  </div>
                </>
              ) : (
                <p>Sin consulta vinculada.</p>
              )}
            </section>
            {consulta && (
              <section className={css.seccion}>
                <h3>Propuestas</h3>
                {!consulta.propuestas.length && <p>Todavía no hay propuestas.</p>}
                {consulta.propuestas.map((p) => (
                  <article key={p.id} className={css.propuesta}>
                    <div className={css.fila}>
                      <strong>{p.artista}</strong>
                      {p.elegida ? (
                        <span className={css.positivo}>Elegida</span>
                      ) : p.vencida ? (
                        <span className={css.pendiente}>Vencida</span>
                      ) : null}
                    </div>
                    {p.boceto && (
                      <a href={p.boceto} target="_blank" rel="noopener noreferrer">
                        <Image
                          width={620}
                          height={460}
                          sizes="310px"
                          className={css.boceto}
                          src={p.boceto}
                          alt={'Boceto de ' + p.artista}
                          loading="lazy"
                        />
                      </a>
                    )}
                    <p>{p.detalle}</p>
                    <strong>
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: p.moneda,
                      }).format(p.importe)}
                    </strong>
                    <p className={css.muted}>
                      {p.duracionMinutos} minutos · Seña{' '}
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: p.moneda,
                      }).format(p.sena)}
                    </p>
                    {p.validaHasta && <small>Válida hasta {fecha(p.validaHasta)}</small>}
                  </article>
                ))}
              </section>
            )}
            {consulta && (
              <section className={css.seccion}>
                <h3>Próximos turnos</h3>
                {consulta.turnos.length ? (
                  consulta.turnos.map((t) => (
                    <article key={t.id} className={css.propuesta}>
                      <Link href={base + '/agenda?cita=' + encodeURIComponent(t.id)}>
                        {fecha(t.inicio)}
                      </Link>
                      <p>
                        {t.estado === 'CONFIRMADA' ? 'Confirmado' : 'Por confirmar'} ·{' '}
                        {Math.round((Date.parse(t.fin) - Date.parse(t.inicio)) / 60000)} minutos
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          onBorrador(
                            hilo.id,
                            'Tu turno está ' +
                              (t.estado === 'CONFIRMADA'
                                ? 'confirmado'
                                : 'pendiente de confirmación') +
                              ' para el ' +
                              fecha(t.inicio) +
                              '. La sesión dura aproximadamente ' +
                              Math.round((Date.parse(t.fin) - Date.parse(t.inicio)) / 60000) +
                              ' minutos.',
                          );
                          notificar.info('Borrador preparado. Revisalo antes de enviarlo.');
                          cerrar();
                        }}
                      >
                        Preparar recordatorio
                      </button>
                    </article>
                  ))
                ) : (
                  <p>Sin turnos próximos.</p>
                )}
                <Link href={base + '/agenda?consulta=' + encodeURIComponent(consulta.id)}>
                  Abrir agenda
                </Link>
              </section>
            )}
            {datos.eventos.length > 0 && (
              <details className={css.seccion}>
                <summary>Historial de atención</summary>
                <ol className={css.eventos}>
                  {datos.eventos.map((e) => (
                    <li key={e.id}>
                      <p>{e.detalle}</p>
                      <small>{fecha(e.createdAt)}</small>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
function GestionForm({
  datos,
  url,
  onGuardado,
  onReiniciar,
}: {
  datos: ContextoChat;
  url: string;
  onGuardado: (gestion: GestionChat, reactivarBot: boolean) => void;
  onReiniciar: () => void;
}) {
  const [original] = useState(datos.gestion);
  const confirmar = useDiscardChanges();
  const cambioExterno = datos.gestion.version !== original.version;
  const [prioridad, setPrioridad] = useState(datos.gestion.prioridad);
  const [responsable, setResponsable] = useState(datos.gestion.responsableId || '');
  const [motivo, setMotivo] = useState(datos.gestion.motivo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const limpiar = useUnsavedChanges(
    prioridad !== original.prioridad ||
      responsable !== (original.responsableId || '') ||
      motivo !== original.motivo,
  );
  const bloqueo = useRef(false);
  async function guardar(
    accion: 'ACTUALIZAR' | 'TOMAR' | 'RESOLVER',
    reactivarBot = false,
    pendiente = false,
  ) {
    if (cambioExterno) {
      setError('El caso cambió. Recargá los datos antes de guardar.');
      return;
    }
    if (bloqueo.current) return;
    bloqueo.current = true;
    setGuardando(true);
    setError('');
    try {
      const respuesta = await mutarPanel(url, 'PATCH', {
        version: original.version,
        accion,
        prioridad,
        motivo,
        ...(datos.puedeAsignar ? { responsableId: responsable || null } : {}),
        ...(pendiente ? { atencion: 'PENDIENTE' } : {}),
        reactivarBot,
      });
      limpiar();
      notificar.exito(accion === 'RESOLVER' ? 'Atención resuelta.' : 'Atención actualizada.');
      onGuardado((await respuesta.json()) as GestionChat, reactivarBot);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la atención.');
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar('ACTUALIZAR');
      }}
      className={css.formulario}
    >
      {cambioExterno && (
        <div className="alert alert-warning p-2 small" role="alert">
          El caso cambió mientras lo tenías abierto.
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() =>
              confirmar(
                () => {
                  limpiar();
                  onReiniciar();
                },
                prioridad !== original.prioridad ||
                  responsable !== (original.responsableId || '') ||
                  motivo !== original.motivo,
              )
            }
          >
            Recargar datos del caso
          </button>
        </div>
      )}
      <label>
        Prioridad
        <select
          className="form-select form-select-sm"
          value={prioridad}
          disabled={guardando || cambioExterno || !datos.puedeGestionar}
          onChange={(e) => setPrioridad(e.target.value as typeof prioridad)}
        >
          <option value="NORMAL">Normal</option>
          <option value="URGENTE">Urgente</option>
        </select>
      </label>
      <label>
        Responsable
        <select
          className="form-select form-select-sm"
          value={responsable}
          disabled={guardando || cambioExterno || !datos.puedeAsignar}
          onChange={(e) => setResponsable(e.target.value)}
        >
          <option value="">Sin asignar</option>
          {datos.responsables.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Motivo o nota
        <textarea
          className="form-control form-control-sm"
          rows={3}
          maxLength={1200}
          value={motivo}
          disabled={guardando || cambioExterno || !datos.puedeGestionar}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-danger" role="alert">
          {error}
        </p>
      )}
      <div className={css.acciones}>
        <button
          type="submit"
          className="btn btn-sm btn-dark"
          disabled={guardando || cambioExterno || !datos.puedeGestionar}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={guardando || cambioExterno || !datos.puedeGestionar}
          onClick={() => void guardar('TOMAR')}
        >
          Tomar atención
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={guardando || !motivo.trim() || !datos.puedeGestionar}
          onClick={() => void guardar('ACTUALIZAR', false, true)}
        >
          Requiere atención
        </button>
      </div>
      {['PENDIENTE', 'MANUAL'].includes(datos.gestion.atencion) && (
        <div className={css.resolver}>
          <strong>Resolver atención</strong>
          <p className={css.muted}>Cerrá el caso cuando hayas respondido o resuelto el motivo.</p>
          <div className={css.acciones}>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={guardando || cambioExterno}
              onClick={() => void guardar('RESOLVER')}
            >
              Resolver y seguir manual
            </button>
            {datos.puedeReactivarBot && (
              <button
                type="button"
                className="btn btn-sm btn-success"
                disabled={guardando || cambioExterno}
                onClick={() => void guardar('RESOLVER', true)}
              >
                Resolver y reactivar bot
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
