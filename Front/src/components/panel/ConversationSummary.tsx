'use client';
import type { ContextoChat, PuntoResumenChat } from '@/types/gestion-conversaciones';
import css from './conversation-context.module.css';
export function ConversationSummary({
  datos,
  fecha,
}: {
  datos: ContextoChat;
  fecha: (v: string) => string;
}) {
  const dialogo = datos.resumen?.conversacion;
  const grupos: [string, PuntoResumenChat[]][] = dialogo
    ? [
        ['Preferencias', dialogo.preferencias],
        ['Dudas pendientes', dialogo.preguntasPendientes],
        ['Acuerdos en el chat', dialogo.acuerdos],
      ]
    : [];
  return (
    <section className={css.seccion} aria-labelledby="resumen-chat-titulo">
      <h3 id="resumen-chat-titulo">Resumen de la conversación</h3>
      <small className={css.muted} role="status">
        {datos.resumenPendiente
          ? 'Actualizando…'
          : datos.resumenActualizadoAt
            ? 'Actualizado ' + fecha(datos.resumenActualizadoAt)
            : 'Pendiente de actualización'}
      </small>
      {grupos.some(([, puntos]) => puntos.length) ? (
        grupos.map(
          ([titulo, puntos]) =>
            puntos.length > 0 && (
              <div className={css.grupoResumen} key={titulo}>
                <h4>{titulo}</h4>
                <ul>
                  {puntos.map((p, i) => (
                    <li key={p.texto + i}>
                      <p>{p.texto}</p>
                      <details className={css.evidencias}>
                        <summary>Ver mensajes</summary>
                        {p.evidencias.map((e) => (
                          <blockquote key={e.id}>
                            <small>
                              {e.propio ? 'Equipo' : 'Cliente'} · {fecha(e.fecha)}
                            </small>
                            <p>{e.texto}</p>
                          </blockquote>
                        ))}
                      </details>
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )
      ) : (
        <p>
          {datos.resumenPendiente
            ? 'Preparando el resumen del chat…'
            : 'Sin preferencias, dudas o acuerdos registrados todavía.'}
        </p>
      )}
      {datos.errorResumen && (
        <p className={css.muted}>
          No pudimos actualizar lo conversado. Conservamos la última versión disponible.
        </p>
      )}
      {Boolean(dialogo?.omitidos) && (
        <small className={css.muted}>
          Algunos mensajes se omitieron por privacidad o por su formato.
        </small>
      )}
      <div className={css.estadoResumen}>
        <h4>Estado confirmado en el sistema</h4>
        <p>{datos.resumen?.resumen || 'Sin consulta registrada.'}</p>
        {datos.resumen && (
          <>
            <strong>Próximo paso</strong>
            <p>{datos.resumen.proximoPaso}</p>
          </>
        )}
      </div>
    </section>
  );
}
