import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { demoReducer, initialDemo } from '../src/components/marketing/demo-model.js';
test('una consulta recorre propuesta, elección y reserva con historial compartido', () => {
  const start = initialDemo();
  const quote = demoReducer(start, {
    type: 'quote',
    id: 'sofia',
    artist: 'Nicolás Vera',
    price: 90000,
  });
  assert.equal(quote.leads[0]?.stage, 'propuesta');
  assert.equal(start.leads[0]?.stage, 'nueva');
  const accepted = demoReducer(quote, { type: 'accept', id: 'sofia' });
  const booked = demoReducer(accepted, { type: 'book', id: 'sofia', slot: 'sab-11' });
  assert.equal(booked.leads[0]?.stage, 'agendada');
  assert.equal(booked.leads[0]?.slot, 'sab-11');
  assert.match(booked.messages.sofia?.at(-1)?.text ?? '', /11:00 con Nicolás Vera/);
  assert.equal(booked.leads.filter((l) => l.stage === 'agendada').length, 2);
});
test('un artista no puede tener dos reservas en el mismo horario', () => {
  const quoted = demoReducer(initialDemo(), {
    type: 'quote',
    id: 'sofia',
    artist: 'Lucía Torres',
    price: 85000,
  });
  const accepted = demoReducer(quoted, { type: 'accept', id: 'sofia' });
  const conflict = demoReducer(accepted, { type: 'book', id: 'sofia', slot: 'vie-15' });
  assert.equal(conflict.leads[0]?.slot, null);
  assert.match(conflict.feedback, /ocupado/);
});
test('cada artista mantiene su disponibilidad independiente', () => {
  const quoted = demoReducer(initialDemo(), {
    type: 'quote',
    id: 'sofia',
    artist: 'Nicolás Vera',
    price: 85000,
  });
  const accepted = demoReducer(quoted, { type: 'accept', id: 'sofia' });
  const booked = demoReducer(accepted, { type: 'book', id: 'sofia', slot: 'vie-15' });
  assert.equal(booked.leads[0]?.slot, 'vie-15');
});
test('no se agenda sin elección ni se duplican reservas o propuestas', () => {
  const start = initialDemo();
  assert.equal(
    demoReducer(start, { type: 'book', id: 'sofia', slot: 'sab-11' }).leads[0]?.slot,
    null,
  );
  const quote = demoReducer(start, {
    type: 'quote',
    id: 'sofia',
    artist: 'Lucía Torres',
    price: 85000,
  });
  const duplicate = demoReducer(quote, {
    type: 'quote',
    id: 'sofia',
    artist: 'Lucía Torres',
    price: 85000,
  });
  assert.equal(duplicate.messages.sofia?.length, 3);
  const accepted = demoReducer(quote, { type: 'accept', id: 'sofia' });
  const booked = demoReducer(accepted, { type: 'book', id: 'sofia', slot: 'sab-11' });
  const twice = demoReducer(booked, { type: 'book', id: 'sofia', slot: 'sab-15' });
  assert.equal(twice.leads[0]?.slot, 'sab-11');
  assert.equal(twice.messages.sofia?.length, 4);
});
test('rechaza importes inválidos y artistas que no pertenecen al equipo', () => {
  for (const price of [NaN, Infinity, 0, -1, 10000001])
    assert.equal(
      demoReducer(initialDemo(), { type: 'quote', id: 'sofia', artist: 'Lucía Torres', price })
        .leads[0]?.stage,
      'nueva',
    );
  assert.equal(
    demoReducer(initialDemo(), { type: 'quote', id: 'sofia', artist: 'Otro', price: 85000 })
      .leads[0]?.stage,
    'nueva',
  );
});
test('los mensajes se conservan por cliente y se descartan mensajes vacíos', () => {
  const start = initialDemo();
  assert.equal(demoReducer(start, { type: 'message', id: 'sofia', text: '  ' }), start);
  const next = demoReducer(start, { type: 'message', id: 'sofia', text: ' Listo, Sofía. ' });
  assert.equal(next.messages.sofia?.at(-1)?.text, 'Listo, Sofía.');
  assert.deepEqual(next.messages.mateo, start.messages.mateo);
});
test('publicaciones, recordatorios y consultas vuelven al estado inicial al reiniciar', () => {
  let state = demoReducer(initialDemo(), { type: 'publish', index: 2 });
  state = demoReducer(state, { type: 'reminder', id: 'turno' });
  assert.equal(state.published.filter(Boolean).length, 3);
  assert.equal(state.reminders.turno, false);
  assert.deepEqual(demoReducer(state, { type: 'reset' }), initialDemo());
});
