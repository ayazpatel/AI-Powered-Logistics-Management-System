const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// Order Management Routes
router.get('/', orderController.getAllOrders);
router.post('/', authenticate, orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.put('/:orderId/status', orderController.updateOrderStatus);
router.get('/:orderId/track', orderController.trackOrder);

// Customer Orders
router.get('/customer/:customerId', orderController.getCustomerOrders);

// Bulk Operations
router.put('/bulk/status', orderController.bulkUpdateOrders);

// Analytics
router.get('/analytics/summary', orderController.getOrderAnalytics);

module.exports = router;
