const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/my-tickets', verifyToken, TicketController.getMyTickets);
router.get('/:id', verifyToken, TicketController.getTicketById);

module.exports = router;
