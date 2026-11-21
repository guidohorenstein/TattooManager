# Estructura del frontend

TattooManager usa Next.js App Router, React, TypeScript, Bootstrap y React Bootstrap.

## Organización

| Carpeta                       | Responsabilidad                                                    |
| ----------------------------- | ------------------------------------------------------------------ |
| src/app                       | Rutas, layout y estilos globales                                   |
| src/components/brand          | Marca y monograma compartidos                                      |
| src/components/marketing      | Cabecera, recorrido del producto, registro y precios de la portada |
| src/components/public-profile | Presentación del negocio y galería pública con filtros y detalle   |
| src/app/e/[slug]              | Página pública del estudio                                         |
| src/app/a/[id]                | Página pública del artista independiente                           |
| src/app/ejemplo               | Demostración identificada como ejemplo                             |
| src/app/cotizacion            | Formularios públicos dirigidos a un negocio                        |
| src/app/estudio               | Panel privado del titular y gestión del equipo                     |
| src/app/artista               | Panel privado del artista según su modalidad                       |
| src/components/panel          | Componentes y formularios compartidos de los paneles               |
| src/app/(auth)                | Registro, login, verificación y recuperación                       |
| src/components/auth           | Presentación y controles de acceso                                 |
| src/components/forms          | Campos, validaciones y formularios reutilizables                   |
| src/store                     | Contextos de autenticación y datos del negocio                     |
| src/services                  | Peticiones a la API                                                |
| src/lib                       | Tipos de errores, validaciones y utilidades                        |
| src/types                     | Contratos de datos del frontend                                    |

Las rutas anteriores /clientes y /estudios redirigen a la portada. La landing de producto se compone en src/app/page.tsx. Los componentes de la portada anterior que aún no se utilizan no forman parte del recorrido actual.

## Datos

El navegador utiliza /api en el mismo dominio. El proxy de Next.js dirige las peticiones al backend indicado por API_URL. Las páginas de negocio consultan su endpoint específico y reciben únicamente datos públicos. El servidor resuelve las páginas por estudio o artista y genera sus metadatos.

AuthProvider comparte la cuenta profesional y valida su sesión. Omite la consulta de sesión en páginas públicas y formularios. Los paneles mantienen sus guardas de rol, membresía y suscripción. Los modales de login y registro se cargan cuando se abren.

## Identidad y estilos

globals.css define tipografía y tokens comunes. La portada tiene fondo oscuro; los paneles y páginas públicas utilizan superficies claras. La paleta principal es monocromática y conserva colores semánticos para errores y estados.

Los módulos CSS aíslan los estilos por componente. La tipografía WOFF2 de IBM Plex Sans se sirve con next/font. Las fotografías y las capturas proceden de Cloudinary. El favicon SVG y el icono Apple son recursos de identidad generados por la aplicación.

## Formularios y acceso

Los formularios usan Formik y validan nuevamente sus datos en el backend. El formulario de presupuesto guarda los datos de contacto y las referencias de la consulta sin registrar una cuenta de cliente.

Los profesionales pueden iniciar sesión con contraseña o Google. Las cookies HttpOnly permanecen en el dominio del frontend. Las credenciales privadas de proveedores están en el backend.

## Paneles

PanelShell compone navegación, cabecera y cuenta. Las vistas de artista y estudio reutilizan componentes de agenda, consultas, clientes, mensajes, recordatorios y suscripción. Los datos se conectan mediante providers y servicios del módulo correspondiente.

Configuración incluye el enlace de página pública y el enlace directo al formulario. La presentación se actualiza desde Perfil, Mis trabajos y Disponibilidad. Los integrantes comparten el enlace del estudio.

Más detalles en [páginas públicas](../../docs/paginas-publicas.md), [autenticación](../../docs/registro-por-landing.md) y [backend](../../docs/estructura-backend.md).
