const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Sales CRUD routes
router.get('/', salesController.getAllSales);
router.get('/today', salesController.getTodaySales);
router.get('/recent', salesController.getRecentSales);
router.get('/:id', salesController.getSaleById);
router.post('/', salesController.createSale);
router.delete('/:id', salesController.deleteSale);

module.exports = router;
