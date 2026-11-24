'use server';
import { headers } from 'next/headers';
import { firmarIP } from '@/lib/proxy-firma';
import { apiFetch } from '@/lib/api-client';
type ContactResult = { success: boolean; message: string };
export async function sendContactMessage(
  name: unknown,
  email: unknown,
  message: unknown,
  tokenVerificacion?: unknown,
): Promise<ContactResult> {
  try {
    const encabezados = new Headers({
      'x-vercel-forwarded-for': (await headers()).get('x-vercel-forwarded-for') ?? '',
      'Content-Type': 'application/json',
    });
    if (typeof tokenVerificacion === 'string' && tokenVerificacion.length > 0)
      encabezados.set('X-Turnstile-Token', tokenVerificacion);
    const res = await apiFetch('/contacto', {
      method: 'POST',
      headers: firmarIP(encabezados, 'POST', '/api/contacto'),
      body: JSON.stringify({ nombre: name, email, mensaje: message }),
    });
    const datos: { message: string } = await res.json();
    return { success: true, message: datos.message };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos enviar tu consulta.',
    };
  }
}
