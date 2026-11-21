import Link from 'next/link';
import { Brand } from '@/components/brand/Brand';
import { AuthControls } from '@/components/auth/AuthControls';
import { ThemeToggle } from './MarketingShell';
import styles from './footer.module.css';
const groups = [
  {
    title: 'Producto',
    links: [
      ['Espacio de trabajo', '/#producto'],
      ['Cómo funciona', '/#recorrido'],
      ['Tu página pública', '/#tu-pagina'],
      ['Asistente', '/#asistente'],
      ['Planes y precios', '/#planes'],
    ],
  },
  {
    title: 'Recursos',
    links: [
      ['Probar la demo', '/#producto'],
      ['Estudio de ejemplo', '/ejemplo/estudio'],
      ['Preguntas frecuentes', '/#preguntas'],
      ['Enviar consulta', '/#contacto'],
    ],
  },
];
export function ProductFooter() {
  return (
    <footer className={styles.footer} aria-label="Pie de página de TattooManager">
      <div className={styles.main}>
        <div className={styles.identity}>
          <Link href="/" className={styles.brand} aria-label="TattooManager, volver al inicio">
            <span aria-hidden="true">
              <Brand />
            </span>
          </Link>
          <p>
            Tu arte tiene su lugar.
            <br />
            Tu negocio, también.
          </p>
          <span>El espacio de trabajo para artistas independientes y estudios de tatuajes.</span>
        </div>
        {groups.map((group) => (
          <nav
            key={group.title}
            aria-label={group.title + ' en el pie de página'}
            className={styles.group}
          >
            <h3>{group.title}</h3>
            <ul>
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href!}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label="Cuenta en el pie de página" className={styles.group}>
          <h3>Tu cuenta</h3>
          <AuthControls variant="footer" />
          <Link href="/recuperar-contrasena">Recuperar acceso</Link>
          <p>
            ¿Necesitás ayuda para empezar?
            <br />
            <Link href="/#contacto">
              Enviar consulta <span aria-hidden="true">↗</span>
            </Link>
          </p>
        </nav>
      </div>
      <details className={styles.cookies}>
        <summary>
          Cookies y preferencias <span aria-hidden="true">+</span>
        </summary>
        <div className={styles.cookieContent}>
          <p>
            Usamos cookies para mantener tu sesión, completar el acceso con Google y recordar el
            tema que elegiste. Algunas preferencias de la interfaz se guardan en tu navegador.
          </p>
          <dl>
            <div>
              <dt>Sesión y acceso con Google</dt>
              <dd>
                Permiten identificar tu sesión y validar el inicio de sesión. Vencen según la
                duración del acceso.
              </dd>
            </div>
            <div>
              <dt>Modo claro u oscuro</dt>
              <dd>
                La cookie <code>tattoomanager_theme</code> recuerda tu elección durante un año.
              </dd>
            </div>
            <div>
              <dt>Preferencias de la interfaz</dt>
              <dd>
                El país seleccionado y el estado del menú lateral se guardan en el almacenamiento
                local del navegador.
              </dd>
            </div>
          </dl>
          <p>
            Podés eliminarlas desde tu navegador. Si borrás las de sesión, tendrás que volver a
            ingresar. <Link href="/privacidad#cookies">Más información sobre tus datos ↗</Link>
          </p>
        </div>
      </details>
      <div className={styles.bottom}>
        <small>© {new Date().getFullYear()} TattooManager. Todos los derechos reservados.</small>
        <nav aria-label="Información legal">
          <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
        <div className={styles.utilities}>
          <ThemeToggle />
          <a href="#inicio">
            Volver arriba <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
