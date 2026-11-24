'use client';

import { useEffect, useRef } from 'react';

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const urlScript = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Sin site key configurada no se muestra el widget y el backend no exige token. */
export const turnstileHabilitado = siteKey.length > 0;

type OpcionesTurnstile = {
  sitekey: string;
  language: string;
  theme: 'auto';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
};
type ApiTurnstile = {
  render: (elemento: HTMLElement, opciones: OpcionesTurnstile) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

let cargaScript: Promise<ApiTurnstile> | undefined;
function cargarTurnstile(): Promise<ApiTurnstile> {
  cargaScript ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = urlScript;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile no cargó.'));
    script.onerror = () => {
      cargaScript = undefined;
      reject(new Error('Turnstile no cargó.'));
    };
    document.head.appendChild(script);
  });
  return cargaScript;
}

/**
 * Verificación de Cloudflare Turnstile. Cada token sirve para un solo envío:
 * después de enviar, cambiá la `key` del componente para pedir uno nuevo.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const avisar = useRef(onToken);
  useEffect(() => {
    avisar.current = onToken;
  });

  useEffect(() => {
    if (!turnstileHabilitado || !contenedor.current) return;
    let id: string | undefined;
    let activo = true;
    avisar.current(null);
    cargarTurnstile()
      .then((api) => {
        if (!activo || !contenedor.current) return;
        id = api.render(contenedor.current, {
          sitekey: siteKey,
          language: 'es',
          theme: 'auto',
          callback: (token) => avisar.current(token),
          'expired-callback': () => avisar.current(null),
          'error-callback': () => avisar.current(null),
        });
      })
      .catch(() => avisar.current(null));
    return () => {
      activo = false;
      if (id) window.turnstile?.remove(id);
    };
  }, []);

  if (!turnstileHabilitado) return null;
  return <div ref={contenedor} style={{ minHeight: 65 }} />;
}
