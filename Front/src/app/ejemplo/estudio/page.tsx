import Link from 'next/link';
import type { Metadata } from 'next';
import type { PaginaPublica } from '@/types/pagina-publica';
import { PublicProfile } from '@/components/public-profile/PublicProfile';
export const metadata: Metadata = {
  title: 'Ejemplo de página de estudio | TattooManager',
  robots: { index: false, follow: false },
};
const base =
  'https://res.cloudinary.com/kvudcxty/image/upload/c_limit,w_1000,f_auto,q_auto/tattoomanager/formulario/cotizacion/estilos/';
const obras = [
  [
    'ornamental',
    'Ornamental',
    'Una composición ornamental, adaptada a la anatomía del brazo.',
    'Lucía Torres',
    'lucia',
  ],
  [
    'blackwork',
    'Blackwork',
    'Contraste y líneas definidas en una pieza de blackwork.',
    'Nicolás Vera',
    'nicolas',
  ],
  ['fineLine', 'Fine Line', 'Un motivo botánico de trazo fino.', 'Lucía Torres', 'lucia'],
  [
    'realism',
    'Realismo',
    'Estudio de luces y sombras en una pieza realista.',
    'Nicolás Vera',
    'nicolas',
  ],
  [
    'japanese',
    'Japonés',
    'Movimiento y tradición en una composición japonesa.',
    'Nicolás Vera',
    'nicolas',
  ],
  [
    'other',
    'Geométrico',
    'Formas y proporciones para una pieza geométrica.',
    'Lucía Torres',
    'lucia',
  ],
] as const;
const pagina: PaginaPublica = {
  tipo: 'ESTUDIO',
  nombre: 'Trazo Estudio',
  biografia:
    'Un espacio para ideas que se llevan en la piel. Creamos piezas personales, con tiempo para escuchar y diseñar con vos.',
  ciudad: 'Buenos Aires, Argentina',
  direccion: null,
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  portada: base + 'negro-y-gris/ornamental',
  formulario: '/ejemplo/formulario',
  artistas: [
    {
      id: 'lucia',
      nombre: 'Lucía Torres',
      biografia: 'Líneas finas y composiciones que acompañan el cuerpo.',
      foto: null,
      estilos: ['Fine Line', 'Ornamental'],
    },
    {
      id: 'nicolas',
      nombre: 'Nicolás Vera',
      biografia: 'Piezas de contraste y trabajo en negro y gris.',
      foto: null,
      estilos: ['Blackwork', 'Realismo', 'Japonés'],
    },
  ],
  trabajos: obras.map(([ref, estilo, descripcion, artista, artistaId], i) => ({
    id: String(i),
    url: base + 'negro-y-gris/' + ref,
    descripcion,
    artista,
    artistaId,
    estilos: [estilo],
  })),
  horarios: [
    {
      artista: 'Lucía Torres',
      semana: [2, 3, 4, 5, 6].map((dia) => ({ dia, rangos: [{ desde: '11:00', hasta: '19:00' }] })),
    },
    {
      artista: 'Nicolás Vera',
      semana: [1, 2, 3, 4, 5].map((dia) => ({ dia, rangos: [{ desde: '10:00', hasta: '18:00' }] })),
    },
  ],
};
export default function EjemploEstudio() {
  return (
    <>
      <aside
        style={{
          background: '#111',
          color: '#eee',
          padding: '14px 6%',
          fontSize: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <span>Estudio de ejemplo. Explorá cómo puede verse tu página.</span>
        <Link href="/" style={{ color: 'inherit' }}>
          Volver a TattooManager ↗
        </Link>
      </aside>
      <PublicProfile pagina={pagina} />
    </>
  );
}
