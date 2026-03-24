const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Login User
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }

        // Check subscription for shop users
        if (user.role === 'shop_user' && user.shop_id) {
            const [subscriptions] = await pool.query(
                'SELECT * FROM subscriptions WHERE shop_id = ? AND is_active = 1 AND end_date >= CURDATE()',
                [user.shop_id]
            );

            if (subscriptions.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Your subscription has expired. Please renew to continue.'
                });
            }
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                shop_id: user.shop_id,
                full_name: user.full_name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Get shop details if shop user
        let shopDetails = null;
        if (user.role === 'shop_user' && user.shop_id) {
            const [shops] = await pool.query(
                'SELECT id, name, address, phone, email FROM shops WHERE id = ?',
                [user.shop_id]
            );
            if (shops.length > 0) {
                shopDetails = shops[0];
            }
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    shop_id: user.shop_id,
                    phone: user.phone,
                    shop: shopDetails
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get Current User
const getCurrentUser = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, email, full_name, role, shop_id, phone, is_active, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get shop details if shop user
        let shopDetails = null;
        if (user.role === 'shop_user' && user.shop_id) {
            const [shops] = await pool.query(
                'SELECT id, name, address, phone, email FROM shops WHERE id = ?',
                [user.shop_id]
            );
            if (shops.length > 0) {
                shopDetails = shops[0];
            }
        }

        res.json({
            success: true,
            data: {
                ...user,
                shop: shopDetails
            }
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Logout (client-side token removal)
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
};

module.exports = {
    login,
    getCurrentUser,
    logout
};
