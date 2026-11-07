const express = require('express');
const { getOrders, updateOrderStatus } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getOrders);
router.put('/:id/status', verifyToken, updateOrderStatus);

module.exports = router;