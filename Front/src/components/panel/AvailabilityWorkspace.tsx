'use client';
import { notificar } from '@/lib/notificar';
import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '@/store/AuthProvider';
import { useConsultas } from '@/hooks/useConsultas';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';
import { usePanelFilters } from '@/hooks/usePanelFilters';
import { useDiscardChanges } from '@/components/forms/UnsavedChanges';
import { PageHeader, EmptyState, Avatar, PanelIcon } from './PanelUI';
import { PanelForm, PanelSubmitButton } from './PanelForm';
import { WeeklyHoursEditor } from './WeeklyHoursEditor';
import { AvailabilityBlockForm } from './AvailabilityBlocks';
import { quitarBloqueo } from '@/services/disponibilidad.service';
import { mostrarFecha } from '@/lib/panel-artista';
import type { DisponibilidadAgenda, BloqueoAgenda } from '@/types/disponibilidad';
import styles from './workspace.module.css';
import horario from './availability.module.css';
export function AvailabilityWorkspace() {
  return (
    <Suspense fallback={<p role="status">Cargando disponibilidad…</p>}>
      <Availability />
    </Suspense>
  );
}
function Availability() {
  const { usuario } = useAuth(),
    consultas = useConsultas(),
    { params, update } = usePanelFilters(),
    descartar = useDiscardChanges();
  const fuente = consultas.datos,
    titular = usuario?.rol === 'ESTUDIO_ADMIN',
    base = titular ? '/estudio' : '/artista';
  const equipo = fuente?.equipo || [];
  const artistaId = titular
    ? params.get('artista') || equipo.find((a) => a.estado === 'ACTIVO')?.id || equipo[0]?.id || ''
    : usuario?.id || '';
  const gestion = useDisponibilidad(artistaId),
    datos = gestion.datos;
  const [revision, setRevision] = useState(0),
    [pasados, setPasados] = useState(false),
    [tab, setTab] = useState<'weekly' | 'blocks'>('weekly');
  const [editor, setEditor] = useState<BloqueoAgenda | 'NUEVO' | null>(null),
    [eliminar, setEliminar] = useState<BloqueoAgenda | null>(null);
  const quitado = useRef<DisponibilidadAgenda | null>(null);
  function aplicar(d: DisponibilidadAgenda, mensaje: string) {
    gestion.aplicar(d);
    setRevision((r) => r + 1);
    notificar.exito(mensaje);
    setEditor(null);
    setEliminar(null);
    void consultas.recargar();
  }
  function actualizar() {
    descartar(() => {
      setRevision((r) => r + 1);
      void gestion.recargar().then((d) => {
        if (d) {
          setRevision((r) => r + 1);
          notificar.exito('Disponibilidad actualizada.');
        }
      });
    });
  }
  function elegir(id: string) {
    if (id === artistaId) return;
    descartar(() => {
      setEditor(null);
      setEliminar(null);
      setTab('weekly');
      update({ artista: id });
    });
  }
  function abrirEditor(bloqueo: BloqueoAgenda | 'NUEVO') {
    descartar(() => {
      setRevision((r) => r + 1);
      setEditor(bloqueo);
    });
  }
  function confirmarQuitar(bloqueo: BloqueoAgenda) {
    descartar(() => {
      setRevision((r) => r + 1);
      setEliminar(bloqueo);
    });
  }
  const bloques = (
    datos?.bloqueos.filter((b) => pasados || new Date(b.finAt).getTime() > gestion.ahora) || []
  ).sort((a, b) => a.inicioAt.localeCompare(b.inicioAt));
  const dias = datos?.semana?.filter((d) => d.rangos.length).length || 0,
    listo = Boolean(datos?.semana && dias);
  const zona = datos?.zonaHoraria.split('/').at(-1)?.replaceAll('_', ' ') || '';
  return (
    <>
      <PageHeader
        titulo="Disponibilidad"
        descripcion="Tus horarios habituales y las excepciones de tu agenda."
      >
        <Link
          className={styles.secondaryButton}
          href={base + '/agenda' + (titular && artistaId ? '?artista=' + artistaId : '')}
        >
          <PanelIcon nombre="agenda" size={17} /> Ver agenda
        </Link>
      </PageHeader>
      {gestion.error && (
        <p className={styles.error} role="alert">
          {gestion.error}{' '}
          <button className={styles.textButton} onClick={actualizar}>
            Reintentar
          </button>
        </p>
      )}
      {titular && !fuente ? (
        consultas.cargando ? (
          <p role="status">Cargando equipo…</p>
        ) : (
          <p role="alert">
            {consultas.error || 'No pudimos cargar el equipo.'}{' '}
            <button className={styles.textButton} onClick={() => void consultas.recargar()}>
              Reintentar
            </button>
          </p>
        )
      ) : !artistaId ? (
        <EmptyState
          titulo={
            titular ? 'Agregá un artista para configurar su agenda' : 'Cargando disponibilidad…'
          }
        />
      ) : (
        <div className={titular ? horario.workspace : horario.solo}>
          {titular && (
            <aside className={horario.roster} aria-label="Artistas del estudio">
              <h2>Equipo</h2>
              <label className={horario.mobilePicker}>
                Artista
                <select
                  className="form-select"
                  value={artistaId}
                  onChange={(e) => elegir(e.target.value)}
                >
                  {equipo.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                      {a.estado === 'SUSPENDIDO' ? ' · suspendido' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <div className={horario.rosterList}>
                {equipo.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    className={horario.rosterItem}
                    aria-pressed={a.id === artistaId}
                    onClick={() => elegir(a.id)}
                  >
                    <Avatar nombre={a.nombre} />
                    <span>
                      <strong>{a.nombre}</strong>
                      <small
                        data-warning={
                          a.estado === 'ACTIVO' &&
                          (a.estadoAgenda === 'SIN_CONFIGURAR' || a.estadoAgenda === 'CERRADA')
                        }
                      >
                        {a.estado === 'SUSPENDIDO'
                          ? 'Suspendido'
                          : a.estadoAgenda === 'SIN_CONFIGURAR'
                            ? 'Faltan horarios'
                            : a.estadoAgenda === 'CERRADA'
                              ? 'Sin días de atención'
                              : a.estadoAgenda === 'LISTA'
                                ? 'Agenda configurada'
                                : 'Horarios y bloqueos'}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          )}
          <div className={horario.editorArea}>
            {gestion.cargando ? (
              <div className={horario.loading} role="status" aria-busy="true">
                <div />
                <div />
                <div />
                <span>Cargando horarios…</span>
              </div>
            ) : (
              datos && (
                <>
                  <div className={horario.artistHeader}>
                    <Avatar nombre={datos.artista.nombre} />
                    <div>
                      <h2>{datos.artista.nombre}</h2>
                      <p>
                        <PanelIcon nombre="reloj" size={14} />
                        {zona} · hora local
                      </p>
                    </div>
                    <span className={listo ? horario.readyStatus : horario.pendingStatus}>
                      {listo
                        ? 'Agenda configurada'
                        : datos.semana
                          ? 'Sin atención'
                          : 'Configuración pendiente'}
                    </span>
                  </div>
                  {!listo && (
                    <div className={horario.setupNotice}>
                      <span className={horario.noticeIcon}>
                        <PanelIcon nombre="reloj" size={19} />
                      </span>
                      <div>
                        <strong>
                          {datos.semana
                            ? 'Habilitá al menos un día de atención'
                            : 'Definí el horario de este artista'}
                        </strong>
                        <p>Guardá los días y horarios para habilitar la reserva de turnos.</p>
                      </div>
                    </div>
                  )}
                  {!datos.puedeEditar && (
                    <p className={styles.notice}>
                      Tu disponibilidad es de solo lectura mientras estés suspendido.
                    </p>
                  )}
                  <div
                    className={horario.tabs}
                    role="group"
                    aria-label="Configuración de disponibilidad"
                  >
                    <button
                      type="button"
                      aria-pressed={tab === 'weekly'}
                      onClick={() => {
                        if (tab !== 'weekly') descartar(() => setTab('weekly'));
                      }}
                    >
                      Horario semanal
                    </button>
                    <button
                      type="button"
                      aria-pressed={tab === 'blocks'}
                      onClick={() => {
                        if (tab !== 'blocks') descartar(() => setTab('blocks'));
                      }}
                    >
                      Ausencias y bloqueos{' '}
                      <span>
                        {
                          datos.bloqueos.filter((b) => new Date(b.finAt).getTime() > gestion.ahora)
                            .length
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      className={horario.refreshButton}
                      aria-label="Actualizar disponibilidad"
                      onClick={actualizar}
                    >
                      <PanelIcon nombre="actualizar" size={16} />
                    </button>
                  </div>
                  {tab === 'weekly' ? (
                    <WeeklyHoursEditor
                      key={artistaId + ':' + revision}
                      datos={datos}
                      onReload={actualizar}
                      onSaved={(d) => aplicar(d, 'Horarios guardados.')}
                    />
                  ) : (
                    <section className={horario.blocksSection} aria-labelledby="blocks-heading">
                      <div className={horario.sectionHeading}>
                        <div>
                          <h2 id="blocks-heading">Ausencias y bloqueos</h2>
                          <p>Reservá tiempo para vacaciones, pausas o trabajo personal.</p>
                        </div>
                        {datos.puedeEditar && (
                          <button className={styles.button} onClick={() => abrirEditor('NUEVO')}>
                            <PanelIcon nombre="mas" size={17} /> Nuevo bloqueo
                          </button>
                        )}
                      </div>
                      <label className={horario.pastToggle}>
                        <input
                          type="checkbox"
                          checked={pasados}
                          onChange={(e) => setPasados(e.target.checked)}
                        />{' '}
                        Mostrar períodos pasados
                      </label>
                      {bloques.length ? (
                        <div className={horario.blockList}>
                          {bloques.map((b) => (
                            <article className={horario.blockRow} key={b.id}>
                              <div className={horario.blockDate}>
                                <span>{mostrarFecha(b.desdeFecha, { month: 'short' })}</span>
                                <strong>{mostrarFecha(b.desdeFecha, { day: '2-digit' })}</strong>
                              </div>
                              <div className={horario.blockDetails}>
                                <strong>{b.motivo}</strong>
                                <p>
                                  {mostrarFecha(b.desdeFecha, {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                  {b.desdeFecha !== b.hastaFecha
                                    ? ' — ' +
                                      mostrarFecha(b.hastaFecha, { day: 'numeric', month: 'short' })
                                    : ''}{' '}
                                  ·{' '}
                                  {b.diaCompleto
                                    ? 'Día' +
                                      (b.desdeFecha !== b.hastaFecha ? 's completos' : ' completo')
                                    : b.desdeHora + '–' + b.hastaHora}
                                </p>
                                <span>
                                  {new Date(b.finAt).getTime() < gestion.ahora
                                    ? 'Finalizado'
                                    : new Date(b.inicioAt).getTime() <= gestion.ahora
                                      ? 'En curso'
                                      : 'Programado'}
                                </span>
                              </div>
                              {datos.puedeEditar && (
                                <div className={horario.blockActions}>
                                  <button
                                    className={styles.textButton}
                                    onClick={() => abrirEditor(b)}
                                    aria-label={'Editar ' + b.motivo}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className={horario.removeButton}
                                    onClick={() => confirmarQuitar(b)}
                                    aria-label={'Quitar ' + b.motivo}
                                  >
                                    Quitar
                                  </button>
                                </div>
                              )}
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className={horario.blockEmpty}>
                          <PanelIcon nombre="agenda" size={28} />
                          <h3>No hay ausencias programadas</h3>
                          <p>Los días habituales quedan disponibles para recibir turnos.</p>
                          {datos.puedeEditar && (
                            <button
                              className={styles.secondaryButton}
                              onClick={() => abrirEditor('NUEVO')}
                            >
                              Bloquear un período
                            </button>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                </>
              )
            )}
          </div>
        </div>
      )}
      <Modal
        show={Boolean(editor)}
        aria-labelledby="availability-block-title"
        centered
        scrollable
        fullscreen="sm-down"
        onHide={() => descartar(() => setEditor(null))}
      >
        <Modal.Header closeButton closeLabel="Cerrar">
          <Modal.Title as="h2" id="availability-block-title" className="fs-5">
            {editor === 'NUEVO' ? 'Nuevo bloqueo' : 'Editar bloqueo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editor && datos && (
            <AvailabilityBlockForm
              datos={datos}
              bloqueo={editor === 'NUEVO' ? undefined : editor}
              onCancel={() => descartar(() => setEditor(null))}
              onSaved={(d) => aplicar(d, 'Bloqueo guardado.')}
            />
          )}
        </Modal.Body>
      </Modal>
      <Modal
        show={Boolean(eliminar)}
        aria-labelledby="availability-remove-title"
        centered
        onHide={() => setEliminar(null)}
      >
        <Modal.Header closeButton closeLabel="Cerrar">
          <Modal.Title as="h2" id="availability-remove-title" className="fs-5">
            Quitar bloqueo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {eliminar && datos && (
            <PanelForm
              initialValues={{ version: datos.version }}
              validate={() => ({})}
              onSave={async (v) => {
                quitado.current = await quitarBloqueo(artistaId, eliminar.id, v.version);
              }}
              onSaved={() => {
                if (quitado.current) aplicar(quitado.current, 'Bloqueo quitado.');
              }}
            >
              <p>
                Se quitará «{eliminar.motivo}». Ese período volverá a estar disponible según los
                horarios de atención.
              </p>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setEliminar(null)}
                >
                  Volver
                </button>
                <PanelSubmitButton pendingText="Quitando…">Quitar bloqueo</PanelSubmitButton>
              </div>
            </PanelForm>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
