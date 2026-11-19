'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="public-loading">
      <h1>No pudimos cargar el estudio</h1>
      <p>Intentá nuevamente en unos instantes.</p>
      <button className="btn btn-dark" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
