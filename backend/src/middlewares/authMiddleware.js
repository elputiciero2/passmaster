const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'passmaster_jwt_secret_super_seguro_2026_xyz';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: No se proporcionó token de autenticación.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido. Debe ser: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token expirado o inválido.',
      error: error.message
    });
  }
}

module.exports = {
  verifyToken
};
