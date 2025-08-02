const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/auth');

// Optional authentication middleware - allows both authenticated and non-authenticated users
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    // If token is provided, try to authenticate
    authenticate(req, res, next);
  } else {
    // If no token, continue without authentication
    next();
  }
};

// Order Workflow Routes (with optional auth - can work for both authenticated and non-authenticated customers)
router.post('/orders/create-with-workflow', optionalAuth, workflowController.createOrderWithWorkflow);
router.get('/orders/:orderId/workflow-status', workflowController.getWorkflowStatus);

// Agent Workflow Routes
router.get('/agents/:agentId/orders', workflowController.getAgentOrders);
router.get('/agents/:agentId/notifications', workflowController.getAgentNotifications);
router.put('/notifications/:notificationId/read', workflowController.markNotificationRead);

// Pickup Workflow
router.put('/orders/:orderId/complete-pickup', workflowController.completePickup);

// Hub Workflow Routes
router.get('/hubs/:hubId/dashboard', workflowController.getHubDashboard);
router.put('/orders/:orderId/receive-at-hub', workflowController.receiveAtHub);
router.put('/orders/:orderId/dispatch-from-hub', workflowController.dispatchFromHub);
router.put('/orders/:orderId/assign-for-delivery', workflowController.assignForDelivery);

// Delivery Workflow
router.put('/orders/:orderId/complete-delivery', workflowController.completeDelivery);

module.exports = router;
