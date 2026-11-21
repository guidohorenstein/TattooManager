# Frontend de TattooManager

Aplicación Next.js App Router con React, TypeScript, Bootstrap y React Bootstrap.

## Ejecución

Desde Front, ejecutá `npm ci` y `npm run dev`. El sitio se abre en http://127.0.0.1:3002. La API debe estar activa en el puerto 4002.

Front/.env.local configura el backend y las imágenes públicas.

```dotenv
API_URL=http://127.0.0.1:4002/api
NEXT_PUBLIC_CLOUDINARY_FORMULARIO_BASE_URL=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
```

El navegador utiliza el proxy /api del mismo dominio. Las credenciales privadas de base, imágenes, correo e integraciones pertenecen al backend.

## Páginas

| Ruta                                                    | Función                                               |
| ------------------------------------------------------- | ----------------------------------------------------- |
| /                                                       | Landing del producto para profesionales               |
| /clientes y /estudios                                   | Redirecciones a la portada                            |
| /e/[slug]                                               | Página pública de un estudio                          |
| /a/[id]                                                 | Página pública de un artista independiente            |
| /ejemplo/estudio                                        | Boceto de una página de estudio con datos de ejemplo  |
| /ejemplo/formulario                                     | Formulario de demostración sin envíos ni persistencia |
| /cotizacion/[slug]                                      | Consulta para un estudio, sin registro                |
| /cotizacion/artista/[slug]                              | Consulta para un artista independiente, sin registro  |
| /estudio                                                | Panel del titular                                     |
| /artista                                                | Panel del artista, según su modalidad                 |
| /admin                                                  | Administración de la plataforma                       |
| /contacto                                               | Contacto comercial mediante el backend                |
| /checkout                                               | Suscripción y frecuencia de pago                      |
| /checkout/success, /checkout/pending, /checkout/failure | Resultado del pago confirmado por el backend          |
| /recuperar-contrasena                                   | Solicitud de enlace de contraseña                     |
| /restablecer-contrasena                                 | Creación o cambio de contraseña                       |
| /verificar-email                                        | Verificación del correo                               |

El registro y login se abren desde la cabecera. Solo se registran artistas y titulares de estudio, con contraseña o Google. Los clientes consultan desde la página del negocio sin crear una cuenta. Las páginas públicas no solicitan una sesión del cliente.

## Identidad y componentes

La marca compartida está en src/components/brand. La landing de producto está en src/components/marketing. Las páginas por negocio usan src/components/public-profile. Los paneles conservan su estructura y una paleta neutral. Los errores y estados mantienen colores semánticos, y los canales conservan su identidad cuando corresponde.

Las imágenes del formulario, obras de ejemplo y capturas del producto proceden de Cloudinary. El favicon SVG y el icono de Apple son parte de la identidad de la aplicación.

## Checkout

La ruta /checkout acepta plan INDIVIDUAL o ESTUDIO y cycle MENSUAL o ANUAL. Los importes definitivos proceden del backend. El pago depende de la configuración de Mercado Pago de la instalación. Los integrantes de un estudio acceden bajo el plan de su titular.

## Verificación

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Más detalles en [páginas públicas](../docs/paginas-publicas.md), [registro y acceso](../docs/registro-por-landing.md) y [estructura del frontend](docs/architecture.md).
