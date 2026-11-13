const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateTicketSignature } = require('../utils/cryptoUtils');
const QRService = require('./qrService');
const PaymentService = require('./paymentService');

class TicketService {
  /**
   * Compra atómica y segura de tickets con bloqueo de concurrencia y pasarela de pagos
   */
  static async purchaseTickets({ userId, items, paymentInfo = {} }) {
    // items: Array of { tierId, quantity }
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let totalAmount = 0;
      const orderItemsToProcess = [];

      // 1. Validar disponibilidad y bloquear registros con FOR UPDATE
      for (const item of items) {
        const tierId = parseInt(item.tierId, 10);
        const qty = parseInt(item.quantity, 10);

        if (!tierId || qty <= 0) {
          throw new Error('Identificador de localidad o cantidad no válida.');
        }

        const [tiers] = await connection.query(
          `SELECT tt.*, e.title as event_title, e.status as event_status
           FROM ticket_tiers tt
           JOIN events e ON tt.event_id = e.id
           WHERE tt.id = ? FOR UPDATE`,
          [tierId]
        );

        if (tiers.length === 0) {
          throw new Error(`La localidad con ID ${tierId} no existe.`);
        }

        const tier = tiers[0];

        if (tier.event_status !== 'PUBLISHED') {
          throw new Error(`El evento "${tier.event_title}" no se encuentra activo.`);
        }

        if (tier.available_quantity < qty) {
          throw new Error(
            `Cupo insuficiente para "${tier.name}". Solicitados: ${qty}, disponibles: ${tier.available_quantity}.`
          );
        }

        const subtotal = parseFloat(tier.price) * qty;
        totalAmount += subtotal;

        orderItemsToProcess.push({
          tier,
          quantity: qty,
          subtotal
        });
      }

      // 2. Generar número único de orden
      const orderNumber = `PM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Procesar el pago con la pasarela seleccionada
      const paymentResult = await PaymentService.processPayment({
        amount: totalAmount,
        currency: 'usd',
        paymentMethod: paymentInfo.method || 'card',
        token: paymentInfo.token || null,
        orderNumber
      });

      if (!paymentResult.success) {
        throw new Error(`El pago fue rechazado por la pasarela: ${paymentResult.error || 'Error desconocido'}`);
      }

      // 4. Crear la orden de compra en MySQL
      const [orderResult] = await connection.query(
        `INSERT INTO orders (order_number, user_id, total_amount, payment_gateway, payment_intent_id, payment_status)
         VALUES (?, ?, ?, ?, ?, 'COMPLETED')`,
        [orderNumber, userId, totalAmount, paymentResult.gateway, paymentResult.paymentIntentId]
      );
      const orderId = orderResult.insertId;

      const generatedTickets = [];

      // 5. Descontar cupos y emitir boletos con identificadores únicos y firmas HMAC
      for (const item of orderItemsToProcess) {
        // Descontar inventario disponible
        await connection.query(
          `UPDATE ticket_tiers
           SET available_quantity = available_quantity - ?
           WHERE id = ?`,
          [item.quantity, item.tier.id]
        );

        for (let i = 0; i < item.quantity; i++) {
          const ticketCode = `TKT-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
          const qrSignature = generateTicketSignature(ticketCode, item.tier.id, orderId);

          const [ticketInsert] = await connection.query(
            `INSERT INTO tickets (order_id, ticket_tier_id, ticket_code, qr_signature, status)
             VALUES (?, ?, ?, ?, 'ACTIVE')`,
            [orderId, item.tier.id, ticketCode, qrSignature]
          );

          generatedTickets.push({
            id: ticketInsert.insertId,
            ticketCode,
            tierName: item.tier.name,
            price: item.tier.price,
            eventTitle: item.tier.event_title
          });
        }
      }

      // Confirmar transacción de manera atómica
      await connection.commit();

      return {
        success: true,
        orderId,
        orderNumber,
        totalAmount,
        gateway: paymentResult.gateway,
        tickets: generatedTickets
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = TicketService;
