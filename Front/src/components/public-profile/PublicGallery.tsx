'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Modal from 'react-bootstrap/Modal';
import type { TrabajoPagina } from '@/types/pagina-publica';
import styles from './public-profile.module.css';
export function PublicGallery({
  trabajos,
  formulario,
}: {
  trabajos: TrabajoPagina[];
  formulario: string;
}) {
  const [estilo, setEstilo] = useState('');
  const [seleccion, setSeleccion] = useState<TrabajoPagina | null>(null);
  const estilos = [...new Set(trabajos.flatMap((t) => t.estilos))].sort();
  const visibles = estilo ? trabajos.filter((t) => t.estilos.includes(estilo)) : trabajos;
  return (
    <>
      {estilos.length > 1 && (
        <div className={styles.filters} role="group" aria-label="Filtrar trabajos por estilo">
          {['', ...estilos].map((e) => (
            <button key={e} aria-pressed={estilo === e} onClick={() => setEstilo(e)}>
              {e || 'Todos'}
            </button>
          ))}
        </div>
      )}
      {visibles.length ? (
        <div className={styles.gallery}>
          {visibles.map((t) => (
            <button
              className={styles.work}
              key={t.id}
              onClick={() => setSeleccion(t)}
              aria-label={
                t.artista + ' ' + t.estilos.join(' / ') + '. Ver trabajo: ' + t.descripcion
              }
            >
              <Image
                src={t.url}
                alt={t.descripcion}
                width={700}
                height={900}
                sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
              />
              <span>
                <strong>{t.artista}</strong>
                <span>{t.estilos.join(' / ')}</span>
                <span aria-hidden="true">↗</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Los próximos trabajos se publicarán acá.</p>
      )}
      <Modal
        show={Boolean(seleccion)}
        onHide={() => setSeleccion(null)}
        centered
        size="lg"
        scrollable
        aria-labelledby="trabajo-publico-title"
      >
        <Modal.Header closeButton closeLabel="Cerrar">
          <Modal.Title id="trabajo-publico-title">{seleccion?.artista}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {seleccion && (
            <>
              <Image
                className={styles.detailImage}
                src={seleccion.url}
                alt={seleccion.descripcion}
                width={1000}
                height={1200}
                sizes="(max-width: 800px) 90vw, 760px"
              />
              <p className="mt-3">{seleccion.descripcion}</p>
              <p>{seleccion.estilos.join(' / ')}</p>
              <Link className={styles.button} href={formulario}>
                Quiero pedir un presupuesto ↗
              </Link>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
