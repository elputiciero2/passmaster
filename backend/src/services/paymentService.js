const crypto = require('crypto');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn('[PaymentService] Advertencia: Error inicializando Stripe:', err.message);
  }
}

// Tarjetas de prueba que el sandbox rechaza, igual que las de Stripe
const DECLINED_CARDS = {
  '4000000000000002': 'La tarjeta fue rechazada por el banco emisor.',
  '4000000000009995': 'Fondos insuficientes.',
  '4000000000000069': 'La tarjeta está vencida.'
};

function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Valida los datos de la tarjeta. Devuelve un mensaje de error o null si es aceptable.
 */
function validateCard(card, now = new Date()) {
  if (!card || typeof card !== 'object') return 'Faltan los datos de la tarjeta.';
  const { number, holder, expDate, cvv } = card;

  if (typeof holder !== 'string' || !holder.trim() || holder.length > 100) return 'Nombre del titular inválido.';

  const digits = typeof number === 'string' ? number.replace(/[\s-]/g, '') : '';
  if (!/^\d{13,19}$/.test(digits) || !passesLuhn(digits)) return 'Número de tarjeta inválido.';

  const exp = typeof expDate === 'string' ? expDate.match(/^(0[1-9]|1[0-2])\/(\d{2})$/) : null;
  if (!exp) return 'Fecha de expiración inválida (use MM/AA).';
  // La tarjeta vale hasta el último día del mes indicado
  const expiresAt = new Date(2000 + Number(exp[2]), Number(exp[1]), 1);
  if (expiresAt <= now) return 'La tarjeta está vencida.';

  if (typeof cvv !== 'string' || !/^\d{3,4}$/.test(cvv)) return 'Código de seguridad (CVV) inválido.';

  return DECLINED_CARDS[digits] || null;
}

class PaymentService {
  /**
   * Procesa el cobro con Stripe (si hay clave y token) o con el sandbox integrado.
   * Los datos de la tarjeta solo se validan: no se guardan ni se registran.
   */
  static async processPayment({ amount, currency = 'usd', card = null, token = null, orderNumber }) {
    if (stripe && typeof token === 'string') {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // En centavos
          currency,
          payment_method: token,
          confirm: true,
          description: `Orden PassMaster #${orderNumber}`,
          return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order/success`
        });

        return {
          success: paymentIntent.status === 'succeeded',
          paymentIntentId: paymentIntent.id,
          gateway: 'STRIPE',
          error: paymentIntent.status === 'succeeded' ? undefined : 'El pago no fue confirmado.'
        };
      } catch (stripeError) {
        console.error('[PaymentService] Stripe:', stripeError.message);
        return { success: false, error: 'El pago fue rechazado.', gateway: 'STRIPE' };
      }
    }

    const cardError = validateCard(card);
    if (cardError) {
      return { success: false, error: cardError, gateway: 'MOCK_SANDBOX' };
    }

    return {
      success: true,
      paymentIntentId: `pi_mock_${crypto.randomBytes(12).toString('hex')}`,
      gateway: 'MOCK_SANDBOX'
    };
  }
}

module.exports = PaymentService;
module.exports.validateCard = validateCard;
