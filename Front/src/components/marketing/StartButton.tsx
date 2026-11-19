'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
const RegisterModal = dynamic(
  () => import('@/app/(auth)/Register/Register').then((m) => m.RegisterModal),
  { ssr: false },
);
const LoginModal = dynamic(() => import('@/app/(auth)/Login/Login').then((m) => m.LoginModal), {
  ssr: false,
});
import { useAuth } from '@/store/AuthProvider';
import styles from './marketing.module.css';
export function StartButton({
  children = 'Crear mi cuenta',
  secondary = false,
}: {
  children?: React.ReactNode;
  secondary?: boolean;
}) {
  const { usuario } = useAuth();
  const [modal, setModal] = useState<'register' | 'login' | null>(null);
  const clase = secondary ? styles.secondary : styles.primary;
  if (usuario && usuario.rol !== 'CLIENTE')
    return (
      <Link
        className={clase}
        href={
          usuario.rol === 'SUPERADMIN'
            ? '/admin'
            : usuario.rol === 'ARTISTA'
              ? '/artista'
              : '/estudio'
        }
      >
        Ir a mi panel ↗
      </Link>
    );
  return (
    <>
      <button className={clase} onClick={() => setModal('register')}>
        {children} <span aria-hidden="true">↗</span>
      </button>
      {modal === 'register' && (
        <RegisterModal
          show
          contexto="profesional"
          onHide={() => setModal(null)}
          onSwitch={() => setModal('login')}
        />
      )}
      {modal === 'login' && (
        <LoginModal show onHide={() => setModal(null)} onSwitch={() => setModal('register')} />
      )}
    </>
  );
}
