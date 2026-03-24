const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin role except getting own subscription
router.use(verifyToken);

// Super Admin only routes - MUST be defined before parameterized routes
router.get('/', isSuperAdmin, subscriptionController.getAllSubscriptions);
router.get('/expiring', isSuperAdmin, subscriptionController.getExpiringSubscriptions);
router.post('/', isSuperAdmin, subscriptionController.createSubscription);
router.post('/renew', isSuperAdmin, subscriptionController.renewSubscription);
router.delete('/:id', isSuperAdmin, subscriptionController.cancelSubscription);

// Get own subscription (for shop users) - MUST be after specific routes
router.get('/shop/:shop_id', subscriptionController.getSubscriptionByShopId);

module.exports = router;
