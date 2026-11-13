const express = require('express');
const router = express.Router();
const EventController = require('../controllers/eventController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Rutas públicas
router.get('/', EventController.getAll);
router.get('/:id', EventController.getById);

// Rutas administrativas y de aforo en tiempo real
router.get('/:id/occupancy', verifyToken, authorizeRoles('ADMIN', 'STAFF'), EventController.getRealtimeStats);
router.post('/', verifyToken, authorizeRoles('ADMIN'), EventController.create);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), EventController.update);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), EventController.delete);

module.exports = router;
