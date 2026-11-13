require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const checkInRoutes = require('./routes/checkInRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Solo detrás de un proxy propio (nginx): si no, cualquiera falsificaría su IP y evadiría los límites
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}
app.disable('x-powered-by');

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20kb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Los controladores adjuntan el detalle técnico en "error": se registra en el servidor y nunca se envía al cliente
app.use((req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && 'error' in body) {
      if (res.statusCode >= 500) console.error(`[${req.method} ${req.originalUrl}]`, body.error);
      delete body.error;
    }
    return json(body);
  };
  next();
});

const limiter = (windowMs, max, message, extra = {}) => rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
  ...extra
});

const MIN = 60 * 1000;
app.use('/api', limiter(15 * MIN, 1500, 'Demasiadas peticiones. Intenta de nuevo más tarde.'));
// Fuerza bruta de contraseñas: solo cuentan los intentos fallidos
app.use('/api/auth/login', limiter(15 * MIN, 10, 'Demasiados intentos de inicio de sesión. Espera 15 minutos.', { skipSuccessfulRequests: true }));
app.use('/api/auth/register', limiter(60 * MIN, 10, 'Demasiados registros desde esta dirección. Intenta más tarde.'));
app.use('/api/orders/checkout', limiter(15 * MIN, 30, 'Demasiados intentos de compra. Intenta más tarde.'));
// Adivinar códigos de boleto: un puesto de acceso real no supera este ritmo
app.use('/api/checkin/verify', limiter(MIN, 60, 'Demasiadas validaciones por minuto.'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/checkin', checkInRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

app.use((err, req, res, next) => {
  // Cuerpo mal formado o demasiado grande: es error del cliente, no del servidor
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ success: false, message: 'Petición inválida.' });
  }
  console.error('[Error no controlado]:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`PassMaster Backend ejecutándose en el puerto ${PORT}`);
});
