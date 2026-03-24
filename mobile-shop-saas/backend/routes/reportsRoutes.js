const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Sales reports
router.get('/daily', reportsController.getDailySalesReport);
router.get('/weekly', reportsController.getWeeklySalesReport);
router.get('/monthly', reportsController.getMonthlySalesReport);

// Product sales report
router.get('/products', reportsController.getProductSalesReport);

// Payment method report
router.get('/payment-methods', reportsController.getPaymentMethodReport);

// Shop comparison report (Super Admin only)
router.get('/shop-comparison', isSuperAdmin, reportsController.getShopComparisonReport);

module.exports = router;
