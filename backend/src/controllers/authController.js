const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'passmaster_jwt_secret_super_seguro_2026_xyz';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos (nombre, correo y contraseña) son obligatorios.'
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El correo electrónico ya se encuentra registrado.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Solo ADMIN puede registrar otros ADMIN o STAFF desde el panel, por defecto es CUSTOMER
      const assignedRole = role === 'STAFF' ? 'STAFF' : 'CUSTOMER';

      const userId = await User.create({
        name,
        email,
        password_hash,
        role: assignedRole
      });

      const token = jwt.sign(
        { id: userId, email, role: assignedRole, name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: {
          user: { id: userId, name, email, role: assignedRole },
          token
        }
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Debe ingresar su correo y contraseña.'
        });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas.'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
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
