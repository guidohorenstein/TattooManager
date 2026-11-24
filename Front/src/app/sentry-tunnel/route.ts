// En el build de Vercel, @sentry/nextjs genera esta ruta (túnel de eventos) como
// route.js sin tipos si no existe, y eso rompe el chequeo de tipos de Next.
// Declararla en TypeScript evita esa generación.
export { POST } from '@sentry/nextjs/tunnel';
