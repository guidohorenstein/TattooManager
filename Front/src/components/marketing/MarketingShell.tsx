'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './marketing.module.css';
import { useTheme } from '@/store/ThemeProvider';
export const useMarketingTheme = useTheme;
export function MarketingShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = element.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    targets.forEach((target) => observer.observe(target));
    element.setAttribute('data-motion', 'ready');
    return () => observer.disconnect();
  }, []);
  return (
    <div id="inicio" ref={root} className={styles.page}>
      {children}
    </div>
  );
}
export { ThemeToggle } from '@/components/theme/ThemeToggle';
