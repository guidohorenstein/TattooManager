'use client';
import { useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Dropdown from 'react-bootstrap/Dropdown';
import { PanelForm, PanelSubmitButton } from './PanelForm';
import { PanelIcon } from './PanelUI';
import { guardarHorario } from '@/services/disponibilidad.service';
import { diasSemana, semanaInicial, erroresSemana, minutos } from '@/lib/disponibilidad';
import type { DisponibilidadAgenda, SemanaDisponible } from '@/types/disponibilidad';
import styles from './workspace.module.css';
import horario from './availability.module.css';
interface Valores {
  semana: SemanaDisponible;
  version: number;
}
export function WeeklyHoursEditor({
  datos,
  onSaved,
  onReload,
}: {
  datos: DisponibilidadAgenda;
  onSaved: (d: DisponibilidadAgenda) => void;
  onReload: () => void;
}) {
  const guardada = useRef<DisponibilidadAgenda | null>(null);
  return (
    <section className={horario.weekSection} aria-labelledby="week-heading">
      <PanelForm<Valores>
        initialValues={{ semana: datos.semana || semanaInicial(), version: datos.version }}
        validate={(v) =>
          Object.keys(erroresSemana(v.semana)).length
            ? { semana: 'Revisá los horarios marcados.' }
            : {}
        }
        onSave={async (v) => {
          guardada.current = await guardarHorario(datos.artista.id, v.semana, v.version);
        }}
        onSaved={() => {
          if (guardada.current) onSaved(guardada.current);
        }}
      >
        <WeekFields
          editable={datos.puedeEditar}
          versionActual={datos.version}
          configurada={Boolean(datos.semana)}
          onReload={onReload}
        />
      </PanelForm>
    </section>
  );
}
function WeekFields({
  editable,
  versionActual,
  configurada,
  onReload,
}: {
  editable: boolean;
  versionActual: number;
  configurada: boolean;
  onReload: () => void;
}) {
  const { values, setFieldValue, resetForm, dirty, submitCount, isSubmitting, touched } =
    useFormikContext<Valores>();
  const rangosPrevios = useRef<Record<number, SemanaDisponible[number]['rangos']>>({});
  const [copiando, setCopiando] = useState<number | null>(null);
  const [destinos, setDestinos] = useState<number[]>([]);
  const errores = erroresSemana(values.semana),
    desactualizado = values.version !== versionActual;
  const dias = values.semana.filter((d) => d.rangos.length).length;
  const total = values.semana.reduce(
    (s, d) =>
      s + d.rangos.reduce((n, r) => n + Math.max(0, minutos(r.hasta) - minutos(r.desde)), 0),
    0,
  );
  function copiar(dia: number) {
    setCopiando(dia);
    setDestinos(
      values.semana.filter((d) => d.dia !== dia && d.rangos.length > 0).map((d) => d.dia),
    );
  }
  function aplicarCopia() {
    const origen = values.semana.find((d) => d.dia === copiando)!;
    void setFieldValue(
      'semana',
      values.semana.map((d) =>
        destinos.includes(d.dia) ? { ...d, rangos: origen.rangos.map((r) => ({ ...r })) } : d,
      ),
    );
    setCopiando(null);
  }
  function plantilla(sabados: boolean) {
    void setFieldValue(
      'semana',
      values.semana.map((d) => ({
        ...d,
        rangos:
          d.dia <= (sabados ? 6 : 5)
            ? [{ desde: sabados ? '10:00' : '09:00', hasta: sabados ? '19:00' : '18:00' }]
            : [],
      })),
    );
  }
  return (
    <>
      <div className={horario.sectionHeading}>
        <div>
          <h2 id="week-heading">Horario semanal</h2>
          <p>Elegí los días de atención y uno o más horarios por día.</p>
        </div>
        {editable && (
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              Usar plantilla
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => plantilla(false)}>
                Lunes a viernes · 09:00–18:00
              </Dropdown.Item>
              <Dropdown.Item onClick={() => plantilla(true)}>
                Lunes a sábado · 10:00–19:00
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
      {desactualizado && (
        <div className={horario.setupNotice}>
          <div>
            <strong>Hay una versión más reciente</strong>
            <p>Actualizá antes de guardar tus cambios.</p>
          </div>
          <button type="button" className={styles.textButton} onClick={onReload}>
            Actualizar horarios
          </button>
        </div>
      )}
      <div className={horario.weekLayout}>
        <fieldset disabled={!editable || isSubmitting} className={horario.weekRows}>
          {values.semana.map((dia, i) => {
            const nombre = diasSemana[dia.dia - 1]!,
              activo = dia.rangos.length > 0;
            const error = submitCount || touched.semana ? errores[String(dia.dia)] : '';
            const fin = dia.rangos.at(-1)?.hasta;
            return (
              <fieldset
                key={dia.dia}
                className={horario.day}
                data-active={activo}
                aria-label={nombre}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? `day-error-${dia.dia}` : undefined}
                tabIndex={-1}
              >
                <div className={horario.dayHeading}>
                  <Form.Check
                    type="switch"
                    role="switch"
                    id={`working-day-${dia.dia}`}
                    label={nombre}
                    checked={activo}
                    onChange={(e) => {
                      if (!e.target.checked)
                        rangosPrevios.current[dia.dia] = dia.rangos.map((r) => ({ ...r }));
                      void setFieldValue(
                        `semana.${i}.rangos`,
                        e.target.checked
                          ? rangosPrevios.current[dia.dia] || [{ desde: '09:00', hasta: '18:00' }]
                          : [],
                      );
                    }}
                  />
                </div>
                <div className={horario.ranges}>
                  {!activo ? (
                    <span className={horario.closed}>Sin atención</span>
                  ) : (
                    dia.rangos.map((r, j) => (
                      <div className={horario.range} key={j}>
                        <label>
                          <span>Desde</span>
                          <Form.Control
                            type="time"
                            aria-label={`Desde ${nombre}, rango ${j + 1}`}
                            value={r.desde}
                            aria-invalid={Boolean(error) || undefined}
                            onChange={(e) => {
                              void setFieldValue(`semana.${i}.rangos.${j}.desde`, e.target.value);
                            }}
                          />
                        </label>
                        <span className={horario.rangeSeparator} aria-hidden="true">
                          —
                        </span>
                        <label>
                          <span>Hasta</span>
                          <Form.Control
                            type="time"
                            aria-label={`Hasta ${nombre}, rango ${j + 1}`}
                            value={r.hasta === '24:00' ? '00:00' : r.hasta}
                            aria-invalid={Boolean(error) || undefined}
                            onChange={(e) => {
                              void setFieldValue(
                                `semana.${i}.rangos.${j}.hasta`,
                                e.target.value === '00:00' ? '24:00' : e.target.value,
                              );
                            }}
                          />
                          {r.hasta === '24:00' && <small>Medianoche</small>}
                        </label>
                        <button
                          type="button"
                          className={horario.iconButton}
                          aria-label={`Quitar rango ${j + 1} de ${nombre}`}
                          title="Quitar horario"
                          onClick={() => {
                            void setFieldValue(
                              `semana.${i}.rangos`,
                              dia.rangos.filter((_, n) => n !== j),
                            );
                          }}
                        >
                          <PanelIcon nombre="cerrar" size={16} />
                        </button>
                      </div>
                    ))
                  )}
                  {error && (
                    <p id={`day-error-${dia.dia}`} className={horario.fieldError} role="alert">
                      {error}
                    </p>
                  )}
                </div>
                {activo && (
                  <div className={horario.dayActions}>
                    <button
                      type="button"
                      className={horario.iconButton}
                      aria-label={`Agregar horario a ${nombre.toLowerCase()}`}
                      title="Agregar horario"
                      disabled={dia.rangos.length >= 8 || !fin || minutos(fin) >= 1440}
                      onClick={() => {
                        const inicio = fin!,
                          hasta = Math.min(1440, minutos(inicio) + 60);
                        void setFieldValue(`semana.${i}.rangos`, [
                          ...dia.rangos,
                          {
                            desde: inicio,
                            hasta:
                              hasta === 1440
                                ? '24:00'
                                : `${String(Math.floor(hasta / 60)).padStart(2, '0')}:${String(hasta % 60).padStart(2, '0')}`,
                          },
                        ]);
                      }}
                    >
                      <PanelIcon nombre="mas" size={17} />
                    </button>
                    <button
                      type="button"
                      className={horario.copyButton}
                      aria-label={`Copiar horarios de ${nombre}`}
                      disabled={Boolean(errores[String(dia.dia)])}
                      onClick={() => copiar(dia.dia)}
                    >
                      Copiar
                    </button>
                  </div>
                )}
              </fieldset>
            );
          })}
        </fieldset>
        <aside className={horario.weekPreview} aria-label="Vista previa de la semana">
          <div className={horario.previewTitle}>
            <PanelIcon nombre="reloj" size={17} />
            <span>Tu semana</span>
          </div>
          <div className={horario.weekTotals}>
            <strong>
              {Math.floor(total / 60)}
              <span>h {total % 60 ? `${total % 60} min` : ''}</span>
            </strong>
            <span>
              {dias} {dias === 1 ? 'día' : 'días'} de atención
            </span>
          </div>
          <div className={horario.axis}>
            <span>00</span>
            <span>12</span>
            <span>24</span>
          </div>
          {values.semana.map((d) => (
            <div className={horario.previewDay} key={d.dia}>
              <span>{diasSemana[d.dia - 1]!.slice(0, 3)}</span>
              <div
                className={horario.track}
                aria-label={`${diasSemana[d.dia - 1]}: ${d.rangos.length ? d.rangos.map((r) => r.desde + ' a ' + r.hasta).join(', ') : 'sin atención'}`}
              >
                {d.rangos
                  .filter((r) => minutos(r.hasta) > minutos(r.desde))
                  .map((r, j) => (
                    <i
                      key={j}
                      style={{
                        left: `${(minutos(r.desde) / 1440) * 100}%`,
                        width: `${((minutos(r.hasta) - minutos(r.desde)) / 1440) * 100}%`,
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
          <p className={horario.previewHint}>
            Los bloqueos y turnos ya reservados se descuentan de estos horarios.
          </p>
        </aside>
      </div>
      {editable && (
        <div className={horario.saveBar}>
          <span role="status">
            {dirty
              ? 'Cambios sin guardar'
              : configurada
                ? 'Todos los cambios guardados'
                : 'Horario sugerido · sin guardar'}
          </span>
          <div>
            {dirty && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => resetForm()}
                disabled={isSubmitting}
              >
                Descartar
              </button>
            )}
            <PanelSubmitButton
              disabled={(!dirty && configurada) || desactualizado}
              pendingText="Guardando…"
            >
              Guardar horarios
            </PanelSubmitButton>
          </div>
        </div>
      )}
      <Modal
        show={copiando !== null}
        centered
        aria-labelledby="copy-hours-title"
        onHide={() => setCopiando(null)}
      >
        <Modal.Header closeButton closeLabel="Cerrar">
          <Modal.Title as="h2" id="copy-hours-title" className="fs-5">
            Copiar horarios de {diasSemana[(copiando ?? 1) - 1]?.toLowerCase()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={horario.copyDescription}>
            Elegí a qué días aplicar estos horarios. Reemplazará sus rangos actuales.
          </p>
          <div className={horario.copyDays}>
            {diasSemana.map(
              (d, i) =>
                copiando !== i + 1 && (
                  <Form.Check
                    key={d}
                    id={`copy-day-${i + 1}`}
                    label={d}
                    checked={destinos.includes(i + 1)}
                    onChange={(e) =>
                      setDestinos((s) =>
                        e.target.checked ? [...s, i + 1] : s.filter((n) => n !== i + 1),
                      )
                    }
                  />
                ),
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setCopiando(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.button}
            disabled={!destinos.length}
            onClick={aplicarCopia}
          >
            Aplicar a {destinos.length} {destinos.length === 1 ? 'día' : 'días'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
