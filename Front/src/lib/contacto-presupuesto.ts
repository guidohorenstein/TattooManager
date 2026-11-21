export function normalizarTelefono(valor: string) {
  return valor.trim().replace(/[\s()-]/g, '');
}
export function erroresContacto(datos: { nombre: string; email: string; telefono: string }) {
  const errores: Partial<Record<'nombre' | 'email' | 'telefono', string>> = {};
  const nombre = datos.nombre.trim().normalize('NFC').replace(/ +/g, ' ');
  if (nombre.length < 2 || nombre.length > 80)
    errores.nombre = 'Ingresá tu nombre completo, de 2 a 80 caracteres.';
  if (datos.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
    errores.email = 'Ingresá un correo electrónico válido.';
  if (!/^\+[1-9]\d{7,14}$/.test(normalizarTelefono(datos.telefono)))
    errores.telefono = 'Incluí +, el código de país y entre 8 y 15 dígitos.';
  return errores;
}
