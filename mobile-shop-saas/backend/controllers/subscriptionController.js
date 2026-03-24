const pool = require('../config/database');

// Get All Subscriptions (Super Admin only)
const getAllSubscriptions = async (req, res) => {
    try {
        const { shop_id, is_active } = req.query;
        
        let query = `
            SELECT sub.*,
                s.name as shop_name,
                s.owner_name,
                DATEDIFF(sub.end_date, CURDATE()) as days_remaining,
                CASE
                    WHEN sub.is_active = 0 THEN 'cancelled'
                    WHEN DATEDIFF(sub.end_date, CURDATE()) < 0 THEN 'expired'
                    WHEN DATEDIFF(sub.end_date, CURDATE()) <= 7 THEN 'expiring_soon'
                    ELSE 'active'
                END as status
            FROM subscriptions sub
            JOIN shops s ON sub.shop_id = s.id
        `;
        
        const params = [];

        if (shop_id) {
            query += ' WHERE sub.shop_id = ?';
            params.push(shop_id);
        }

        if (is_active !== undefined) {
            query += (shop_id ? ' AND' : ' WHERE') + ' sub.is_active = ?';
            params.push(is_active);
        }

        query += ' ORDER BY sub.created_at DESC';

        const [subscriptions] = await pool.query(query, params);

        res.json({
            success: true,
            data: subscriptions
        });

    } catch (error) {
        console.error('Get all subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Subscription by Shop ID
const getSubscriptionByShopId = async (req, res) => {
    try {
        const { shop_id } = req.params;

        // Check access for shop users
        if (req.user.role === 'shop_user' && parseInt(shop_id) !== req.user.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const [subscriptions] = await pool.query(
            `SELECT sub.*,
                    s.name as shop_name,
                    DATEDIFF(sub.end_date, CURDATE()) as days_remaining,
                    CASE
                        WHEN sub.is_active = 0 THEN 'cancelled'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) < 0 THEN 'expired'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) <= 7 THEN 'expiring_soon'
                        ELSE 'active'
                    END as status
            FROM subscriptions sub
            JOIN shops s ON sub.shop_id = s.id
            WHERE sub.shop_id = ?
            ORDER BY sub.end_date DESC
            LIMIT 1`,
            [shop_id]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No subscription found for this shop'
            });
        }

        res.json({
            success: true,
            data: subscriptions[0]
        });

    } catch (error) {
        console.error('Get subscription by shop ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create Subscription (Super Admin only)
const createSubscription = async (req, res) => {
    try {
        const { shop_id, plan_type, start_date, end_date, amount, payment_method, duration_days } = req.body;

        // Validate input
        if (!shop_id || !plan_type) {
            return res.status(400).json({
                success: false,
                message: 'Shop ID and plan type are required'
            });
        }

        // Validate plan type - accept both old and new formats
        const validPlanTypes = ['basic', 'standard', 'premium', 'monthly', 'quarterly', 'yearly', 'trial'];
        if (!validPlanTypes.includes(plan_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type. Must be basic, standard, premium, monthly, quarterly, yearly, or trial'
            });
        }

        // Check if shop exists
        const [shops] = await pool.query('SELECT * FROM shops WHERE id = ?', [shop_id]);
        if (shops.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Deactivate existing subscriptions for this shop
        await pool.query(
            'UPDATE subscriptions SET is_active = 0 WHERE shop_id = ?',
            [shop_id]
        );

        // Calculate dates if not provided
        let subscriptionStartDate = start_date ? new Date(start_date) : new Date();
        let subscriptionEndDate = end_date ? new Date(end_date) : null;

        // If end_date is not provided, calculate from duration_days or plan_type
        if (!subscriptionEndDate) {
            subscriptionEndDate = new Date(subscriptionStartDate);
            
            if (duration_days) {
                subscriptionEndDate.setDate(subscriptionEndDate.getDate() + parseInt(duration_days));
            } else {
                // Calculate duration based on plan type
                const planDurations = {
                    'monthly': 30,
                    'quarterly': 90,
                    'yearly': 365,
                    'trial': 7,
                    'basic': 30,
                    'standard': 90,
                    'premium': 365
                };
                subscriptionEndDate.setDate(subscriptionEndDate.getDate() + (planDurations[plan_type] || 30));
            }
        }

        // Insert subscription
        const [result] = await pool.query(
            'INSERT INTO subscriptions (shop_id, plan_type, start_date, end_date, is_active, amount, payment_method) VALUES (?, ?, ?, ?, 1, ?, ?)',
            [
                parseInt(shop_id),
                plan_type,
                subscriptionStartDate.toISOString().split('T')[0],
                subscriptionEndDate.toISOString().split('T')[0],
                amount || null,
                payment_method || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Subscription created successfully',
            data: {
                id: result.insertId,
                shop_id: parseInt(shop_id),
                plan_type,
                start_date: subscriptionStartDate.toISOString().split('T')[0],
                end_date: subscriptionEndDate.toISOString().split('T')[0],
                is_active: 1,
                amount: amount || null,
                payment_method: payment_method || null,
                status: 'active'
            }
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// Renew Subscription (Super Admin only)
const renewSubscription = async (req, res) => {
    try {
        const { subscription_id, shop_id, plan_type, amount } = req.body;

        // Validate input - accept either subscription_id or shop_id
        if (!subscription_id && !shop_id) {
            return res.status(400).json({
                success: false,
                message: 'Subscription ID or Shop ID is required'
            });
        }

        // Get current subscription
        let currentSub;
        if (subscription_id) {
            const [subs] = await pool.query(
                'SELECT * FROM subscriptions WHERE id = ?',
                [subscription_id]
            );
            if (subs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No subscription found with this ID'
                });
            }
            currentSub = subs[0];
        } else {
            const [subs] = await pool.query(
                'SELECT * FROM subscriptions WHERE shop_id = ?',
                [shop_id]
            );
            if (subs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No subscription found for this shop'
                });
            }
            currentSub = subs[0];
        }

        // Calculate duration based on plan_type if provided
        let duration_days = 30; // default
        if (plan_type) {
            const planDurations = {
                'monthly': 30,
                'quarterly': 90,
                'yearly': 365,
                'trial': 7
            };
            duration_days = planDurations[plan_type] || 30;
        }

        // Calculate new end date - use today's date if subscription is already expired
        let baseDate = new Date(currentSub.end_date);
        const today = new Date();
        if (baseDate < today) {
            baseDate = today;
        }
        const end_date = new Date(baseDate);
        end_date.setDate(end_date.getDate() + parseInt(duration_days));

        // Update subscription - also set is_active to 1 to reactivate cancelled/expired subscriptions
        await pool.query(
            'UPDATE subscriptions SET end_date = ?, plan_type = COALESCE(?, plan_type), is_active = 1 WHERE id = ?',
            [end_date, plan_type || null, currentSub.id]
        );

        // Update amount if provided
        if (amount) {
            await pool.query(
                'UPDATE subscriptions SET amount = amount + ? WHERE id = ?',
                [parseFloat(amount), currentSub.id]
            );
        }

        res.json({
            success: true,
            message: 'Subscription renewed successfully',
            data: {
                id: currentSub.id,
                shop_id: currentSub.shop_id,
                plan_type: plan_type || currentSub.plan_type,
                end_date,
                amount: amount ? (parseFloat(currentSub.amount || 0) + parseFloat(amount)) : currentSub.amount,
                is_active: 1,
                status: 'active'
            }
        });

    } catch (error) {
        console.error('Renew subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Cancel Subscription (Super Admin only)
const cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if subscription exists
        const [subscriptions] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [id]);
        if (subscriptions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Subscription not found'
            });
        }

        // Deactivate subscription
        await pool.query('UPDATE subscriptions SET is_active = 0 WHERE id = ?', [id]);

        // Get updated subscription with status
        const [updatedSubs] = await pool.query(
            `SELECT sub.*,
                    DATEDIFF(sub.end_date, CURDATE()) as days_remaining,
                    CASE
                        WHEN sub.is_active = 0 THEN 'cancelled'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) < 0 THEN 'expired'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) <= 7 THEN 'expiring_soon'
                        ELSE 'active'
                    END as status
            FROM subscriptions sub
            WHERE sub.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: updatedSubs[0]
        });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Expiring Subscriptions (Super Admin only)
const getExpiringSubscriptions = async (req, res) => {
    try {
        const { days } = req.query;
        const days_threshold = days || 7;

        const [subscriptions] = await pool.query(
            `SELECT sub.*,
                    s.name as shop_name,
                    s.owner_name,
                    s.phone,
                    DATEDIFF(sub.end_date, CURDATE()) as days_remaining,
                    CASE
                        WHEN sub.is_active = 0 THEN 'cancelled'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) < 0 THEN 'expired'
                        WHEN DATEDIFF(sub.end_date, CURDATE()) <= 7 THEN 'expiring_soon'
                        ELSE 'active'
                    END as status
            FROM subscriptions sub
            JOIN shops s ON sub.shop_id = s.id
            WHERE sub.is_active = 1
            AND DATEDIFF(sub.end_date, CURDATE()) <= ?
            AND DATEDIFF(sub.end_date, CURDATE()) >= 0
            ORDER BY sub.end_date ASC`,
            [days_threshold]
        );

        res.json({
            success: true,
            data: subscriptions
        });

    } catch (error) {
        console.error('Get expiring subscriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getAllSubscriptions,
    getSubscriptionByShopId,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    getExpiringSubscriptions
};
