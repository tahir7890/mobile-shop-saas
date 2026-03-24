const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Dashboard routes
router.get('/', dashboardController.getDashboard);
router.get('/admin', dashboardController.getAdminDashboard);
router.get('/shop', dashboardController.getShopDashboard);

module.exports = router;
