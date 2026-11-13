const QRCode = require('qrcode');
const { generateTicketSignature, verifyTicketSignature, createQRPayload } = require('../utils/cryptoUtils');

class QRService {
  /**
   * Genera la imagen QR en formato Data URL (base64 image/png)
   */
  static async generateQRCodeDataUrl(ticketCode, signature) {
    const payload = createQRPayload(ticketCode, signature);
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  }

  /**
   * Valida un payload escaneado por el lector de cámara
   */
  static parseAndValidate(rawScannedData) {
    try {
      let parsed;
      if (typeof rawScannedData === 'string') {
        parsed = JSON.parse(rawScannedData);
      } else {
        parsed = rawScannedData;
      }

      if (!parsed.code || !parsed.sig) {
        return { valid: false, error: 'Payload de QR con estructura incorrecta' };
      }

      return {
        valid: true,
        ticketCode: parsed.code,
        signature: parsed.sig
      };
    } catch (err) {
      // Posible formato directo solo de ticket_code
      if (typeof rawScannedData === 'string' && rawScannedData.trim().length > 0) {
        return {
          valid: true,
          ticketCode: rawScannedData.trim(),
          signature: null
        };
      }
      return { valid: false, error: 'Código QR no reconocido o corrupto' };
    }
  }
}

module.exports = QRService;
