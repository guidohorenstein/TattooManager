import { Field, useFormikContext } from 'formik';
import { erroresContacto } from '@/lib/contacto-presupuesto';
import type { CotizacionValues } from '@/types/cotizacion';
import styles from '../cotizacion.module.css';
export function StepContacto() {
  const { values, touched } = useFormikContext<CotizacionValues>();
  const errores = erroresContacto(values);
  return (
    <div className={styles.campos}>
      {(
        [
          ['nombre', 'Nombre completo', 'text', 'name', 80],
          ['email', 'Correo electrónico', 'email', 'email', 254],
          ['telefono', 'Teléfono con código de país', 'tel', 'tel', 30],
        ] as const
      ).map(([name, label, type, autoComplete, maxLength]) => {
        const error = touched[name] && errores[name];
        return (
          <div key={name}>
            <label htmlFor={name}>{label}</label>
            <Field
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              className={styles.campo}
              maxLength={maxLength}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={
                error ? name + '-error' : name === 'telefono' ? 'telefono-ayuda' : undefined
              }
              placeholder={name === 'telefono' ? '+54 9 11 1234 5678' : undefined}
            />
            {name === 'telefono' && !error && (
              <small id="telefono-ayuda">Usaremos este número para coordinar tu consulta.</small>
            )}
            {error && (
              <p id={name + '-error'} role="alert" className={styles.error}>
                {error}
              </p>
            )}
          </div>
        );
      })}
      <label className={styles.permiso}>
        <Field name="promociones" type="checkbox" className="form-check-input" />
        Quiero recibir novedades y promociones por email (opcional).
      </label>
    </div>
  );
}
