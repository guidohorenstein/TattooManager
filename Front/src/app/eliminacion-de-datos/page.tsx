import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ProductHeader } from '@/components/marketing/ProductHeader';
import { ProductFooter } from '@/components/marketing/ProductFooter';
import styles from '../privacidad/privacy.module.css';

export const metadata: Metadata = {
  title: 'Eliminación de datos | TattooManager',
  description:
    'Cómo pedir la eliminación de tu cuenta, tus mensajes de Instagram y la información asociada en TattooManager.',
};

// Esta página es la URL de instrucciones de eliminación de datos que exige Meta.
const sections = [
  {
    id: 'cuenta',
    title: 'Si tenés una cuenta en TattooManager',
    pasos: [
      'Ingresá a tu panel y abrí Configuración.',
      'Si conectaste Instagram, tocá Desconectar en Cuentas asociadas. El token de acceso se borra en ese momento y se dejan de recibir mensajes.',
      'Elegí Eliminar cuenta y confirmá. Se cierran todas tus sesiones y se eliminan tus datos personales de acceso y perfil.',
      'Si además querés que se borren las conversaciones, consultas y turnos de tu negocio, envianos una consulta desde el formulario de contacto con el correo de tu cuenta.',
    ],
  },
  {
    id: 'instagram',
    title: 'Si le escribiste a un estudio o artista por Instagram',
    pasos: [
      'Podés pedirle directamente al estudio o artista que elimine tu conversación.',
      'También podés escribirnos desde el formulario de contacto. Indicá tu usuario de Instagram y el nombre del estudio o artista al que le escribiste.',
      'Verificamos la solicitud y eliminamos los mensajes y los datos asociados a ese usuario.',
    ],
  },
  {
    id: 'meta',
    title: 'Si quitaste el acceso desde Instagram o Facebook',
    pasos: [
      'Desde la configuración de Instagram o Facebook podés quitar el acceso de TattooManager en Apps y sitios web.',
      'Para que además eliminemos la información ya guardada, envianos la solicitud desde el formulario de contacto con tu usuario de Instagram.',
    ],
  },
];

export default function EliminacionDatosPage() {
  return (
    <MarketingShell>
      <ProductHeader />
      <main id="contenido" className={styles.privacy}>
        <Link href="/privacidad">← Volver a Privacidad y datos</Link>
        <header>
          <h1>Eliminación de datos.</h1>
          <p>
            Cómo pedir que se borre tu información de TattooManager, incluidos los mensajes
            recibidos a través de Instagram. Respondemos cada solicitud en un plazo máximo de 30
            días.
          </p>
        </header>
        <nav aria-label="Contenido de eliminación de datos">
          {sections.map((s) => (
            <a key={s.id} href={'#' + s.id}>
              {s.title}
            </a>
          ))}
        </nav>
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            <ol>
              {s.pasos.map((paso) => (
                <li key={paso}>
                  <p>{paso}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <aside>
          <h2>Enviar una solicitud de eliminación</h2>
          <Link href="/#contacto">Ir al formulario de contacto ↗</Link>
        </aside>
      </main>
      <ProductFooter />
    </MarketingShell>
  );
}
