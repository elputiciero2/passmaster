const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketService = require('../services/ticketService');
const { PurchaseError } = TicketService;
const { toInt } = require('../utils/validate');

const MAX_PER_TIER = 10;

class OrderController {
  static async checkout(req, res) {
    try {
      const { items, paymentInfo } = req.body || {};
      const userId = req.user.id;

      if (!Array.isArray(items) || items.length === 0 || items.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar entre 1 y 10 tipos de entrada para comprar.'
        });
      }

      const cleanItems = items.map((item) => ({
        tierId: toInt(item && item.tierId, 1, 4294967295),
        quantity: toInt(item && item.quantity, 1, MAX_PER_TIER)
      }));

      // Una localidad repetida se validaría dos veces contra el mismo cupo
      const tierIds = cleanItems.map((item) => item.tierId);
      if (tierIds.includes(null) || cleanItems.some((item) => item.quantity === null) || new Set(tierIds).size !== tierIds.length) {
        return res.status(400).json({
          success: false,
          message: `Cada localidad debe aparecer una sola vez, con una cantidad entre 1 y ${MAX_PER_TIER}.`
        });
      }

      const payment = paymentInfo && typeof paymentInfo === 'object' ? paymentInfo : {};

      const result = await TicketService.purchaseTickets({
        userId,
        items: cleanItems,
        paymentInfo: { card: payment.card, token: payment.token }
      });

      return res.status(201).json({
        success: true,
        message: '¡Compra procesada y tickets generados exitosamente!',
        data: result
      });
    } catch (error) {
      // Solo los errores de negocio llevan un mensaje pensado para el usuario
      if (error instanceof PurchaseError) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la compra.',
        error: error.message
      });
    }
  }

  static async getMyOrders(req, res) {
    try {
      const orders = await Order.getByUser(req.user.id);
      return res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al consultar órdenes del usuario.',
        error: error.message
      });
    }
  }

  static async getOrderDetails(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada.'
        });
      }

      // Solo el dueño de la orden o un ADMIN pueden verla
      if (order.user_id !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para visualizar esta orden.'
        });
      }

      const tickets = await Ticket.getByOrderId(id);

      return res.json({
        success: true,
        data: {
          ...order,
          tickets
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener detalle de la orden.',
        error: error.message
      });
    }
  }

  static async getAllOrdersAdmin(req, res) {
    try {
      const orders = await Order.getAllOrders();
      return res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener listado general de órdenes.',
        error: error.message
      });
    }
  }
}

module.exports = OrderController;
