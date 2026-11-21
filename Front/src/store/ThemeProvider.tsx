'use client';
import { useSyncExternalStore } from 'react';
const event = 'tattoomanager-theme';
function subscribe(callback: () => void) {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
}
const snapshot = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const serverSnapshot = () => 'dark' as const;
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  function toggle() {
    const next = snapshot() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.bsTheme = next;
    document.cookie =
      'tattoomanager_theme=' +
      next +
      '; Path=/; Max-Age=31536000; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
    window.dispatchEvent(new Event(event));
  }
  return { theme, toggle };
}
