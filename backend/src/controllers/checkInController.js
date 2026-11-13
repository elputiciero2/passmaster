const Ticket = require('../models/Ticket');
const CheckInLog = require('../models/CheckInLog');
const QRService = require('../services/qrService');
const { verifyTicketSignature } = require('../utils/cryptoUtils');

class CheckInController {
  /**
   * Valida un ticket escaneado mediante QR o código manual
   */
  static async verifyAndCheckIn(req, res) {
    try {
      const { qrData, eventId, deviceInfo } = req.body;
      const staffUserId = req.user.id;

      if (!qrData) {
        return res.status(400).json({
          success: false,
          result: 'INVALID',
          message: 'Datos del escáner QR o código no proporcionados.'
        });
      }

      // 1. Extraer código y firma
      const parsed = QRService.parseAndValidate(qrData);
      const ticketCode = parsed.ticketCode;

      // 2. Buscar ticket en la base de datos
      const ticket = await Ticket.findByCode(ticketCode);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          result: 'INVALID',
          message: 'Boleto inexistente o código alterado.'
        });
      }

      // 3. Validar evento correspondiente (si se especificó en el puesto de acceso)
      if (eventId && parseInt(eventId, 10) !== ticket.event_id) {
        await CheckInLog.create({
          ticket_id: ticket.id,
          scanned_by_user_id: staffUserId,
          result: 'INVALID',
          device_info: `${deviceInfo || 'Scanner'} (Evento incorrecto: intentó ingresar a evento ${eventId})`
        });

        return res.status(400).json({
          success: false,
          result: 'WRONG_EVENT',
          message: `Este boleto pertenece a otro evento: "${ticket.event_title}".`,
          data: { ticket }
        });
      }

      // 4. Validar firma criptográfica si fue enviada en el QR
      if (parsed.signature) {
        const isSignatureValid = verifyTicketSignature(
          ticket.ticket_code,
          ticket.ticket_tier_id,
          ticket.order_id,
          parsed.signature
        );

        if (!isSignatureValid) {
          await CheckInLog.create({
            ticket_id: ticket.id,
            scanned_by_user_id: staffUserId,
            result: 'INVALID',
            device_info: `${deviceInfo || 'Scanner'} (Firma digital inválida / Falsificación detectada)`
          });

          return res.status(400).json({
            success: false,
            result: 'COUNTERFEIT_ALERT',
            message: '¡ALERTA DE SEGURIDAD! La firma digital del código QR no es válida o fue clonada.'
          });
        }
      }

      // 5. Validar estado del ticket
      if (ticket.status === 'CHECKED_IN') {
        // Ya fue utilizado anteriormente
        await CheckInLog.create({
          ticket_id: ticket.id,
          scanned_by_user_id: staffUserId,
          result: 'ALREADY_USED',
          device_info: deviceInfo || 'Web Scanner'
        });

        return res.status(409).json({
          success: false,
          result: 'ALREADY_USED',
          message: `¡BOLETO YA UTILIZADO! Primer ingreso registrado el ${new Date(ticket.checked_in_at).toLocaleString()}`,
          data: {
            ticket,
            checkedInAt: ticket.checked_in_at
          }
        });
      }

      if (ticket.status === 'CANCELLED') {
        await CheckInLog.create({
          ticket_id: ticket.id,
          scanned_by_user_id: staffUserId,
          result: 'CANCELLED',
          device_info: deviceInfo || 'Web Scanner'
        });

        return res.status(400).json({
          success: false,
          result: 'CANCELLED',
          message: 'El boleto se encuentra cancelado o reembolsado.',
          data: { ticket }
        });
      }

      // 6. Transición exitosa de estado: ACTIVE -> CHECKED_IN
      const now = new Date();
      await Ticket.updateStatus(ticket.id, 'CHECKED_IN', now);

      // Registrar auditoría exitosa
      await CheckInLog.create({
        ticket_id: ticket.id,
        scanned_by_user_id: staffUserId,
        result: 'SUCCESS',
        device_info: deviceInfo || 'Web Scanner'
      });

      return res.json({
        success: true,
        result: 'SUCCESS',
        message: '¡ACCESO AUTORIZADO! Entrada válida.',
        data: {
          ticket: {
            ...ticket,
            status: 'CHECKED_IN',
            checked_in_at: now
          }
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor al validar Check-in.',
        error: error.message
      });
    }
  }

  static async getEventLogs(req, res) {
    try {
      const { eventId } = req.params;
      const logs = await CheckInLog.getLogsByEvent(eventId);

      return res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al consultar historial de check-ins.',
        error: error.message
      });
    }
  }
}

module.exports = CheckInController;
