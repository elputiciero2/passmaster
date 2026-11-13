const crypto = require('crypto');

const HMAC_SECRET = process.env.QR_HMAC_SECRET; // config/env.js garantiza que existe

/**
 * Genera una firma criptográfica HMAC-SHA256 para vincular el ticket de forma infalsificable.
 * Payload base: ticketCode + ticketTierId + orderId
 */
function generateTicketSignature(ticketCode, ticketTierId, orderId) {
  const data = `${ticketCode}:${ticketTierId}:${orderId}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

/**
 * Verifica si la firma enviada coincide con el hash esperado.
 */
function verifyTicketSignature(ticketCode, ticketTierId, orderId, signature) {
  const expected = generateTicketSignature(ticketCode, ticketTierId, orderId);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Empaqueta la carga útil que contendrá el código QR visual.
 * Formato JSON codificado o string seguro:
 * PASSMASTER|ticketCode|signature
 */
function createQRPayload(ticketCode, signature) {
  return JSON.stringify({
    app: 'PASSMASTER',
    code: ticketCode,
    sig: signature
  });
}

module.exports = {
  generateTicketSignature,
  verifyTicketSignature,
  createQRPayload
};
