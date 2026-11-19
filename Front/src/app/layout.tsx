import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import localFont from 'next/font/local';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { AuthProvider } from '@/store/AuthProvider';
import { GoogleAuthNotice } from '@/components/auth/GoogleAuthNotice';
import { CuentaEliminadaNotice } from '@/components/auth/CuentaEliminadaNotice';
import { UnsavedChangesProvider } from '@/components/forms/UnsavedChanges';

const plex = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-plex',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'TattooManager',
  description: 'Gestión profesional para artistas y estudios de tatuajes.',
  applicationName: 'TattooManager',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR" className={plex.variable} data-scroll-behavior="smooth">
      <body>
        <UnsavedChangesProvider>
          <AuthProvider>
            {children}
            <Suspense fallback={null}>
              <GoogleAuthNotice />
              <CuentaEliminadaNotice />
            </Suspense>
          </AuthProvider>
        </UnsavedChangesProvider>
      </body>
    </html>
  );
}
