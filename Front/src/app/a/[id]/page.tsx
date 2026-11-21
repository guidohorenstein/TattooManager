import type { Metadata } from 'next';
import { obtenerPaginaPublica } from '@/lib/pagina-publica';
import { PublicProfile } from '@/components/public-profile/PublicProfile';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pagina = await obtenerPaginaPublica('artistas', id);
  return {
    title: pagina.nombre + ' | TattooManager',
    description: pagina.biografia || 'Conocé mi trabajo y pedí tu presupuesto.',
    openGraph: {
      title: pagina.nombre,
      description: pagina.biografia || undefined,
      images: pagina.portada ? [pagina.portada] : [],
    },
  };
}
export default async function ArtistaPublico({ params }: Props) {
  const { id } = await params;
  return <PublicProfile pagina={await obtenerPaginaPublica('artistas', id)} />;
}
