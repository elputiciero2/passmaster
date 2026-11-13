const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isStr, isEmail } = require('../utils/validate');

const JWT_SECRET = process.env.JWT_SECRET; // config/env.js garantiza que existe
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Se compara contra este hash cuando el correo no existe, para que la respuesta tarde lo mismo
const DUMMY_HASH = bcrypt.hashSync('passmaster-dummy', 10);

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN, algorithm: 'HS256' }
);

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body || {};

      if (!isStr(name, 120) || !isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y correo electrónico válidos son obligatorios.'
        });
      }

      // bcrypt ignora lo que pase de 72 bytes
      if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener entre 8 y 72 caracteres.'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya se encuentra registrado.'
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      // El registro público solo crea compradores: el rol nunca se toma de la petición
      const user = { name: name.trim(), email: normalizedEmail, role: 'CUSTOMER' };
      user.id = await User.create({ ...user, password_hash });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: { user, token: signToken(user) }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor al registrar usuario.',
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body || {};

      if (!isEmail(email) || typeof password !== 'string' || !password || password.length > 72) {
        return res.status(400).json({
          success: false,
          message: 'Debe ingresar su correo y contraseña.'
        });
      }

      const user = await User.findByEmail(email.trim().toLowerCase());
      const isMatch = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

      if (!user || !isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      return res.json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          token: signToken(user)
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor durante la autenticación.',
        error: error.message
      });
    }
  }

  static async me(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      return res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener perfil del usuario.',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;
