const Ticket = require('../models/Ticket');
const QRService = require('../services/qrService');

class TicketController {
  static async getMyTickets(req, res) {
    try {
      const tickets = await Ticket.getByUserId(req.user.id);
      return res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener tickets del usuario.',
        error: error.message
      });
    }
  }

  static async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const ticket = await Ticket.findById(id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado.'
        });
      }

      // Validar permisos: solo el comprador, staff o admin
      if (ticket.buyer_email !== req.user.email && !['ADMIN', 'STAFF'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes autorización para acceder a este boleto.'
        });
      }

      // Generar imagen QR en Base64
      const qrDataUrl = await QRService.generateQRCodeDataUrl(ticket.ticket_code, ticket.qr_signature);

      return res.json({
        success: true,
        data: {
          ...ticket,
          qr_image: qrDataUrl
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al consultar boleto.',
        error: error.message
      });
    }
  }
}

module.exports = TicketController;
