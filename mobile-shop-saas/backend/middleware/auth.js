const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT Token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Super Admin only.' 
        });
    }
    next();
};

// Check if user is Shop User
const isShopUser = (req, res, next) => {
    if (req.user.role !== 'shop_user') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Shop User only.' 
        });
    }
    next();
};

// Check if user has access to specific shop (for shop users)
const hasShopAccess = (req, res, next) => {
    if (req.user.role === 'super_admin') {
        return next();
    }
    
    const shopId = parseInt(req.params.shopId) || parseInt(req.body.shopId);
    
    if (shopId && shopId !== req.user.shop_id) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. You can only access your own shop data.' 
        });
    }
    
    next();
};

module.exports = {
    verifyToken,
    isSuperAdmin,
    isShopUser,
    hasShopAccess
};
