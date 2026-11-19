'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './workspace.module.css';
export function EnlacePaginaPublica({
  enlace,
  editable = true,
}: {
  enlace: string;
  editable?: boolean;
}) {
  const [aviso, setAviso] = useState('');
  async function copiar() {
    try {
      await navigator.clipboard.writeText(new URL(enlace, window.location.origin).href);
      setAviso('Enlace copiado.');
    } catch {
      setAviso('Abrí la página y copiá la dirección desde el navegador.');
    }
  }
  return (
    <section className={styles.settingsSection}>
      <div>
        <h2>{editable ? 'Tu página pública' : 'Página del estudio'}</h2>
        <p>
          {editable
            ? 'Compartí tu perfil, trabajos y horarios. La información se actualiza desde tu perfil y disponibilidad.'
            : 'Compartí la página del estudio al que pertenecés.'}
        </p>
      </div>
      <div>
        <Link href={enlace} target="_blank" rel="noopener" className={styles.textButton}>
          Ver página pública
        </Link>{' '}
        <button type="button" onClick={copiar} className={styles.textButton}>
          Copiar enlace de la página
        </button>
        <p role="status" className={styles.description}>
          {aviso}
        </p>
      </div>
    </section>
  );
}
