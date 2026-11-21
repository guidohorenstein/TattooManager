'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePanelData } from '@/hooks/usePanelData';
import type { PrecioPlan } from '@/types/plan';
import styles from './marketing.module.css';
const planes = [
  {
    id: 'INDIVIDUAL',
    titulo: 'Individual',
    descripcion: 'Tu negocio, a tu manera.',
    caracteristicas: [
      'Tu página pública y portafolio',
      'Consultas y presupuestos propios',
      'Agenda, disponibilidad y clientes',
      'Mensajes y asistente configurable',
      'Recordatorios y estadísticas',
    ],
  },
  {
    id: 'ESTUDIO',
    titulo: 'Estudio',
    descripcion: 'Un lugar para todo el equipo.',
    caracteristicas: [
      'Todas las herramientas de Individual',
      'Página del estudio con sus artistas',
      'Invitación y gestión del equipo',
      'Propuestas de distintos artistas',
      'Asignación de consultas y agenda compartida',
      'Resultados generales y por artista',
    ],
  },
] as const;
export function Pricing() {
  const [anual, setAnual] = useState(false);
  const { datos, error, recargar } = usePanelData<{ plans: PrecioPlan[] }>('/pagos/planes');
  return (
    <section id="planes" className={`${styles.section} ${styles.pricing}`}>
      <header className={styles.sectionHead}>
        <h2>El espacio que tu trabajo necesita.</h2>
        <p>
          Elegí según tu forma de trabajar. Los artistas de un estudio acceden con el plan de su
          equipo.
        </p>
      </header>
      <div className={styles.billing} role="group" aria-label="Periodicidad de la suscripción">
        <button aria-pressed={!anual} onClick={() => setAnual(false)}>
          Mensual
        </button>
        <button aria-pressed={anual} onClick={() => setAnual(true)}>
          Anual
        </button>
      </div>
      {error && (
        <p role="alert">
          No pudimos cargar los precios. <button onClick={() => void recargar()}>Reintentar</button>
        </p>
      )}
      <div className={styles.plans}>
        {planes.map((p) => {
          const precio = datos?.plans.find((v) => v.id === p.id);
          const monto = precio ? (anual ? precio.anual : precio.mensual) : null;
          return (
            <article className={styles.plan} key={p.id}>
              <p className={styles.planAudience}>
                {p.id === 'INDIVIDUAL'
                  ? 'Para artistas independientes'
                  : 'Para titulares y equipos'}
              </p>
              <h3>{p.titulo}</h3>
              <p>{p.descripcion}</p>
              <div className={styles.price}>
                {monto !== null ? (
                  <>
                    <strong>
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: precio!.moneda,
                        maximumFractionDigits: 0,
                      }).format(monto)}
                    </strong>
                    <span>
                      {precio!.moneda} / {anual ? 'año' : 'mes'}
                    </span>
                  </>
                ) : (
                  <span>{error ? 'Precio no disponible' : 'Consultando precio…'}</span>
                )}
              </div>
              <Link
                className={p.id === 'ESTUDIO' ? styles.primary : styles.secondary}
                href={'/checkout?plan=' + p.id + '&cycle=' + (anual ? 'ANUAL' : 'MENSUAL')}
              >
                Elegir {p.titulo} <span aria-hidden="true">↗</span>
              </Link>
              <ul>
                {p.caracteristicas.map((c) => (
                  <li key={c}>
                    <span aria-hidden="true">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
              {anual && precio && precio.anual < precio.mensual * 12 && (
                <p className={styles.planSaving}>
                  El pago anual incluye un ahorro frente a 12 meses por separado.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
