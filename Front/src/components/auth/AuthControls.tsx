'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
const LoginModal = dynamic(() => import('@/app/(auth)/Login/Login').then((m) => m.LoginModal), {
  ssr: false,
});
const RegisterModal = dynamic(
  () => import('@/app/(auth)/Register/Register').then((m) => m.RegisterModal),
  { ssr: false },
);
import { useAuth } from '@/store/AuthProvider';
import type { ContextoRegistro } from '@/types/forms';
import styles from './auth.module.css';
export function AuthControls({
  light = false,
  variant = 'header',
  onOpen,
  contextoRegistro = 'profesional',
}: {
  light?: boolean;
  variant?: 'header' | 'footer';
  onOpen?: () => void;
  contextoRegistro?: ContextoRegistro;
}) {
  const { usuario, cargando, error, reintentar, logout } = useAuth();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [errorSalida, setErrorSalida] = useState('');
  function abrir(tipo: 'login' | 'register') {
    setModal(tipo);
    onOpen?.();
  }
  async function salir() {
    setSaliendo(true);
    setErrorSalida('');
    try {
      await logout();
    } catch (error) {
      setErrorSalida(error instanceof Error ? error.message : 'No pudimos cerrar la sesión.');
    } finally {
      setSaliendo(false);
    }
  }
  const ruta =
    usuario?.rol === 'SUPERADMIN' ? '/admin' : usuario?.rol === 'ARTISTA' ? '/artista' : '/estudio';
  return (
    <div
      className={`${styles.controls} ${light ? styles.light : ''} ${variant === 'footer' ? styles.footer : ''}`}
    >
      {cargando ? (
        <span role="status">Consultando sesión…</span>
      ) : error ? (
        <div role="alert" className={styles.sessionError}>
          <span>{error}</span>
          <button onClick={reintentar}>Reintentar</button>
        </div>
      ) : usuario && usuario.rol !== 'CLIENTE' ? (
        <>
          <Link href={ruta} className={styles.linkButton} onClick={onOpen}>
            Mi panel
          </Link>
          <button className={styles.outline} onClick={salir} disabled={saliendo}>
            {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
          {errorSalida && <span role="alert">{errorSalida}</span>}
        </>
      ) : (
        <>
          <button className={styles.linkButton} onClick={() => abrir('login')}>
            Iniciar sesión
          </button>
          <button className={styles.outline} onClick={() => abrir('register')}>
            Crear cuenta
          </button>
        </>
      )}
      {modal === 'login' && (
        <LoginModal show onHide={() => setModal(null)} onSwitch={() => setModal('register')} />
      )}
      {modal === 'register' && (
        <RegisterModal
          show
          contexto={contextoRegistro}
          onHide={() => setModal(null)}
          onSwitch={() => setModal('login')}
        />
      )}
    </div>
  );
}
