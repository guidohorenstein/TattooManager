import assert from 'node:assert/strict';
import { test } from 'node:test';
import { erroresContacto, normalizarTelefono } from '../src/lib/contacto-presupuesto.js';
test('teléfono internacional normalizado y errores de contacto antes de enviar', () => {
  assert.equal(normalizarTelefono(' +54 (9) 11-1234 5678 '), '+5491112345678');
  const base = { nombre: 'Ana Pérez', email: 'ana@example.test', telefono: '+54 (9) 11-1234 5678' };
  assert.deepEqual(erroresContacto(base), {});
  for (const telefono of [
    '12345678',
    '+0123456789',
    '+54abc12345678',
    '+54123',
    '+1234567890123456',
  ])
    assert.ok(erroresContacto({ ...base, telefono }).telefono);
  assert.ok(erroresContacto({ ...base, nombre: 'A' }).nombre);
  assert.ok(erroresContacto({ ...base, email: 'sin-arroba' }).email);
});
