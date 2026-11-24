import Image from 'next/image';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { ContactSection } from '@/components/marketing/ContactSection';
import { PortfolioSculpture } from '@/components/marketing/PortfolioSculpture';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ProductFooter } from '@/components/marketing/ProductFooter';
import { ProductHeader } from '@/components/marketing/ProductHeader';
import { StartButton } from '@/components/marketing/StartButton';
import { ProductTour } from '@/components/marketing/ProductTour';
import { Pricing } from '@/components/marketing/Pricing';
import styles from '@/components/marketing/marketing.module.css';
import { whatsappHabilitado } from '@/lib/canales-habilitados';
export const metadata: Metadata = {
  title: 'TattooManager | Tu estudio, bajo control',
  description:
    'El espacio de trabajo de artistas y estudios de tatuajes. Organizá consultas, presupuestos, equipo y agenda, y compartí tu propia página pública.',
};
const recorrido = [
  [
    'Recibí la idea',
    'Tu cliente entra desde tu página o desde el chat y completa el formulario. Sin crear una cuenta.',
  ],
  [
    'Prepará la propuesta',
    'Revisá el diseño, la zona y las referencias. Definí el precio y compartí el presupuesto.',
  ],
  [
    'Coordiná el turno',
    'Asigná un artista y reservá en su disponibilidad. La conversación acompaña al proyecto.',
  ],
  [
    'Seguí en contacto',
    'Configurá recordatorios, cuidados y pedidos de reseña. Consultá cómo va tu negocio.',
  ],
];
const preguntas = [
  [
    '¿Mis clientes necesitan una cuenta?',
    'No. Pueden ver tu página, conocer tus trabajos y completar una consulta sin registrarse. El acceso a TattooManager es para los profesionales que gestionan el negocio.',
  ],
  [
    '¿Puedo usarlo si trabajo por mi cuenta?',
    'Sí. El plan Individual reúne tu perfil público, portafolio, consultas, mensajes y agenda. Si trabajás para un estudio, accedés como integrante de ese equipo.',
  ],
  [
    '¿Cada artista del estudio necesita pagar un plan?',
    'No. Los integrantes activos acceden bajo la suscripción del estudio. El titular administra el equipo y cada artista gestiona el trabajo que le corresponde.',
  ],
  [
    '¿Cómo funciona el asistente?',
    'Definís el tono, tus servicios, políticas y cuándo debe intervenir una persona. El asistente usa el contexto de las consultas y la disponibilidad. Podés pausarlo en cada conversación.',
  ],
  [
    '¿Puedo conectar mis redes sociales?',
    whatsappHabilitado
      ? 'Los canales disponibles se conectan desde la configuración del negocio. Instagram y WhatsApp requieren una cuenta compatible y los permisos de Meta. La página y el formulario funcionan sin esa conexión.'
      : 'Podés conectar la cuenta profesional de Instagram de tu negocio desde la configuración. WhatsApp llega próximamente. La página y el formulario funcionan sin esa conexión.',
  ],
  [
    '¿Puedo compartir mi propia página?',
    'Sí. Cada estudio y artista independiente tiene un enlace propio. Su información, trabajos publicados y horarios se actualizan desde el panel. Los artistas de un estudio comparten la página de su equipo.',
  ],
];
export default function Home() {
  return (
    <MarketingShell>
      <a className={styles.skip} href="#contenido">
        Saltar al contenido
      </a>
      <ProductHeader />
      <main id="contenido">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Hecho para el trabajo detrás del tatuaje</p>
            <h1>
              Tu estudio,
              <br />
              bajo control.
            </h1>
            <p className={styles.heroIntro}>
              Consultas, presupuestos y turnos. El espacio de trabajo para artistas independientes y
              estudios de tatuajes.
            </p>
            <div className={styles.heroActions}>
              <StartButton />
              <a href="#producto" className={styles.quietLink}>
                Probar el espacio de trabajo <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className={styles.heroPhoto}>
            <Image
              src="https://res.cloudinary.com/kvudcxty/image/upload/c_fill,w_1000,h_1200,g_center,f_auto,q_auto/tattoomanager/formulario/cotizacion/color/blackGrey"
              alt="Detalle de un tatuaje en negro y gris"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 760px) 100vw, 45vw"
            />
            <div className={styles.photoFrame} />
          </div>
        </section>
        <section id="producto" className={styles.section}>
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>Un espacio de trabajo</p>
            <h2>
              Todo el estudio.
              <br />
              Una misma vista.
            </h2>
            <p>
              Dejá de reconstruir cada consulta entre conversaciones, notas y calendarios. Cada
              proyecto conserva su contexto. Explorá una consulta, prepará una propuesta y reservá
              un turno en la demo.
            </p>
          </header>
          <ProductTour />
        </section>
        <section
          data-reveal
          className={styles.capabilities}
          aria-label="Herramientas de TattooManager"
        >
          <div>
            <h2>
              Menos pendientes.
              <br />
              Más foco en tu arte.
            </h2>
          </div>
          <div className={styles.featureList}>
            <article>
              <h3>Consultas con contexto</h3>
              <p>
                Descripción, referencias y zona marcada sobre el cuerpo. Todo acompaña al
                presupuesto.
              </p>
            </article>
            <article>
              <h3>Un equipo coordinado</h3>
              <p>
                Invitá artistas, compará propuestas y asigná cada proyecto. Los permisos siguen la
                responsabilidad de cada persona.
              </p>
            </article>
            <article>
              <h3>Una agenda que se respeta</h3>
              <p>
                Horarios por artista, bloqueos y control de superposiciones. Cada sesión queda
                vinculada a su consulta.
              </p>
            </article>
            <article>
              <h3>Conversaciones con continuidad</h3>
              <p>
                El historial y el asistente acompañan el trabajo. El equipo puede intervenir cuando
                hace falta.
              </p>
            </article>
            <article>
              <h3>Seguimiento después del turno</h3>
              <p>
                Activá correos de recordatorio, cuidados y reseñas. Elegí las reglas y sus
                excepciones.
              </p>
            </article>
            <article>
              <h3>Decisiones con información</h3>
              <p>
                Consultá turnos, actividad, ingresos registrados y origen de las consultas del
                negocio.
              </p>
            </article>
          </div>
        </section>
        <section data-reveal id="recorrido" className={styles.section}>
          <header className={styles.sectionHead}>
            <h2>
              De la primera idea
              <br />a la próxima sesión.
            </h2>
          </header>
          <ol className={styles.workflow}>
            {recorrido.map(([titulo, texto]) => (
              <li key={titulo}>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </li>
            ))}
          </ol>
        </section>
        <section data-reveal id="tu-pagina" className={styles.publicPage}>
          <div>
            <p className={styles.eyebrow}>Tu presencia, con tu identidad</p>
            <h2>
              Tu estudio merece
              <br />
              su propio lugar.
            </h2>
            <p>
              Un enlace para mostrar quiénes son, qué hacen y dónde encontrarlos. Tu cliente conoce
              el estudio y llega al formulario con una idea más clara.
            </p>
            <ul>
              <li>Tu presentación y ubicación</li>
              <li>Los artistas de tu equipo</li>
              <li>Trabajos publicados, filtrados por estilo</li>
              <li>Horarios y solicitud de presupuesto</li>
            </ul>
            <Link href="/ejemplo/estudio" className={styles.secondary}>
              Explorar una página de ejemplo <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <PortfolioSculpture />
        </section>
        <section id="asistente" data-reveal className={styles.assistant}>
          <h2>
            La conversación sigue.
            <br />
            Vos decidís cómo.
          </h2>
          <div>
            <p>
              Configurá cómo responde tu negocio, qué información necesita y en qué momento debe
              avisarte. El presupuesto lo define el artista; el asistente ayuda a continuar el
              recorrido.
            </p>
            <Link href="#preguntas" className={styles.quietLink}>
              Conocer más sobre el asistente ↗
            </Link>
          </div>
        </section>
        <Pricing />
        <section id="preguntas" className={styles.faq}>
          <header>
            <h2>Antes de empezar.</h2>
          </header>
          <div>
            {preguntas.map(([pregunta, respuesta]) => (
              <details key={pregunta}>
                <summary>
                  {pregunta}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{respuesta}</p>
              </details>
            ))}
          </div>
        </section>
        <ContactSection />
        <section className={styles.final} data-reveal>
          <h2>
            Más tiempo tatuando.
            <br />
            Menos tiempo organizando.
          </h2>
          <StartButton>Crear cuenta</StartButton>
        </section>
      </main>
      <ProductFooter />
    </MarketingShell>
  );
}
