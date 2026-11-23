'use client';
import { toast, type TypeOptions } from 'react-toastify';

function mostrar(mensaje: string, tipo: TypeOptions) {
  if (!mensaje.trim()) return;
  return toast(mensaje, {
    type: tipo,
    toastId: tipo + ':' + mensaje,
    role: tipo === 'error' ? 'alert' : 'status',
    autoClose: tipo === 'error' ? 7000 : 3500,
  });
}
export const notificar = {
  exito: (mensaje: string) => mostrar(mensaje, 'success'),
  error: (mensaje: string) => mostrar(mensaje, 'error'),
  info: (mensaje: string) => mostrar(mensaje, 'info'),
};
