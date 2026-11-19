'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Form, Formik } from 'formik';
import Modal from 'react-bootstrap/Modal';
import { AuthField } from '@/components/forms/AuthField';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { registrarUsuario } from '@/services/users.service';
import { useAuth } from '@/store/AuthProvider';
import { requisitosPassword, validarRegistro } from '@/lib/auth-validation';
import { crearValoresRegistro } from '@/lib/registro';
import type { RegisterModalProps, RegisterValues, PerfilRegistroGoogle } from '@/types/forms';
import styles from '@/components/auth/auth.module.css';
import { iniciarRegistroGoogle } from '@/services/auth.service';
const roles = [
  { value: 'ARTISTA', title: 'Artista', description: 'Trabajo por mi cuenta.' },
  { value: 'ESTUDIO_ADMIN', title: 'Estudio', description: 'Gestiono un equipo.' },
] as const;
export function RegisterModal({ show, onHide, onSwitch }: RegisterModalProps) {
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(false);
  const [google, setGoogle] = useState(false);
  const { login } = useAuth();
  async function submit(values: RegisterValues) {
    setError('');
    try {
      await registrarUsuario(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No pudimos crear la cuenta.');
      return;
    }
    try {
      await login(values.email.trim(), values.password);
      onHide();
    } catch {
      setCreada(true);
    }
  }
  async function registrarGoogle(values: RegisterValues) {
    const errores = validarRegistro(values);
    const error = values.rol === 'ARTISTA' ? errores.nombreArtistico : errores.nombreEstudio;
    if (error) {
      setError(error);
      return;
    }
    const perfil: PerfilRegistroGoogle =
      values.rol === 'ARTISTA'
        ? { rol: 'ARTISTA', nombreArtistico: values.nombreArtistico.trim() }
        : { rol: 'ESTUDIO_ADMIN', nombreEstudio: values.nombreEstudio.trim() };
    setError('');
    setGoogle(true);
    try {
      await iniciarRegistroGoogle(perfil);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No pudimos conectar con Google.');
    } finally {
      setGoogle(false);
    }
  }
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      scrollable
      contentClassName={styles.modal}
      aria-labelledby="register-title"
    >
      <Modal.Header closeButton closeLabel="Cerrar" className={styles.modalHeader}>
        <div>
          <p className={styles.eyebrow}>TattooManager</p>
          <Modal.Title id="register-title" as="h2">
            Tu espacio de trabajo.
          </Modal.Title>
        </div>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        {creada ? (
          <div role="status">
            <p>Tu cuenta está creada. Iniciá sesión para continuar.</p>
            <button className={styles.submit} onClick={onSwitch}>
              Iniciar sesión
            </button>
          </div>
        ) : (
          <Formik
            initialValues={crearValoresRegistro()}
            validate={validarRegistro}
            onSubmit={submit}
          >
            {({ values, isSubmitting, handleChange }) => (
              <Form noValidate>
                <fieldset disabled={isSubmitting || google}>
                  <legend className={styles.legend}>¿Cómo trabajás?</legend>
                  <div className={styles.roles}>
                    {roles.map((role) => (
                      <label key={role.value} className={styles.role}>
                        <input
                          type="radio"
                          name="rol"
                          value={role.value}
                          checked={values.rol === role.value}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>{role.title}</strong>
                          <small>{role.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <AuthField
                    prefix="register"
                    name="nombre"
                    label="Tu nombre"
                    autoComplete="name"
                    minLength={2}
                    maxLength={20}
                  />
                  {values.rol === 'ARTISTA' ? (
                    <AuthField
                      prefix="register"
                      name="nombreArtistico"
                      label="Nombre artístico"
                      autoComplete="nickname"
                    />
                  ) : (
                    <AuthField
                      prefix="register"
                      name="nombreEstudio"
                      label="Nombre del estudio"
                      autoComplete="organization"
                    />
                  )}
                  <AuthField
                    prefix="register"
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                  />
                  <AuthField
                    prefix="register"
                    name="password"
                    label="Contraseña"
                    type="password"
                    autoComplete="new-password"
                    hint={requisitosPassword}
                  />
                  <AuthField
                    prefix="register"
                    name="confirmPassword"
                    label="Repetí tu contraseña"
                    type="password"
                    autoComplete="new-password"
                  />
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                  <button type="submit" className={styles.submit} disabled={isSubmitting}>
                    {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                  </button>
                  <p className={styles.hint}>
                    Con Google solo necesitás completar tu nombre artístico o el del estudio.
                  </p>
                  <GoogleButton onClick={() => registrarGoogle(values)} loading={google}>
                    Registrarme con Google
                  </GoogleButton>
                </fieldset>
              </Form>
            )}
          </Formik>
        )}
        {!creada && (
          <p className={styles.switch}>
            ¿Ya tenés cuenta?{' '}
            <button type="button" onClick={onSwitch}>
              Iniciar sesión
            </button>
          </p>
        )}
        <p className={styles.hint}>
          Conocé nuestros <Link href="/terminos-y-condiciones">términos y condiciones</Link>.
        </p>
      </Modal.Body>
    </Modal>
  );
}
