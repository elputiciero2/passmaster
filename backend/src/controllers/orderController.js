const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketService = require('../services/ticketService');

class OrderController {
  static async checkout(req, res) {
    try {
      const { items, paymentInfo } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe seleccionar al menos un tipo de entrada para comprar.'
        });
      }

      const result = await TicketService.purchaseTickets({
        userId,
        items,
        paymentInfo: paymentInfo || {}
      });

      return res.status(201).json({
        success: true,
        message: '¡Compra procesada y tickets generados exitosamente!',
        data: result
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Error al procesar la compra.'
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
