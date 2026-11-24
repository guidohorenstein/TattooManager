// Se carga con `node --import` antes que la aplicación para que Sentry pueda
// instrumentar Express, HTTP y Prisma. Sin SENTRY_DSN no envía nada.
import "dotenv/config";
import * as Sentry from "@sentry/node";

const produccion = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT ?? (produccion ? "production" : "development"),
  // Render expone el commit desplegado; así cada error queda asociado a su versión.
  release: process.env.SENTRY_RELEASE ?? process.env.RENDER_GIT_COMMIT,
  tracesSampleRate: produccion ? 0.1 : 1.0,
  // Los datos de clientes de los estudios no deben salir hacia Sentry:
  // ni usuario e IP, ni cookies, ni cuerpos ni parámetros de las solicitudes.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    urlQueryParams: false,
  },
  integrations: [
    // Muchos errores se registran con console.error dentro de un catch;
    // así también llegan a Sentry como logs.
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],
});
