'use client';
import { useTheme } from '@/store/ThemeProvider';
import styles from './theme.module.css';
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={'Activar modo ' + (theme === 'dark' ? 'claro' : 'oscuro')}
      aria-pressed={theme === 'light'}
    >
      <span aria-hidden="true" className={styles.symbol} />
      <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
