const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.post('/checkout', verifyToken, OrderController.checkout);
router.get('/my-orders', verifyToken, OrderController.getMyOrders);
router.get('/:id', verifyToken, OrderController.getOrderDetails);
router.get('/', verifyToken, authorizeRoles('ADMIN'), OrderController.getAllOrdersAdmin);

module.exports = router;
