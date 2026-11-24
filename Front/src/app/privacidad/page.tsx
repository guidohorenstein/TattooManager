import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ProductHeader } from '@/components/marketing/ProductHeader';
import { ProductFooter } from '@/components/marketing/ProductFooter';
import styles from './privacy.module.css';
export const metadata: Metadata = {
  title: 'Privacidad y datos | TattooManager',
  description: 'Información sobre el uso de datos, cookies y preferencias en TattooManager.',
};
const sections = [
  {
    id: 'informacion',
    title: 'La información que usás en TattooManager',
    text: 'Al crear una cuenta se guardan tus datos de acceso, rol y perfil profesional. Cuando gestionás el negocio, también se procesan los contactos, consultas, referencias, presupuestos, conversaciones, turnos y preferencias que incorporás a la plataforma. El formulario de contacto recoge tu nombre, email y mensaje para responder la consulta.',
  },
  {
    id: 'uso',
    title: 'Para qué se utiliza',
    text: 'Estos datos permiten identificar tu cuenta, organizar el trabajo del estudio, coordinar sesiones y mantener el historial de cada consulta. Los correos de acceso y seguridad permiten verificar la cuenta o recuperar el acceso. Los recordatorios operativos se gestionan desde las preferencias del negocio.',
  },
  {
    id: 'publicacion',
    title: 'Qué información se publica',
    text: 'La página pública muestra la presentación profesional, ciudad, ubicación, artistas activos, horarios habituales y trabajos publicados. Los borradores, datos de acceso, contactos de clientes, conversaciones y turnos no forman parte de esa página. Los clientes pueden enviar una consulta sin crear una cuenta.',
  },
  {
    id: 'servicios',
    title: 'Servicios que intervienen',
    text: 'TattooManager utiliza proveedores de alojamiento y base de datos, Cloudinary para las imágenes y un servicio de correo para las comunicaciones. Google interviene cuando elegís acceder con esa cuenta. Si el negocio conecta una red social, un proveedor de pagos o el asistente, la información necesaria para esa función se procesa a través de esa integración.',
  },
  {
    id: 'instagram',
    title: 'Mensajes de Instagram',
    text: 'Cuando un negocio conecta su cuenta profesional de Instagram, TattooManager recibe a través de la API de Meta los mensajes directos que llegan a esa cuenta y los que el negocio envía desde la bandeja. Se guardan el identificador de la cuenta, el nombre visible y el identificador de cada persona que escribe, el texto y la fecha de los mensajes, y un token de acceso cifrado. Esta información se usa solo para mostrar y responder las conversaciones del negocio, vincularlas con consultas y turnos y, si el negocio lo habilita, para el asistente. No se vende, no se usa con fines publicitarios y no se comparte con otros negocios. Al desconectar Instagram se elimina el token y se dejan de recibir mensajes; las conversaciones anteriores se conservan en la cuenta del negocio hasta que se solicite su eliminación.',
  },
  {
    id: 'asistente',
    title: 'Atención automatizada',
    text: 'Cuando el negocio habilita el asistente virtual, Groq procesa fragmentos necesarios de esa conversación para responder consultas sobre tatuajes, propuestas y turnos, y actualizar el resumen de preferencias, dudas y acuerdos que utiliza el equipo. No se envía la ficha completa del cliente ni se adjuntan imágenes al modelo. La aplicación filtra datos de contacto conocidos e identificadores y deriva al equipo los mensajes detectados con información delicada. Los filtros automáticos pueden no identificar todos los datos personales incluidos en un texto libre; evitá compartir documentos, contraseñas, datos de pago, información de salud o imágenes íntimas con el asistente. Podés pedir hablar con el equipo en cualquier momento.',
  },
  {
    id: 'cookies',
    title: 'Cookies y almacenamiento del navegador',
    text: 'La cookie de sesión permite mantener el acceso autenticado. Durante el inicio de sesión con Google se utiliza otra cookie temporal para validar el recorrido. La cookie tattoomanager_theme conserva el modo claro u oscuro durante un año. El país seleccionado y el estado del menú lateral pueden guardarse en el almacenamiento local. Podés borrar estas preferencias desde la configuración de tu navegador; al borrar las de sesión tendrás que volver a ingresar.',
  },
  {
    id: 'controles',
    title: 'Cómo gestionar tu información',
    text: 'Podés actualizar tu perfil, editar tus trabajos y elegir qué publicás desde el panel. También podés configurar recordatorios y desconectar los canales asociados a tu negocio. La configuración de la cuenta incluye la opción de solicitar su eliminación. En la página de eliminación de datos se explica cómo pedir que se borren los mensajes y la información asociada. Para consultar sobre tus datos o pedir ayuda, utilizá el formulario de contacto e indicá el correo asociado a tu cuenta; no envíes contraseñas ni claves de servicios.',
  },
];
export default function PrivacyPage() {
  return (
    <MarketingShell>
      <ProductHeader />
      <main id="contenido" className={styles.privacy}>
        <Link href="/">← Volver a TattooManager</Link>
        <header>
          <h1>Privacidad y datos.</h1>
          <p>
            Cómo se utiliza la información en las funciones de TattooManager y qué podés controlar
            desde tu cuenta.
          </p>
        </header>
        <nav aria-label="Contenido de privacidad">
          {sections.map((s) => (
            <a key={s.id} href={'#' + s.id}>
              {s.title}
            </a>
          ))}
        </nav>
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <aside>
          <h2>¿Tenés una consulta sobre tus datos?</h2>
          <Link href="/eliminacion-de-datos">Cómo eliminar tus datos ↗</Link>
          <Link href="/#contacto">Enviar consulta ↗</Link>
        </aside>
      </main>
      <ProductFooter />
    </MarketingShell>
  );
}
