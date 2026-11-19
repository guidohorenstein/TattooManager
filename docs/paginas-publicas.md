# Páginas públicas por negocio

La portada `/` presenta TattooManager para artistas y titulares de estudio. Las rutas anteriores `/clientes` y `/estudios` redirigen a esta portada.

Cada negocio tiene una página independiente, accesible sin cuenta de cliente.

| Página      | API                               |
| ----------- | --------------------------------- |
| `/e/[slug]` | `GET /api/paginas/estudios/:slug` |
| `/a/[id]`   | `GET /api/paginas/artistas/:id`   |

La página muestra la presentación, obras publicadas, artistas activos, horarios habituales y ubicación del perfil. La galería admite filtros por estilo y detalle ampliado. El presupuesto utiliza el formulario existente del negocio.

El estudio necesita una suscripción vigente de su titular. La página individual requiere un artista independiente con plan vigente. Los artistas vinculados comparten la página del estudio y no disponen de una página individual separada.

Las consultas están acotadas por negocio y no devuelven email de acceso, contraseñas, documentos, clientes, citas, bloqueos ni conversaciones. Los horarios públicos describen la semana habitual, no los espacios disponibles de una agenda privada.

## Edición y enlace

La información se administra desde Perfil, Mis trabajos y Disponibilidad. El enlace público aparece en Configuración, junto al formulario. El estudio usa como portada un trabajo publicado; el artista independiente utiliza su foto de trabajo o una obra publicada.

El módulo backend `paginas-publicas` tiene entity, repository, service, controller y routes. No requiere tablas nuevas.

## Demostración

`/ejemplo/estudio` muestra una composición con datos de ejemplo identificados como tales. Su formulario de demostración no envía consultas ni guarda datos.

## Contacto comercial

`POST /api/contacto` valida nombre, email y mensaje y utiliza el transporte de correo del backend. El destinatario se configura con `CONTACT_EMAIL`; si está vacío utiliza `BREVO_SENDER_EMAIL`. El endpoint limita los envíos por IP. El frontend no necesita credenciales del proveedor de correo.
