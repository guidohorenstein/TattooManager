import type { RegisterValues } from '@/types/forms';
export function crearValoresRegistro(): RegisterValues {
  return {
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'ARTISTA',
    nombreArtistico: '',
    nombreEstudio: '',
  };
}
