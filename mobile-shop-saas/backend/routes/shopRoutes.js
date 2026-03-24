const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin role
router.use(verifyToken, isSuperAdmin);

// Shop CRUD routes
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);
router.post('/', shopController.createShop);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

// Shop management routes
router.patch('/:id/toggle-status', shopController.toggleShopStatus);

module.exports = router;
