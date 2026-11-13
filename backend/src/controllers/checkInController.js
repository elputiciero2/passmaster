const Ticket = require('../models/Ticket');
const CheckInLog = require('../models/CheckInLog');
const QRService = require('../services/qrService');
const { verifyTicketSignature } = require('../utils/cryptoUtils');
const { isStr, toInt } = require('../utils/validate');

// La firma del QR nunca vuelve al escáner: quien la tenga puede clonar el boleto
const publicTicket = ({ qr_signature, ...ticket }) => ticket;

class CheckInController {
  /**
   * Valida un ticket escaneado mediante QR o código manual
   */
  static async verifyAndCheckIn(req, res) {
    try {
      const { qrData, eventId, deviceInfo } = req.body || {};
      const staffUserId = req.user.id;
      const device = isStr(deviceInfo, 100) ? deviceInfo.trim() : 'Web Scanner';

      if (!isStr(qrData, 1000)) {
        return res.status(400).json({
          success: false,
          result: 'INVALID',
          message: 'Datos del escáner QR o código no proporcionados.'
        });
      }

      const event = eventId === undefined || eventId === null ? null : toInt(eventId, 1, 4294967295);
      if (eventId !== undefined && eventId !== null && event === null) {
        return res.status(400).json({ success: false, result: 'INVALID', message: 'Evento inválido.' });
      }

      // 1. Extraer código y firma
      const parsed = QRService.parseAndValidate(qrData);
      if (!parsed.valid) {
        return res.status(400).json({
          success: false,
          result: 'INVALID',
          message: 'Código QR no reconocido.'
        });
      }

      // 2. Buscar ticket en la base de datos
      const ticket = await Ticket.findByCode(parsed.ticketCode);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          result: 'INVALID',
          message: 'Boleto inexistente o código alterado.'
        });
      }

      const log = (result, note = '') => CheckInLog.create({
        ticket_id: ticket.id,
        scanned_by_user_id: staffUserId,
        result,
        device_info: `${device}${note}`
      });

      // 3. Validar evento correspondiente (si se especificó en el puesto de acceso)
      if (event && event !== ticket.event_id) {
        await log('INVALID', ` (Evento incorrecto: intentó ingresar a evento ${event})`);

        return res.status(400).json({
          success: false,
          result: 'WRONG_EVENT',
          message: `Este boleto pertenece a otro evento: "${ticket.event_title}".`
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
          await log('INVALID', ' (Firma digital inválida / Falsificación detectada)');

          return res.status(400).json({
            success: false,
            result: 'COUNTERFEIT_ALERT',
            message: '¡ALERTA DE SEGURIDAD! La firma digital del código QR no es válida o fue clonada.'
          });
        }
      }

      // 5. Validar estado del ticket
      if (ticket.status === 'CANCELLED') {
        await log('CANCELLED');

        return res.status(400).json({
          success: false,
          result: 'CANCELLED',
          message: 'El boleto se encuentra cancelado o reembolsado.',
          data: { ticket: publicTicket(ticket) }
        });
      }

      // 6. Transición ACTIVE -> CHECKED_IN. Si no cambia ninguna fila, el boleto ya había ingresado
      //    (antes o en un escaneo simultáneo)
      const now = new Date();
      const admitted = await Ticket.checkIn(ticket.id, now);

      if (!admitted) {
        await log('ALREADY_USED');
        const current = await Ticket.findByCode(ticket.ticket_code);

        return res.status(409).json({
          success: false,
          result: 'ALREADY_USED',
          message: `¡BOLETO YA UTILIZADO! Primer ingreso registrado el ${new Date(current.checked_in_at).toLocaleString()}`,
          data: {
            ticket: publicTicket(current),
            checkedInAt: current.checked_in_at
          }
        });
      }

      await log('SUCCESS');

      return res.json({
        success: true,
        result: 'SUCCESS',
        message: '¡ACCESO AUTORIZADO! Entrada válida.',
        data: {
          ticket: {
            ...publicTicket(ticket),
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
      const eventId = toInt(req.params.eventId, 1, 4294967295);
      const logs = eventId === null ? [] : await CheckInLog.getLogsByEvent(eventId);

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
