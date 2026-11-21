'use client';
import Image from 'next/image';
import { useRef, useState, type PointerEvent } from 'react';
import styles from './sculpture.module.css';
const works = [
  { style: 'Ornamental', path: 'ornamental', artist: 'Lucía Torres' },
  { style: 'Blackwork', path: 'blackwork', artist: 'Nicolás Vera' },
  { style: 'Realismo', path: 'realism', artist: 'Nicolás Vera' },
];
const urls = [
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_850,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/ornamental',
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_850,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/blackwork',
  'https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_650,h_850,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/negro-y-gris/realism',
];
export function PortfolioSculpture() {
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  function move(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 16;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -12;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      stage.current?.style.setProperty('--tilt-x', y + 'deg');
      stage.current?.style.setProperty('--tilt-y', x + 'deg');
    });
  }
  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    stage.current?.style.setProperty('--tilt-x', '0deg');
    stage.current?.style.setProperty('--tilt-y', '0deg');
  }
  return (
    <div className={styles.sculpture}>
      <div ref={stage} className={styles.stage} onPointerMove={move} onPointerLeave={reset}>
        <div className={styles.orbit} aria-hidden="true" />
        <div className={styles.deck}>
          {works.map((work, index) => (
            <button
              key={work.path}
              className={styles.work}
              data-position={(index - active + works.length) % works.length}
              onClick={() => setActive(index)}
              aria-pressed={active === index}
              aria-label={work.artist + ' ' + work.style + '. Ver composición'}
            >
              <Image
                src={urls[index]!}
                alt={'Tatuaje de estilo ' + work.style}
                width={650}
                height={850}
                sizes="(max-width: 760px) 65vw, 300px"
              />
              <span>
                <small>{work.artist}</small>
                <strong>{work.style}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.caption}>
        <span>Un portafolio con otra dimensión.</span>
        <button onClick={() => setActive((active + 1) % works.length)}>
          Siguiente trabajo <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className={styles.srOnly} role="status">
        Mostrando {works[active]!.style}. Composición de ejemplo.
      </p>
    </div>
  );
}
