import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './cotizacion.module.css';

export function MarcoCotizacion({
  destinatario,
  children,
  volver = '/',
}: {
  destinatario: string;
  children: ReactNode;
  volver?: string;
}) {
  return (
    <main className={styles.pagina}>
      <div className={styles.marco}>
        <header className={styles.cabecera}>
          <Link href={volver} className={styles.volver}>
            ← Volver
          </Link>
          <h1>Solicitar presupuesto</h1>
          <p className={styles.destino}>
            <span>Consulta para</span>
            <strong>{destinatario}</strong>
          </p>
        </header>
        <div className={styles.contenido}>{children}</div>
      </div>
    </main>
  );
}
