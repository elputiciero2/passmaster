const test = require('node:test');
const assert = require('node:assert');
const { validateCard } = require('../src/services/paymentService');

const now = new Date(2026, 10, 15); // 15 nov 2026
const ok = { number: '4242 4242 4242 4242', holder: 'Ana Ruiz', expDate: '12/30', cvv: '123' };

test('acepta una tarjeta válida', () => {
  assert.strictEqual(validateCard(ok, now), null);
});

test('la tarjeta vale durante todo su mes de expiración', () => {
  assert.strictEqual(validateCard({ ...ok, expDate: '11/26' }, now), null);
  assert.match(validateCard({ ...ok, expDate: '10/26' }, now), /vencida/);
});

test('rechaza las tarjetas de prueba de rechazo', () => {
  assert.match(validateCard({ ...ok, number: '4000000000000002' }, now), /rechazada/);
  assert.match(validateCard({ ...ok, number: '4000 0000 0000 9995' }, now), /insuficientes/);
});

test('rechaza datos mal formados', () => {
  assert.match(validateCard({ ...ok, number: '4242424242424241' }, now), /Número/); // falla Luhn
  assert.match(validateCard({ ...ok, number: { $ne: 1 } }, now), /Número/);
  assert.match(validateCard({ ...ok, expDate: '13/30' }, now), /expiración/);
  assert.match(validateCard({ ...ok, cvv: '12' }, now), /CVV/);
  assert.match(validateCard({ ...ok, holder: '  ' }, now), /titular/);
  assert.match(validateCard(null, now), /Faltan/);
});
