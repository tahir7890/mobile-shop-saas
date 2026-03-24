const pool = require('../config/database');

// Get All Shops (Super Admin only)
const getAllShops = async (req, res) => {
    try {
        const [shops] = await pool.query(`
            SELECT s.*,
                   COUNT(DISTINCT u.id) as user_count,
                   COALESCE(SUM(sales.total_amount), 0) as total_sales,
                   COUNT(DISTINCT sales.id) as total_transactions,
                   sub.plan_type as subscription_plan,
                   sub.end_date as subscription_end_date,
                   CASE
                       WHEN sub.id IS NULL THEN 'No Subscription'
                       WHEN sub.is_active = 0 THEN 'cancelled'
                       WHEN DATEDIFF(sub.end_date, CURDATE()) < 0 THEN 'expired'
                       WHEN DATEDIFF(sub.end_date, CURDATE()) <= 7 THEN 'expiring_soon'
                       ELSE 'active'
                   END as subscription_status
            FROM shops s
            LEFT JOIN users u ON s.id = u.shop_id
            LEFT JOIN sales sales ON s.id = sales.shop_id
            LEFT JOIN subscriptions sub ON s.id = sub.shop_id
                AND sub.id = (
                    SELECT MAX(id) FROM subscriptions WHERE shop_id = s.id
                )
            GROUP BY s.id, sub.id
            ORDER BY s.created_at DESC
        `);

        res.json({
            success: true,
            data: shops
        });

    } catch (error) {
        console.error('Get all shops error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Shop by ID
const getShopById = async (req, res) => {
    try {
        const { id } = req.params;

        const [shops] = await pool.query(
            `SELECT s.*, 
                    COUNT(DISTINCT u.id) as user_count,
                    COALESCE(SUM(sales.total_amount), 0) as total_sales
             FROM shops s
             LEFT JOIN users u ON s.id = u.shop_id
             LEFT JOIN sales sales ON s.id = sales.shop_id
             WHERE s.id = ?
             GROUP BY s.id`,
            [id]
        );

        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        res.json({
            success: true,
            data: shops[0]
        });

    } catch (error) {
        console.error('Get shop by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create Shop (Super Admin only)
const createShop = async (req, res) => {
    try {
        const { name, address, phone, email, owner_name } = req.body;

        // Validate input
        if (!name || !owner_name) {
            return res.status(400).json({
                success: false,
                message: 'Name and owner name are required'
            });
        }

        // Insert shop
        const [result] = await pool.query(
            'INSERT INTO shops (name, address, phone, email, owner_name) VALUES (?, ?, ?, ?, ?)',
            [name, address || null, phone || null, email || null, owner_name]
        );

        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            data: {
                id: result.insertId,
                name,
                address,
                phone,
                email,
                owner_name
            }
        });

    } catch (error) {
        console.error('Create shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update Shop
const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, phone, email, owner_name, is_active } = req.body;

        // Check if shop exists
        const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);
        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            values.push(address);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (owner_name !== undefined) {
            updates.push('owner_name = ?');
            values.push(owner_name);
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
            `UPDATE shops SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Shop updated successfully'
        });

    } catch (error) {
        console.error('Update shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete Shop
const deleteShop = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if shop exists
        const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);
        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Delete shop (users will have shop_id set to NULL due to ON DELETE SET NULL)
        await pool.query('DELETE FROM shops WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Shop deleted successfully'
        });

    } catch (error) {
        console.error('Delete shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Activate/Deactivate Shop
const toggleShopStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if shop exists
        const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [id]);
        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Toggle status
        const newStatus = shops[0].is_active ? 0 : 1;
        await pool.query('UPDATE shops SET is_active = ? WHERE id = ?', [newStatus, id]);

        res.json({
            success: true,
            message: `Shop ${newStatus ? 'activated' : 'deactivated'} successfully`,
            data: { is_active: newStatus }
        });

    } catch (error) {
        console.error('Toggle shop status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllShops,
    getShopById,
    createShop,
    updateShop,
    deleteShop,
    toggleShopStatus
};
