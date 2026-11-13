/**
 * Middleware para restringir acceso según el rol del usuario autenticado.
 * @param  {...string} allowedRoles - Ej: 'ADMIN', 'STAFF'
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Usuario no autenticado o rol indefinido.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso restringido. Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles
};
