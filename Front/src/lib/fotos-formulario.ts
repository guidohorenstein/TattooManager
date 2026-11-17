const carpeta =
  process.env.NEXT_PUBLIC_CLOUDINARY_FORMULARIO_BASE_URL?.trim().replace(/\/+$/, '') ||
  'https://res.cloudinary.com/t4xfjphx/image/upload/inkmanager/formulario';

export function fotoFormulario(referencia: string, ancho: number) {
  const transformacion = `/image/upload/c_limit,w_${ancho},f_auto,q_auto/`;
  return `${carpeta.replace('/image/upload/', transformacion)}/${referencia}`;
}
