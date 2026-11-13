const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // config/env.js garantiza que existe

function readToken(req) {
  const parts = (req.headers['authorization'] || '').split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  // Algoritmo fijo: impide tokens firmados con "none" u otro algoritmo
  return jwt.verify(parts[1], JWT_SECRET, { algorithms: ['HS256'] });
}

function verifyToken(req, res, next) {
  try {
    const decoded = readToken(req);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: se requiere el encabezado Authorization: Bearer <token>.'
      });
    }
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expirado o inválido.'
    });
  }
}

// Para rutas públicas que muestran más datos a usuarios con rol: un token ausente o inválido cuenta como visitante
function optionalAuth(req, res, next) {
  try {
    req.user = readToken(req) || undefined;
  } catch (error) {
    req.user = undefined;
  }
  next();
}

module.exports = {
  verifyToken,
  optionalAuth
};
