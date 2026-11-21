import type { PasoCotizacionProps } from '@/types/cotizacion';
import styles from '../cotizacion.module.css';
export function StepResumen({ values: v }: PasoCotizacionProps) {
  return (
    <div className={styles.campos}>
      <dl className={styles.resumen}>
        <div>
          <dt>Tatuaje</dt>
          <dd>
            {v.estilo} · {v.esColor ? 'A color' : 'Negro y gris'}
          </dd>
        </div>
        <div>
          <dt>Ubicación</dt>
          <dd>
            {v.zonaCuerpo} · {v.zonaEspecifica}
          </dd>
        </div>
        <div>
          <dt>Tu idea</dt>
          <dd>{v.descripcion}</dd>
        </div>
        <div>
          <dt>Referencia</dt>
          <dd>{v.imagenReferencia?.name || 'Sin imagen adjunta'}</dd>
        </div>
        <div>
          <dt>Contacto</dt>
          <dd>
            {v.nombre}
            <br />
            {v.email}
            <br />
            {v.telefono}
          </dd>
        </div>
      </dl>
      <p>Podés volver a los pasos anteriores para corregir los datos antes de enviar.</p>
    </div>
  );
}
