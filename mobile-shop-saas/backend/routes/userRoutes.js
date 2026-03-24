const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin role
router.use(verifyToken, isSuperAdmin);

// User CRUD routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// User management routes
router.post('/:id/change-password', userController.changePassword);
router.patch('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;
