import styles from './brand.module.css';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={styles.brand} aria-label="TattooManager">
      <span className={styles.mark} aria-hidden="true">
        tm
      </span>
      {!compact && (
        <span>
          Tattoo<span className={styles.light}>Manager</span>
        </span>
      )}
    </span>
  );
}
