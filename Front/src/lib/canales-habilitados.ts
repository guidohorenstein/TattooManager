// WhatsApp requiere la verificación del negocio en Meta para conectar números de
// terceros. Hasta entonces la conexión queda oculta; se activa con la variable.
export const whatsappHabilitado = process.env.NEXT_PUBLIC_WHATSAPP_HABILITADO === '1';
