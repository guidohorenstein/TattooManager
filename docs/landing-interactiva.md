# Landing de TattooManager

La portada comercial reúne la presentación del producto, una demo interactiva, una composición de portafolio en 3D, los planes y el contacto.

## Temas

El control del encabezado cambia entre claro y oscuro. La preferencia se guarda en la cookie tattoomanager_theme durante un año y se lee en el servidor para renderizar el tema elegido desde el primer momento. El tema se aplica a la landing; los paneles profesionales conservan su configuración visual.

## Demo del espacio de trabajo

La demo utiliza datos ficticios de Trazo Estudio y un estado local compartido entre Resumen, Consultas, Agenda, Mensajes, Trabajos y Recordatorios. No requiere sesión ni realiza operaciones sobre la base de datos.

El recorrido permite preparar una propuesta con artista e importe, simular la elección del cliente y reservar una sesión de dos horas. La agenda bloquea los horarios ocupados por el mismo artista. Los estados, indicadores y mensajes se actualizan juntos. También permite buscar consultas, escribir mensajes locales, publicar o guardar trabajos como borradores y cambiar los recordatorios.

El botón Reiniciar demo y la recarga restablecen todos los datos. Los mensajes y recordatorios de esta demo no se envían a servicios externos. El modelo y sus transiciones están en Front/src/components/marketing/demo-model.ts; sus pruebas están en Front/tests/demo-model.test.ts. Para ejecutarlas desde la raíz con las dependencias del monorepositorio instaladas:

    node --import ./Back/node_modules/tsx/dist/loader.mjs --test Front/tests/demo-model.test.ts

## Interacción y movimiento

El portafolio utiliza perspectiva y transformaciones CSS 3D, imágenes de Cloudinary y desplazamiento suave según el puntero. Los trabajos pueden cambiarse con botones, teclado o pantalla táctil. No necesita WebGL ni descarga un motor 3D.

Las entradas al desplazarse son progresivas: el contenido permanece disponible si JavaScript no se ejecuta. Las animaciones se desactivan con prefers-reduced-motion.

## Contacto

El formulario integrado utiliza la acción de servidor sendContactMessage y el endpoint POST /api/contacto. Valida nombre, email y un mensaje de 10 a 5000 caracteres. Muestra errores junto a los campos, bloquea envíos repetidos mientras espera y conserva el mensaje ante un error. El backend envía el correo con el transporte configurado y aplica su limitador de solicitudes. El contacto es real y está separado del estado de la demo.
