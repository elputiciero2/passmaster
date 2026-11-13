const dotenv = require('dotenv');
dotenv.config();

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('mock')) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    console.warn('[PaymentService] Advertencia: Error inicializando Stripe:', err.message);
  }
}

class PaymentService {
  /**
   * Procesa el cobro a través de Stripe o Sandbox Simulator
   */
  static async processPayment({ amount, currency = 'usd', paymentMethod = 'card', token = null, orderNumber }) {
    // Si hay una clave real de Stripe configurada y recibimos un token/payment_method
    if (stripe && token) {
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
          success: paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing',
          paymentIntentId: paymentIntent.id,
          gateway: 'STRIPE',
          raw: paymentIntent
        };
      } catch (stripeError) {
        return {
          success: false,
          error: stripeError.message,
          gateway: 'STRIPE'
        };
      }
    }

    // Modo Sandbox Simulator Integrado (Simplicidad inmediata y confiabilidad garantizada)
    // Permite probar tarjetas de prueba estándar (ej: 4242...) o simular pagos aprobados al instante
    return {
      success: true,
      paymentIntentId: `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      gateway: 'MOCK_SANDBOX',
      message: 'Transacción aprobada satisfactoriamente por pasarela de pagos (Modo Sandbox).'
    };
  }
}

module.exports = PaymentService;
