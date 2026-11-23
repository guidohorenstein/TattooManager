'use client';
import Dropdown from 'react-bootstrap/Dropdown';
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

export function ThemeMenuItem() {
  const { theme, toggle } = useTheme();
  return (
    <Dropdown.Item
      as="button"
      className={styles.menuItem}
      onClick={toggle}
      aria-label={'Cambiar a modo ' + (theme === 'dark' ? 'claro' : 'oscuro')}
    >
      <span className={styles.menuLabel}>
        <span className={styles.symbol} aria-hidden="true" /> Apariencia
      </span>
      <span className={styles.currentTheme}>{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
    </Dropdown.Item>
  );
}
