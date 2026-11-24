'use client';

import { useRef, useState } from 'react';
import { CotizacionForm } from '@/components/forms/CotizacionForm';
import { Turnstile, turnstileHabilitado } from '@/components/forms/Turnstile';
import styles from './cotizacion.module.css';
import { crearSolicitud } from '@/services/cotizacion.service';
import type { CotizacionValues } from '@/types/cotizacion';

export function SolicitudPublica({
  destino,
  enlaceInstagram,
}: {
  destino: { estudio: string } | { artista: string };
  enlaceInstagram?: string;
}) {
  const claveEnvio = useRef<string>(null);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  async function enviar(values: CotizacionValues) {
    setError('');
    if (turnstileHabilitado && !token) {
      setError('Esperá a que termine la verificación de seguridad y volvé a enviar.');
      return;
    }
    try {
      claveEnvio.current ??= crypto.randomUUID();
      await crearSolicitud(values, destino, claveEnvio.current, enlaceInstagram, token);
      setEnviada(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos enviar la consulta.');
      // Cada token sirve para un solo envío: se pide uno nuevo para reintentar.
      setIntento((valor) => valor + 1);
    }
  }

  return enviada ? (
    <div role="status">
      <h2 className={styles.pasoTitulo}>Consulta enviada</h2>
      <p>
        {enlaceInstagram
          ? 'Volvé al chat de Instagram para seguir con tu consulta.'
          : 'El equipo ya tiene los datos de tu idea.'}
      </p>
    </div>
  ) : (
    <CotizacionForm
      onSubmit={enviar}
      error={error}
      verificacion={<Turnstile key={intento} onToken={setToken} />}
    />
  );
}
