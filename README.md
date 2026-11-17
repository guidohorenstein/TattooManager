# TattooManager

Aplicación para conectar clientes con artistas y estudios de tatuajes. Incluye páginas públicas, registro por tipo de cuenta, acceso con contraseña y Google, sesiones propias, carga de imágenes, reseñas y correos de cuenta.

## Desarrollo local

Usá Node.js 22. Creá una base PostgreSQL propia y copiá `Back/.env.example` a `Back/.env` y `Front/.env.example` a `Front/.env.local`.
Configurá `DATABASE_URL`, `DIRECT_URL` y un `JWT_SECRET` propio antes de conectar la API.
En `Back`, ejecutá `npm ci`, `npm run db:generate` y `npm run dev`. En otra terminal, desde `Front`, ejecutá `npm ci` y `npm run dev`.
El frontend usa `127.0.0.1:3002` y la API usa `127.0.0.1:4002`. Los correos del backend se guardan en local mientras `MAIL_TRANSPORT=preview`.

## Integraciones

Primero configurá la base de datos nueva. Después cargá las credenciales propias de Cloudinary, Google, correo, Mercado Pago, Meta y Groq según las funciones que vayas a usar.
El formulario de cotización usa las referencias públicas del proyecto del que se tomó esta copia hasta que definas `NEXT_PUBLIC_CLOUDINARY_FORMULARIO_BASE_URL` en el frontend.

## Estructura

| Carpeta  | Contenido                                             |
| -------- | ----------------------------------------------------- |
| `Front/` | Aplicación Next.js con React, TypeScript y Bootstrap. |
| `Back/`  | API Express con TypeScript y Prisma.                  |
| `docs/`  | Documentación del funcionamiento y la arquitectura.   |

PostgreSQL en Supabase almacena los datos. Cloudinary almacena las imágenes y Resend envía correos. InkManager administra la autenticación y los roles de la aplicación.

## Documentación

- [Frontend: ejecución y páginas](Front/README.md).
- [Estructura del frontend](Front/docs/architecture.md).
- [Backend: ejecución y configuración](Back/README.md).
- [Estructura y endpoints del backend](docs/estructura-backend.md).
- [Registro y acceso con Google](docs/registro-por-landing.md).
- [Correos y recuperación de acceso](docs/correos-y-recuperacion.md).
