# Registro y acceso profesional

TattooManager ofrece registro para `ARTISTA` y `ESTUDIO_ADMIN`. El alta de estudios crea el negocio y el vínculo con su titular en una transacción. El rol `SUPERADMIN` no se registra públicamente.

Los clientes completan consultas sin cuenta desde la página del negocio y continúan el recorrido con el estudio. Los contactos, consultas y turnos siguen siendo registros del negocio. Las cuentas históricas de rol `CLIENTE` no pueden iniciar sesión por contraseña, Google ni reutilizar sesiones anteriores.

## Validación

El nombre personal admite de 2 a 20 caracteres, solo letras Unicode y espacios entre palabras. El nombre artístico y el nombre del estudio admiten de 2 a 50 caracteres.

Registro y restablecimiento de contraseña exigen al menos 9 caracteres, una mayúscula, un número y un símbolo. El máximo de 72 bytes evita truncamiento en bcrypt. La confirmación debe coincidir. El inicio de sesión conserva la compatibilidad con contraseñas anteriores, siempre que correspondan a una cuenta profesional.

## Google

`GET /api/auth/google` inicia el acceso de una cuenta existente. `POST /api/auth/google/registro` acepta uno de estos perfiles:

```json
{ "rol": "ARTISTA", "nombreArtistico": "Ana" }
```

```json
{ "rol": "ESTUDIO_ADMIN", "nombreEstudio": "Estudio Norte" }
```

La cookie HttpOnly `tattoomanager_google_oauth` conserva el flujo firmado durante diez minutos. El backend verifica state, nonce, PKCE e identidad de Google. Preparar el acceso no crea usuarios.

Una cuenta nueva de Google no tiene contraseña local y puede crearla mediante el enlace enviado por correo. El login de una cuenta existente conserva su rol y pertenencia al estudio. No se vinculan automáticamente cuentas con igual email y distinto método de acceso.

## Sesión

La cookie `tattoomanager_session` es HttpOnly, SameSite Lax y Secure en producción. La sesión vence tras 7 días sin uso y se renueva con la actividad hasta un máximo de 30 días. Se guarda en la base y puede revocarse. Los roles y la pertenencia se consultan al validar cada petición. Los paneles verifican además el plan vigente.

Las páginas públicas y los formularios no necesitan consultar una sesión del cliente. El panel conserva la autenticación y los permisos profesionales.
