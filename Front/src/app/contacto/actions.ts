'use server';
import { apiFetch } from '@/lib/api-client';
type ContactResult = { success: boolean; message: string };
export async function sendContactMessage(
  name: unknown,
  email: unknown,
  message: unknown,
): Promise<ContactResult> {
  try {
    const res = await apiFetch('/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
