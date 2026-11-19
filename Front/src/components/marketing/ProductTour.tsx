'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './marketing.module.css';
const pantallas = [
  {
    id: 'resumen',
    titulo: 'Resumen',
    descripcion: 'Lo que necesita tu atención, al abrir el estudio.',
  },
  {
    id: 'consultas',
    titulo: 'Consultas',
    descripcion: 'Cada idea con sus referencias, propuestas y artista asignado.',
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    descripcion: 'Un lugar para coordinar el trabajo de todo el equipo.',
  },
] as const;
export function ProductTour() {
  const [pantalla, setPantalla] = useState<(typeof pantallas)[number]>(pantallas[0]);
  return (
    <div className={styles.tour}>
      <div className={styles.tourTabs} role="group" aria-label="Explorar pantallas del producto">
        {pantallas.map((p) => (
          <button key={p.id} aria-pressed={p.id === pantalla.id} onClick={() => setPantalla(p)}>
            {p.titulo}
          </button>
        ))}
      </div>
      <div className={styles.screen}>
        <Image
          src={
            'https://res.cloudinary.com/kvudcxty/image/upload/f_auto,q_auto/tattoomanager/producto/' +
            pantalla.id
          }
          alt={'Panel de TattooManager: ' + pantalla.descripcion}
          width={1440}
          height={900}
          sizes="(max-width: 760px) 95vw, 1100px"
        />
      </div>
      <p className={styles.screenCaption}>{pantalla.descripcion}</p>
    </div>
  );
}
