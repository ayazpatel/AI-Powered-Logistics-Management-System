const workflowService = require('../services/workflowService');

class WorkflowController {
  
  // Create order with automatic pickup assignment
  async createOrderWithWorkflow(req, res) {
    try {
      const orderData = req.body;
      
      const result = await workflowService.createOrderAndAssignPickup(orderData);
      
      res.status(201).json({
        success: true,
        message: 'Order created and workflow initiated',
        data: result
      });
      
    } catch (error) {
      console.error('Error creating order with workflow:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Agent completes pickup
  async completePickup(req, res) {
    try {
      const { orderId } = req.params;
      const { agentId } = req.body; // In real app, get from authentication
      const pickupData = req.body;
      
      const result = await workflowService.completePickup(orderId, agentId, pickupData);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Error completing pickup:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Hub receives package
  async receiveAtHub(req, res) {
    try {
      const { orderId } = req.params;
      const { hubManagerId, hubType } = req.body; // origin or destination
      
      let result;
      if (hubType === 'origin') {
        result = await workflowService.receiveAtOriginHub(orderId, hubManagerId);
      } else {
        result = await workflowService.receiveAtDestinationHub(orderId, hubManagerId);
      }
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Error receiving at hub:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Dispatch from origin hub
  async dispatchFromHub(req, res) {
    try {
      const { orderId } = req.params;
      const { hubManagerId } = req.body;
      
      const result = await workflowService.dispatchFromOriginHub(orderId, hubManagerId);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Error dispatching from hub:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Assign for delivery
  async assignForDelivery(req, res) {
    try {
      const { orderId } = req.params;
      const { hubManagerId } = req.body;
      
      const result = await workflowService.assignForDelivery(orderId, hubManagerId);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Error assigning for delivery:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Agent completes delivery
  async completeDelivery(req, res) {
    try {
      const { orderId } = req.params;
      const { agentId } = req.body; // In real app, get from authentication
      const deliveryData = req.body;
      
      const result = await workflowService.completeDelivery(orderId, agentId, deliveryData);
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('Error completing delivery:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get order workflow status
  async getWorkflowStatus(req, res) {
    try {
      const { orderId } = req.params;
      
      const status = await workflowService.getOrderWorkflowStatus(orderId);
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      console.error('Error getting workflow status:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get agent's assigned orders (pickup or delivery)
  async getAgentOrders(req, res) {
    try {
      const { agentId } = req.params;
      const { type = 'all', status } = req.query; // type: pickup, delivery, all
      
      const Order = require('../models/Order');
      let filter = {};
      
      if (type === 'pickup') {
        filter = { 'workflowTracking.pickupAgent': agentId };
        if (status) {
          filter.status = status;
        } else {
          filter.status = { $in: ['ASSIGNED_PICKUP', 'PICKED_UP'] };
        }
      } else if (type === 'delivery') {
        filter = { 'workflowTracking.deliveryAgent': agentId };
        if (status) {
          filter.status = status;
        } else {
          filter.status = { $in: ['OUT_FOR_DELIVERY'] };
        }
      } else {
        filter = {
          $or: [
            { 'workflowTracking.pickupAgent': agentId },
            { 'workflowTracking.deliveryAgent': agentId }
          ]
        };
        if (status) {
          filter.status = status;
        }
      }
      
      const orders = await Order.find(filter)
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.json({
        success: true,
        data: {
          orders,
          count: orders.length,
          type
        }
      });
      
    } catch (error) {
      console.error('Error getting agent orders:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get hub dashboard data
  async getHubDashboard(req, res) {
    try {
      const { hubId } = req.params;
      
      const Order = require('../models/Order');
      
      // Get orders at this hub
      const ordersAtHub = await Order.find({
        $or: [
          { 'workflowTracking.originHub': hubId, status: { $in: ['AT_ORIGIN_HUB', 'DISPATCHED_FROM_ORIGIN'] } },
          { 'workflowTracking.destinationHub': hubId, status: { $in: ['AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY'] } }
        ]
      }).populate('customerId', 'name phone');
      
      // Get statistics
      const stats = {
        totalOrders: ordersAtHub.length,
        pendingDispatch: ordersAtHub.filter(o => o.status === 'AT_ORIGIN_HUB').length,
        pendingDelivery: ordersAtHub.filter(o => o.status === 'AT_DESTINATION_HUB').length,
        outForDelivery: ordersAtHub.filter(o => o.status === 'OUT_FOR_DELIVERY').length
      };
      
      res.json({
        success: true,
        data: {
          orders: ordersAtHub,
          statistics: stats
        }
      });
      
    } catch (error) {
      console.error('Error getting hub dashboard:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get agent notifications (disabled - no notification service)
  async getAgentNotifications(req, res) {
    console.log('Notification service disabled - no notifications available');
    res.json({
      success: true,
      data: {
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
        page: 1,
        totalPages: 0
      }
    });
  }
  
  // Mark notification as read (disabled - no notification service)
  async markNotificationRead(req, res) {
    console.log('Notification service disabled - cannot mark notification as read');
    res.json({
      success: true,
      data: { message: 'Notification service is disabled' }
    });
  }
}

module.exports = new WorkflowController();
