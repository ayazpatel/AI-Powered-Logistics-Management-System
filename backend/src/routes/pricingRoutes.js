const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

// Pricing Estimate Routes
router.post('/calculate', pricingController.calculatePricing);
router.post('/estimate', pricingController.getPricingEstimate);
router.post('/compare', pricingController.comparePricingOptions);
router.post('/bulk-estimate', pricingController.getBulkPricingEstimate);

// Pricing Analytics
router.get('/trends', pricingController.getPricingTrends);
router.get('/zonal', pricingController.getZonalPricing);

module.exports = router;
