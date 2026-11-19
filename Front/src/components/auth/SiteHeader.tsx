import { Brand } from '@/components/brand/Brand';
import Link from 'next/link';
import { AuthControls } from './AuthControls';
import styles from './auth.module.css';
import type { ContextoRegistro } from '@/types/forms';
export function SiteHeader({
  overlay = false,
  contextoRegistro = 'general',
}: {
  overlay?: boolean;
  contextoRegistro?: ContextoRegistro;
}) {
  return (
    <header className={`${styles.siteHeader} ${overlay ? styles.overlayHeader : ''}`}>
      <Link href="/" className={styles.brand} aria-label="TattooManager, inicio">
        <Brand />
      </Link>
      <AuthControls light={overlay} contextoRegistro={contextoRegistro} />
    </header>
  );
}
