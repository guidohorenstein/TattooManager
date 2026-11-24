import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

// Encabezados de seguridad para todas las páginas. La CSP completa requiere nonces
// para los scripts de Next y Mercado Pago; por ahora solo se impide embeber el sitio.
const encabezadosSeguridad = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const backend =
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4002/api';
    return [{ source: '/api/:path*', destination: `${backend.replace(/\/+$/, '')}/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: encabezadosSeguridad }];
  },
  images: {
    // Solo Cloudinary: con un comodín, /_next/image funcionaría como proxy abierto
    // de imágenes de cualquier sitio a costa de la cuota de Vercel.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }],
  },
};

export default withSentryConfig(nextConfig, {
  org: 'guido-horenstein',
  project: 'tattoomanager-frontend',
  // Sube los source maps solo si SENTRY_AUTH_TOKEN está definido en el build (Vercel).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
