const pool = require('../config/database');

// Get All Sales
const getAllSales = async (req, res) => {
    try {
        const { start_date, end_date, shop_id } = req.query;
        
        let query = `
            SELECT s.*, 
                   sh.name as shop_name,
                   u.full_name as created_by_name,
                   COUNT(si.id) as item_count
            FROM sales s
            JOIN shops sh ON s.shop_id = sh.id
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
        `;
        
        const params = [];

        // Shop users can only see their own shop's sales
        if (req.user.role === 'shop_user') {
            query += ' WHERE s.shop_id = ?';
            params.push(req.user.shop_id);
        } else {
            // Super Admin can filter by shop_id
            if (shop_id) {
                query += ' WHERE s.shop_id = ?';
                params.push(shop_id);
            } else {
                query += ' WHERE 1=1';
            }
        }

        // Filter by date range
        if (start_date) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY s.id ORDER BY s.created_at DESC';

        const [sales] = await pool.query(query, params);

        res.json({
            success: true,
            data: sales
        });

    } catch (error) {
        console.error('Get all sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Sale by ID with Items
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get sale details
        const [sales] = await pool.query(
            `SELECT s.*, 
                    sh.name as shop_name,
                    u.full_name as created_by_name
             FROM sales s
             JOIN shops sh ON s.shop_id = sh.id
             LEFT JOIN users u ON s.created_by = u.id
             WHERE s.id = ?`,
            [id]
        );

        if (sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        // Check access for shop users
        if (req.user.role === 'shop_user' && sale.shop_id !== req.user.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get sale items
        const [items] = await pool.query(
            `SELECT si.*, p.category
             FROM sale_items si
             LEFT JOIN products p ON si.product_id = p.id
             WHERE si.sale_id = ?`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...sale,
                items
            }
        });

    } catch (error) {
        console.error('Get sale by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create Sale (Bill)
const createSale = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { customer_name, items, payment_method, notes } = req.body;

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        // Validate each item
        for (const item of items) {
            if (!item.product_id || !item.quantity || !item.unit_price) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have product_id, quantity, and unit_price'
                });
            }
        }

        // Get shop_id
        const shop_id = req.user.role === 'shop_user' ? req.user.shop_id : req.body.shop_id;

        if (!shop_id) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Shop ID is required'
            });
        }

        // Calculate total and validate products
        let total_amount = 0;
        const validatedItems = [];

        for (const item of items) {
            // Get product details
            const [products] = await connection.query(
                'SELECT * FROM products WHERE id = ? AND is_active = 1',
                [item.product_id]
            );

            if (products.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${item.product_id} not found`
                });
            }

            const product = products[0];

            // Check if product is accessible
            if (req.user.role === 'shop_user' && !product.is_global && product.shop_id !== req.user.shop_id) {
                await connection.rollback();
                return res.status(403).json({
                    success: false,
                    message: `Cannot use product: ${product.name}`
                });
            }

            // Check stock
            if (product.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product: ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
                });
            }

            const subtotal = item.quantity * item.unit_price;
            total_amount += subtotal;

            validatedItems.push({
                product_id: item.product_id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: subtotal,
                current_stock: product.stock_quantity
            });
        }

        // Insert sale
        const [saleResult] = await connection.query(
            `INSERT INTO sales (shop_id, customer_name, total_amount, payment_method, notes, created_by) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [shop_id, customer_name || null, total_amount, payment_method || 'cash', notes || null, req.user.id]
        );

        const sale_id = saleResult.insertId;

        // Insert sale items and update stock
        for (const item of validatedItems) {
            // Insert sale item
            await connection.query(
                `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [sale_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
            );

            // Update product stock
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit();

        // Get complete sale details
        const [saleDetails] = await connection.query(
            `SELECT s.*, sh.name as shop_name, sh.address as shop_address, sh.phone as shop_phone
             FROM sales s
             JOIN shops sh ON s.shop_id = sh.id
             WHERE s.id = ?`,
            [sale_id]
        );

        const [saleItems] = await connection.query(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [sale_id]
        );

        connection.release();

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: {
                ...saleDetails[0],
                items: saleItems
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Create sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete Sale (with stock restoration)
const deleteSale = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Get sale details
        const [sales] = await connection.query('SELECT * FROM sales WHERE id = ?', [id]);

        if (sales.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const sale = sales[0];

        // Check access
        if (req.user.role === 'shop_user' && sale.shop_id !== req.user.shop_id) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get sale items to restore stock
        const [items] = await connection.query('SELECT * FROM sale_items WHERE sale_id = ?', [id]);

        // Restore stock for each item
        for (const item of items) {
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Delete sale items
        await connection.query('DELETE FROM sale_items WHERE sale_id = ?', [id]);

        // Delete sale
        await connection.query('DELETE FROM sales WHERE id = ?', [id]);

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: 'Sale deleted successfully and stock restored'
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Delete sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Today's Sales
const getTodaySales = async (req, res) => {
    try {
        const shop_id = req.user.role === 'shop_user' ? req.user.shop_id : req.query.shop_id;

        let query = `
            SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue
            FROM sales
            WHERE DATE(created_at) = CURDATE()
        `;

        const params = [];

        if (shop_id) {
            query += ' AND shop_id = ?';
            params.push(shop_id);
        }

        const [result] = await pool.query(query, params);

        res.json({
            success: true,
            data: result[0]
        });

    } catch (error) {
        console.error('Get today sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Recent Sales (last 10)
const getRecentSales = async (req, res) => {
    try {
        const shop_id = req.user.role === 'shop_user' ? req.user.shop_id : req.query.shop_id;

        let query = `
            SELECT s.*, sh.name as shop_name
            FROM sales s
            JOIN shops sh ON s.shop_id = sh.id
        `;

        const params = [];

        if (shop_id) {
            query += ' WHERE s.shop_id = ?';
            params.push(shop_id);
        }

        query += ' ORDER BY s.created_at DESC LIMIT 10';

        const [sales] = await pool.query(query, params);

        res.json({
            success: true,
            data: sales
        });

    } catch (error) {
        console.error('Get recent sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    createSale,
    deleteSale,
    getTodaySales,
    getRecentSales
};
