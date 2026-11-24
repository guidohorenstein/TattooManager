'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Reemplaza al layout raíz cuando falla el render: reporta el error y ofrece reintentar.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#111',
          color: '#f2eee8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ textAlign: 'center', padding: 24 }}>
          <h1>Algo salió mal.</h1>
          <p>Ya nos llegó el aviso. Probá de nuevo en unos segundos.</p>
          <button type="button" onClick={reset}>
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
