import type { Metadata } from 'next';
import { obtenerPaginaPublica } from '@/lib/pagina-publica';
import { PublicProfile } from '@/components/public-profile/PublicProfile';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await obtenerPaginaPublica('estudios', slug);
  return {
    title: pagina.nombre + ' | TattooManager',
    description:
      pagina.biografia || 'Conocé el estudio, sus artistas y sus trabajos. Pedí tu presupuesto.',
    openGraph: {
      title: pagina.nombre,
      description: pagina.biografia || undefined,
      images: pagina.portada ? [pagina.portada] : [],
    },
  };
}
export default async function EstudioPublico({ params }: Props) {
  const { slug } = await params;
  return <PublicProfile pagina={await obtenerPaginaPublica('estudios', slug)} />;
}
