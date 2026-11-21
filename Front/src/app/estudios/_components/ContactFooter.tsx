import Link from 'next/link';
import { Brand } from '@/components/brand/Brand';
import styles from './ContactFooter.module.css';
export function ContactFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <Link href="/" className={styles.brand}>
          <Brand />
        </Link>
        <span className={styles.copyright}>© TattooManager</span>
        <nav className={styles.links} aria-label="Enlaces del sitio">
          <Link className={styles.footerLink} href="/#producto">
            La plataforma
          </Link>
          <Link className={styles.footerLink} href="/#planes">
            Planes
          </Link>
          <Link className={styles.footerLink} href="/contacto">
            Contacto
          </Link>
          <Link className={styles.footerLink} href="/terminos-y-condiciones">
            Términos y condiciones
          </Link>
        </nav>
      </div>
    </footer>
  );
}
