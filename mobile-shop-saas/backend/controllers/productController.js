const pool = require('../config/database');

// Get All Products (Global + Custom based on role)
const getAllProducts = async (req, res) => {
    try {
        const { category, search, is_global } = req.query;
        
        let query = `
            SELECT p.*, 
                   s.name as shop_name,
                   u.full_name as created_by_name
            FROM products p
            LEFT JOIN shops s ON p.shop_id = s.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.is_active = 1
        `;
        
        const params = [];

        // Super Admin sees all products, Shop User sees global + their own
        if (req.user.role === 'shop_user') {
            query += ' AND (p.is_global = 1 OR p.shop_id = ?)';
            params.push(req.user.shop_id);
        }

        // Filter by category
        if (category) {
            query += ' AND p.category = ?';
            params.push(category);
        }

        // Filter by global/custom
        if (is_global !== undefined) {
            query += ' AND p.is_global = ?';
            params.push(is_global);
        }

        // Search by name
        if (search) {
            query += ' AND p.name LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY p.created_at DESC';

        const [products] = await pool.query(query, params);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Get all products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Product by ID
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const [products] = await pool.query(
            `SELECT p.*, 
                    s.name as shop_name,
                    u.full_name as created_by_name
             FROM products p
             LEFT JOIN shops s ON p.shop_id = s.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.id = ?`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check access for shop users
        if (req.user.role === 'shop_user') {
            const product = products[0];
            if (!product.is_global && product.shop_id !== req.user.shop_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        res.json({
            success: true,
            data: products[0]
        });

    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create Product
const createProduct = async (req, res) => {
    try {
        const { name, category, description, cost_price, sale_price, stock_quantity, low_stock_threshold, is_global } = req.body;

        // Validate input
        if (!name || !sale_price) {
            return res.status(400).json({
                success: false,
                message: 'Name and sale price are required'
            });
        }

        // Only Super Admin can create global products
        if (is_global && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can create global products'
            });
        }

        // Shop users can only create custom products for their shop
        if (!is_global && req.user.role === 'shop_user') {
            if (req.body.shop_id && req.body.shop_id !== req.user.shop_id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only create products for your own shop'
                });
            }
        }

        // Insert product
        const [result] = await pool.query(
            `INSERT INTO products (name, category, description, cost_price, sale_price, stock_quantity, low_stock_threshold, is_global, shop_id, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                category || null,
                description || null,
                cost_price || null,
                sale_price,
                stock_quantity || 0,
                low_stock_threshold || 10,
                is_global ? 1 : 0,
                is_global ? null : (req.user.role === 'shop_user' ? req.user.shop_id : req.body.shop_id),
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                id: result.insertId,
                name,
                category,
                description,
                cost_price,
                sale_price,
                stock_quantity,
                low_stock_threshold,
                is_global: is_global ? 1 : 0,
                shop_id: is_global ? null : (req.user.role === 'shop_user' ? req.user.shop_id : req.body.shop_id)
            }
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, cost_price, sale_price, stock_quantity, low_stock_threshold, is_active } = req.body;

        // Check if product exists
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Check access
        if (req.user.role === 'shop_user') {
            if (product.is_global) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot modify global products'
                });
            }
            if (product.shop_id !== req.user.shop_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (cost_price !== undefined) {
            updates.push('cost_price = ?');
            values.push(cost_price);
        }
        if (sale_price !== undefined) {
            updates.push('sale_price = ?');
            values.push(sale_price);
        }
        if (stock_quantity !== undefined) {
            updates.push('stock_quantity = ?');
            values.push(stock_quantity);
        }
        if (low_stock_threshold !== undefined) {
            updates.push('low_stock_threshold = ?');
            values.push(low_stock_threshold);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        await pool.query(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Product updated successfully'
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const product = products[0];

        // Check access
        if (req.user.role === 'shop_user') {
            if (product.is_global) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete global products'
                });
            }
            if (product.shop_id !== req.user.shop_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        // Delete product (sale_items will have product_id set to NULL due to ON DELETE SET NULL)
        await pool.query('DELETE FROM products WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
    try {
        let query = `
            SELECT p.*, 
                   s.name as shop_name
            FROM products p
            LEFT JOIN shops s ON p.shop_id = s.id
            WHERE p.stock_quantity <= p.low_stock_threshold AND p.is_active = 1
        `;

        const params = [];

        // Shop users only see their own low stock products
        if (req.user.role === 'shop_user') {
            query += ' AND (p.is_global = 0 AND p.shop_id = ?)';
            params.push(req.user.shop_id);
        }

        query += ' ORDER BY p.stock_quantity ASC';

        const [products] = await pool.query(query, params);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Product Categories
const getProductCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND is_active = 1 ORDER BY category'
        );

        res.json({
            success: true,
            data: categories.map(c => c.category)
        });

    } catch (error) {
        console.error('Get product categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    getProductCategories
};
