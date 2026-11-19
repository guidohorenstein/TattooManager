import { cache } from 'react';
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from './api-client';
import type { PaginaPublica } from '@/types/pagina-publica';
export const obtenerPaginaPublica = cache(
  async (tipo: 'estudios' | 'artistas', id: string): Promise<PaginaPublica> => {
    try {
      const respuesta = await apiFetch('/paginas/' + tipo + '/' + encodeURIComponent(id), {
        cache: 'no-store',
      });
      return respuesta.json();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }
  },
);
