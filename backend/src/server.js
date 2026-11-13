const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const checkInRoutes = require('./routes/checkInRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({
  origin: '*', // Permitir conexión desde Vite React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ruta base de estado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    project: 'PassMaster API - Ticketing & Event Access System',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API (v1)
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/checkin', checkInRoutes);

// Manejador 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejador centralizado de errores
app.use((err, req, res, next) => {
  console.error('[Error no controlado]:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 PassMaster Backend ejecutándose en el puerto ${PORT}`);
  console.log(`🔗 URL Base: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
