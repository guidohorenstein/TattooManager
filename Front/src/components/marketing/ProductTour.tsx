'use client';
import { useEffect, useReducer, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { Brand } from '@/components/brand/Brand';
import {
  artists,
  demoMoney,
  demoReducer,
  initialDemo,
  slots,
  stageLabels,
  workImages,
  type DemoLead,
} from './demo-model';
import styles from './demo.module.css';
const views = [
  ['resumen', 'Resumen'],
  ['consultas', 'Consultas'],
  ['agenda', 'Agenda'],
  ['mensajes', 'Mensajes'],
  ['trabajos', 'Trabajos'],
  ['recordatorios', 'Recordatorios'],
] as const;
type View = (typeof views)[number][0];
const reminders = [
  ['turno', 'Antes del turno', '24 horas antes de la sesión.'],
  ['cuidados', 'Cuidados del tatuaje', '2 horas después de completar la sesión.'],
  ['resena', 'Pedido de reseña', '7 días después de la sesión.'],
  ['agenda', 'Mi agenda del día', 'Un resumen para el artista a las 08:00.'],
];
export function ProductTour() {
  const [state, dispatch] = useReducer(demoReducer, undefined, initialDemo);
  const [view, setView] = useState<View>('resumen');
  const [selected, setSelected] = useState('sofia');
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const chatLog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view === 'mensajes' && chatLog.current)
      chatLog.current.scrollTop = chatLog.current.scrollHeight;
  }, [view, selected, state.messages]);
  const lead = state.leads.find((l) => l.id === selected)!;
  const appointments = state.leads
    .filter((l) => l.stage === 'agendada')
    .sort(
      (a, b) => slots.findIndex((s) => s.id === a.slot) - slots.findIndex((s) => s.id === b.slot),
    );
  const pending = state.leads.filter((l) => l.stage !== 'agendada');
  function open(item: DemoLead, next: View = 'consultas') {
    setSelected(item.id);
    setView(next);
    setMessage('');
  }
  function quote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    dispatch({
      type: 'quote',
      id: lead.id,
      price: Number(data.get('price')),
      artist: String(data.get('artist')),
    });
  }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    dispatch({ type: 'message', id: lead.id, text: message });
    setMessage('');
  }
  const list = state.leads.filter((l) =>
    (l.name + ' ' + l.style).toLocaleLowerCase('es').includes(filter.toLocaleLowerCase('es')),
  );
  return (
    <div className={styles.demo} aria-label="Demo interactiva de TattooManager">
      <div className={styles.browserBar}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          Trazo Estudio <span className={styles.demoLabel}>/ Demo interactiva</span>
        </span>
        <button
          onClick={() => {
            dispatch({ type: 'reset' });
            setView('resumen');
            setSelected('sofia');
            setFilter('');
            setMessage('');
          }}
        >
          Reiniciar demo
        </button>
      </div>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.demoBrand}>
            <Brand compact />
            <span>
              Trazo Estudio<small>Tu espacio de trabajo</small>
            </span>
          </div>
          <nav aria-label="Secciones de la demo">
            {views.map(([id, title], i) => (
              <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>
                <span aria-hidden="true">{'0' + (i + 1)}</span>
                {title}
                {id === 'consultas' && <small>{pending.length}</small>}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarNote}>
            Un estudio de ejemplo.
            <br />
            Probá sin crear una cuenta.
          </div>
        </aside>
        <div className={styles.content}>
          <header className={styles.viewHeader}>
            <div>
              <p>NOVIEMBRE · TRAZO ESTUDIO</p>
              <h3>{views.find((v) => v[0] === view)![1]}</h3>
            </div>
            <span className={styles.avatar} title="Titular del estudio">
              TE
            </span>
          </header>
          {view === 'resumen' && (
            <div className={styles.enter}>
              <div className={styles.welcome}>
                <h4>Hay lugar para una nueva idea.</h4>
                <p>Revisá las consultas pendientes y organizá las próximas sesiones.</p>
              </div>
              <div className={styles.stats}>
                <div>
                  <span>Consultas por resolver</span>
                  <strong>{pending.length.toString().padStart(2, '0')}</strong>
                </div>
                <div>
                  <span>Turnos confirmados</span>
                  <strong>{appointments.length.toString().padStart(2, '0')}</strong>
                </div>
                <div>
                  <span>Trabajos publicados</span>
                  <strong>
                    {state.published.filter(Boolean).length.toString().padStart(2, '0')}
                  </strong>
                </div>
              </div>
              <div className={styles.overviewColumns}>
                <section>
                  <div className={styles.sectionTitle}>
                    <h4>Necesitan tu atención</h4>
                    <button onClick={() => setView('consultas')}>Ver consultas ↗</button>
                  </div>
                  {pending.length ? (
                    pending.map((l) => (
                      <button key={l.id} className={styles.leadRow} onClick={() => open(l)}>
                        <span className={styles.avatar}>{l.initials}</span>
                        <span>
                          <strong>{l.name}</strong>
                          <small>
                            {l.style} · {l.artist}
                          </small>
                        </span>
                        <span className={styles.badge}>{stageLabels[l.stage]}</span>
                      </button>
                    ))
                  ) : (
                    <p className={styles.empty}>
                      Todo organizado. Las consultas ya tienen su turno.
                    </p>
                  )}
                </section>
                <section>
                  <div className={styles.sectionTitle}>
                    <h4>Próximas sesiones</h4>
                    <button onClick={() => setView('agenda')}>Ver agenda ↗</button>
                  </div>
                  {appointments.map((l) => (
                    <button
                      key={l.id}
                      className={styles.appointmentRow}
                      onClick={() => open(l, 'agenda')}
                    >
                      <span>{slots.find((s) => s.id === l.slot)?.short}</span>
                      <strong>{l.name}</strong>
                      <small>{l.artist} · 2 horas</small>
                    </button>
                  ))}
                </section>
              </div>
              <button className={styles.guide} onClick={() => open(state.leads[0]!)}>
                <span>Empezá por la consulta de Sofía</span>
                <strong>
                  Idea → Propuesta → Turno <span aria-hidden="true">↗</span>
                </strong>
              </button>
            </div>
          )}
          {view === 'consultas' && (
            <div className={styles.split}>
              <aside className={styles.contactList}>
                <label className={styles.search}>
                  Buscar consulta
                  <input
                    type="search"
                    placeholder="Nombre o estilo"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </label>
                {list.map((l) => (
                  <button key={l.id} aria-pressed={selected === l.id} onClick={() => open(l)}>
                    <span className={styles.avatar}>{l.initials}</span>
                    <span>
                      <strong>{l.name}</strong>
                      <small>{stageLabels[l.stage]}</small>
                    </span>
                  </button>
                ))}
                {!list.length && <p className={styles.empty}>No hay consultas con esa búsqueda.</p>}
              </aside>
              <section className={styles.leadDetail} key={lead.id}>
                <div className={styles.detailTop}>
                  <span className={styles.badge}>{stageLabels[lead.stage]}</span>
                  <span>Formulario web</span>
                </div>
                <h4>{lead.name}</h4>
                <p className={styles.meta}>
                  {lead.area} · {lead.style}
                </p>
                <div className={styles.idea}>
                  <Image
                    src={workImages[state.leads.indexOf(lead)]!}
                    alt={'Referencia de ' + lead.style}
                    width={100}
                    height={120}
                    sizes="100px"
                  />
                  <div>
                    <h5>La idea</h5>
                    <p>{lead.idea}</p>
                  </div>
                </div>
                {lead.stage === 'nueva' ? (
                  <form className={styles.quoteForm} onSubmit={quote}>
                    <h5>Preparar propuesta</h5>
                    <label>
                      Artista
                      <select name="artist" defaultValue={lead.artist}>
                        {artists.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Importe en ARS
                      <input
                        name="price"
                        type="number"
                        defaultValue={lead.price}
                        required
                        min={1000}
                        max={10000000}
                        step={1}
                      />
                    </label>
                    <p>Diseño personalizado y una sesión de 2 horas.</p>
                    <button className={styles.action} type="submit">
                      Enviar propuesta ↗
                    </button>
                  </form>
                ) : (
                  <div className={styles.proposal}>
                    <h5>Propuesta de {lead.artist}</h5>
                    <strong>{demoMoney(lead.price)}</strong>
                    <p>Diseño personalizado y una sesión de 2 horas.</p>
                    {lead.stage === 'propuesta' && (
                      <>
                        <button
                          className={styles.action}
                          onClick={() => dispatch({ type: 'accept', id: lead.id })}
                        >
                          Simular elección del cliente
                        </button>
                        <small>Esta acción representa la respuesta del cliente en el chat.</small>
                      </>
                    )}
                    {lead.stage === 'aceptada' && (
                      <button className={styles.action} onClick={() => setView('agenda')}>
                        Elegir horario ↗
                      </button>
                    )}
                    {lead.stage === 'agendada' && (
                      <p className={styles.confirmed}>
                        Confirmado · {slots.find((s) => s.id === lead.slot)?.short}
                      </p>
                    )}
                  </div>
                )}
                <button className={styles.textButton} onClick={() => setView('mensajes')}>
                  Abrir conversación con {lead.name.split(' ')[0]} ↗
                </button>
              </section>
            </div>
          )}
          {view === 'agenda' && (
            <div className={styles.enter}>
              <div className={styles.agendaTop}>
                <p>Sesiones de 2 horas. Los horarios ocupados se bloquean por artista.</p>
                <label>
                  Consulta
                  <select
                    aria-label="Consulta para agendar"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {state.leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} · {stageLabels[l.stage]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {lead.stage === 'nueva' || lead.stage === 'propuesta' ? (
                <div className={styles.guide}>
                  <span>Primero hace falta la elección del cliente.</span>
                  <button className={styles.textButton} onClick={() => setView('consultas')}>
                    Ver propuesta ↗
                  </button>
                </div>
              ) : (
                <p className={styles.meta}>
                  {lead.name} · {lead.artist}
                  {lead.stage === 'agendada'
                    ? ' · Turno confirmado'
                    : ' · Elegí un horario disponible'}
                </p>
              )}
              <div className={styles.calendar}>
                {['Viernes 27 nov.', 'Sábado 28 nov.'].map((day) => (
                  <section key={day}>
                    <h4>{day}</h4>
                    {slots
                      .filter((s) => s.day === day)
                      .map((slot) => {
                        const booked = state.leads.find(
                          (l) => l.slot === slot.id && l.artist === lead.artist,
                        );
                        return (
                          <div className={styles.slot} key={slot.id}>
                            <strong>{slot.time}</strong>
                            {booked ? (
                              <div>
                                <span>{booked.name}</span>
                                <small>
                                  {booked.artist} · {booked.style}
                                </small>
                              </div>
                            ) : (
                              <button
                                disabled={lead.stage !== 'aceptada'}
                                onClick={() =>
                                  dispatch({ type: 'book', id: lead.id, slot: slot.id })
                                }
                              >
                                Reservar {slot.time}
                                <span>Disponible · {lead.artist.split(' ')[0]}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </section>
                ))}
              </div>
            </div>
          )}
          {view === 'mensajes' && (
            <div className={styles.split}>
              <aside className={styles.contactList}>
                {state.leads.map((l) => (
                  <button
                    aria-pressed={selected === l.id}
                    key={l.id}
                    onClick={() => open(l, 'mensajes')}
                  >
                    <span className={styles.avatar}>{l.initials}</span>
                    <span>
                      <strong>{l.name}</strong>
                      <small>{l.style}</small>
                    </span>
                  </button>
                ))}
              </aside>
              <section className={styles.chat}>
                <header>
                  <strong>{lead.name}</strong>
                  <span>Consulta · {lead.style}</span>
                </header>
                <div
                  className={styles.messages}
                  ref={chatLog}
                  role="log"
                  aria-label={'Conversación con ' + lead.name}
                >
                  {state.messages[lead.id]?.map((m) => (
                    <div key={m.id} className={styles.bubble} data-from={m.from}>
                      <small>
                        {m.from === 'cliente' ? lead.name.split(' ')[0] : 'Trazo Estudio'}
                      </small>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={send}>
                  <label className={styles.srOnly} htmlFor="demo-message">
                    Mensaje de ejemplo
                  </label>
                  <input
                    id="demo-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1000}
                    placeholder="Escribí un mensaje de ejemplo…"
                  />
                  <button className={styles.action} disabled={!message.trim()} type="submit">
                    Enviar
                  </button>
                </form>
                <p className={styles.chatNotice}>
                  Conversación de ejemplo. No se envían mensajes a redes sociales.
                </p>
              </section>
            </div>
          )}
          {view === 'trabajos' && (
            <div className={styles.enter}>
              <p className={styles.meta}>
                Publicá un trabajo o guardalo como borrador. La página del estudio muestra los
                publicados.
              </p>
              <div className={styles.works}>
                {workImages.map((src, i) => (
                  <article key={src}>
                    <Image
                      src={src}
                      alt={'Tatuaje de estilo ' + ['Ornamental', 'Blackwork', 'Fine Line'][i]}
                      width={400}
                      height={430}
                      sizes="(max-width:760px) 40vw,250px"
                    />
                    <div>
                      <span className={styles.badge}>
                        {state.published[i] ? 'Publicado' : 'Borrador'}
                      </span>
                      <h4>{['Ornamental', 'Blackwork', 'Fine Line'][i]}</h4>
                      <p>{artists[i === 1 ? 1 : 0]}</p>
                      <button
                        className={styles.textButton}
                        onClick={() => dispatch({ type: 'publish', index: i })}
                      >
                        {state.published[i] ? 'Guardar borrador' : 'Publicar trabajo'} ↗
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
          {view === 'recordatorios' && (
            <div className={styles.enter}>
              <div className={styles.welcome}>
                <h4>El seguimiento también se organiza.</h4>
                <p>Elegí qué correos reciben tus clientes y cuáles querés recibir vos.</p>
              </div>
              <div className={styles.reminders}>
                {reminders.map(([id, title, description]) => (
                  <label key={id} className={styles.reminder}>
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={state.reminders[id!]}
                      onChange={() => dispatch({ type: 'reminder', id: id! })}
                    />
                    <span className={styles.switch} aria-hidden="true" />
                  </label>
                ))}
              </div>
              <p className={styles.meta}>
                En esta demo, los cambios solo modifican este espacio. No se envían correos.
              </p>
            </div>
          )}
          <p role="status" className={styles.feedback}>
            {state.feedback || 'Demo con datos de ejemplo. Tus cambios se reinician al recargar.'}
          </p>
        </div>
      </div>
    </div>
  );
}
