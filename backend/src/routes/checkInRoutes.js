const express = require('express');
const router = express.Router();
const CheckInController = require('../controllers/checkInController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Solo personal de Staff y Admin tienen acceso a la validación de boletos y registros
router.post('/verify', verifyToken, authorizeRoles('STAFF', 'ADMIN'), CheckInController.verifyAndCheckIn);
router.get('/logs/:eventId', verifyToken, authorizeRoles('STAFF', 'ADMIN'), CheckInController.getEventLogs);

module.exports = router;
