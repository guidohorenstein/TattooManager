'use client';
import { notificar } from '@/lib/notificar';

import Link from 'next/link';
import styles from './workspace.module.css';

export function EnlaceFormulario({ enlace, estudio }: { enlace: string; estudio?: boolean }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(new URL(enlace, window.location.origin).href);
      notificar.exito('Enlace copiado.');
    } catch {
      notificar.info('Abrí el formulario y copiá el enlace desde la barra de direcciones.');
    }
  }

  return (
    <section className={styles.settingsSection}>
      <div>
        <h2>Formulario de consultas</h2>
        <p>
          {estudio
            ? 'Compartí el formulario del estudio para recibir consultas.'
            : 'Compartí el enlace para recibir consultas sin registro.'}
        </p>
      </div>
      <div className={styles.settingsActions}>
        <Link href={enlace} target="_blank" rel="noopener" className={styles.textButton}>
          Abrir formulario
        </Link>{' '}
        <button type="button" className={styles.textButton} onClick={copiar}>
          Copiar enlace
        </button>
      </div>
    </section>
  );
}
