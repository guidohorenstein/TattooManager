'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePanelData, mutarPanel } from '@/hooks/usePanelData';
import styles from './workspace.module.css';
type Configuracion = {
  publicada: boolean;
  mostrarDireccion: boolean;
  puedeEditar: boolean;
  pendientes: string[];
  enlace: string;
  perfil: string;
};
export function EnlacePaginaPublica({
  enlace,
  editable = true,
}: {
  enlace: string;
  editable?: boolean;
}) {
  const { datos, error, recargar } = usePanelData<Configuracion>('/paginas/configuracion');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function guardar(publicada: boolean, mostrarDireccion: boolean) {
    if (ocupado) return;
    setOcupado(true);
    setAviso('');
    try {
      await mutarPanel('/paginas/configuracion', 'PATCH', { publicada, mostrarDireccion });
      await recargar();
      setAviso(publicada ? 'Página publicada.' : 'Página guardada en borrador.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No pudimos guardar los cambios.');
    } finally {
      setOcupado(false);
    }
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(
        new URL(datos?.enlace || enlace, window.location.origin).href,
      );
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
          {!datos
            ? 'Consultando publicación…'
            : datos.publicada
              ? 'Disponible para tus clientes.'
              : 'En borrador. Todavía no es visible para tus clientes.'}
        </p>
        {error && (
          <p role="alert">
            {error}{' '}
            <button type="button" className={styles.textButton} onClick={() => void recargar()}>
              Reintentar
            </button>
          </p>
        )}
        {datos?.pendientes.length && editable ? (
          <details className={styles.settingsChecklist}>
            <summary>{datos.pendientes.length} datos pendientes para publicar</summary>
            <ul>
              {datos.pendientes.map((campo) => (
                <li key={campo}>
                  <Link
                    href={
                      campo.includes('trabajo')
                        ? datos.perfil.startsWith('/estudio')
                          ? '/estudio/equipo'
                          : '/artista/trabajos'
                        : datos.perfil
                    }
                  >
                    {campo}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
      <div>
        {datos && editable && datos.puedeEditar && (
          <>
            <label className={styles.description}>
              <input
                type="checkbox"
                checked={datos.mostrarDireccion}
                disabled={ocupado}
                onChange={(e) => void guardar(datos.publicada, e.target.checked)}
              />{' '}
              Mostrar la dirección en mi página
            </label>
            <div className={styles.settingsControls}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={ocupado || (!datos.publicada && datos.pendientes.length > 0)}
                onClick={() => void guardar(!datos.publicada, datos.mostrarDireccion)}
              >
                {ocupado ? 'Guardando…' : datos.publicada ? 'Pasar a borrador' : 'Publicar página'}
              </button>
            </div>
          </>
        )}
        {datos?.publicada && (
          <div className={styles.settingsControls}>
            <Link href={datos.enlace} target="_blank" rel="noopener" className={styles.textButton}>
              Ver página pública
            </Link>
            {' · '}
            <button type="button" onClick={() => void copiar()} className={styles.textButton}>
              Copiar enlace
            </button>
          </div>
        )}
        <p role="status" className={styles.description}>
          {aviso}
        </p>
      </div>
    </section>
  );
}
