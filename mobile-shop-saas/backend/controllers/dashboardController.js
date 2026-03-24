const pool = require('../config/database');

// Get Super Admin Dashboard Stats
const getAdminDashboard = async (req, res) => {
    try {
        // Get total shops
        const [totalShops] = await pool.query('SELECT COUNT(*) as count FROM shops');
        
        // Get active shops
        const [activeShops] = await pool.query('SELECT COUNT(*) as count FROM shops WHERE is_active = 1');
        
        // Get total users
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
        
        // Get active users
        const [activeUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        
        // Get total sales
        const [totalSales] = await pool.query('SELECT COUNT(*) as count FROM sales');
        
        // Get total revenue
        const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales');
        
        // Get today's sales
        const [todaySales] = await pool.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE DATE(created_at) = CURDATE()
        `);
        
        // Get this month's sales
        const [monthSales] = await pool.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
        `);
        
        // Get expiring subscriptions (next 7 days)
        const [expiringSubs] = await pool.query(`
            SELECT COUNT(*) as count
            FROM subscriptions
            WHERE is_active = 1 AND DATEDIFF(end_date, CURDATE()) <= 7 AND DATEDIFF(end_date, CURDATE()) >= 0
        `);
        
        // Get low stock products
        const [lowStock] = await pool.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE stock_quantity <= low_stock_threshold AND is_active = 1
        `);
        
        // Get top 5 shops by revenue
        const [topShops] = await pool.query(`
            SELECT s.id, s.name, COUNT(sales.id) as sales_count, COALESCE(SUM(sales.total_amount), 0) as revenue
            FROM shops s
            LEFT JOIN sales sales ON s.id = sales.shop_id
            GROUP BY s.id
            ORDER BY revenue DESC
            LIMIT 5
        `);
        
        // Get recent sales (last 10)
        const [recentSales] = await pool.query(`
            SELECT s.id, s.total_amount, s.created_at, sh.name as shop_name
            FROM sales s
            JOIN shops sh ON s.shop_id = sh.id
            ORDER BY s.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    total_shops: totalShops[0].count,
                    active_shops: activeShops[0].count,
                    total_users: totalUsers[0].count,
                    active_users: activeUsers[0].count,
                    total_sales: totalSales[0].count,
                    total_revenue: parseFloat(totalRevenue[0].total),
                    today_sales: todaySales[0].count,
                    today_revenue: parseFloat(todaySales[0].total),
                    month_sales: monthSales[0].count,
                    month_revenue: parseFloat(monthSales[0].total),
                    expiring_subscriptions: expiringSubs[0].count,
                    low_stock_products: lowStock[0].count
                },
                top_shops: topShops,
                recent_sales: recentSales
            }
        });

    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Shop User Dashboard Stats
const getShopDashboard = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;

        // Get today's sales
        const [todaySales] = await pool.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE shop_id = ? AND DATE(created_at) = CURDATE()
        `, [shop_id]);
        
        // Get this week's sales
        const [weekSales] = await pool.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE shop_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        `, [shop_id]);
        
        // Get this month's sales
        const [monthSales] = await pool.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
            FROM sales
            WHERE shop_id = ? AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
        `, [shop_id]);
        
        // Get total products
        const [totalProducts] = await pool.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE shop_id = ? AND is_active = 1
        `, [shop_id]);
        
        // Get low stock products
        const [lowStock] = await pool.query(`
            SELECT COUNT(*) as count
            FROM products
            WHERE shop_id = ? AND stock_quantity <= low_stock_threshold AND is_active = 1
        `, [shop_id]);
        
        // Get recent sales (last 10)
        const [recentSales] = await pool.query(`
            SELECT s.id, s.total_amount, s.created_at, s.customer_name
            FROM sales s
            WHERE s.shop_id = ?
            ORDER BY s.created_at DESC
            LIMIT 10
        `, [shop_id]);
        
        // Get top selling products
        const [topProducts] = await pool.query(`
            SELECT si.product_name, SUM(si.quantity) as total_quantity, SUM(si.subtotal) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.shop_id = ?
            GROUP BY si.product_name
            ORDER BY total_quantity DESC
            LIMIT 5
        `, [shop_id]);
        
        // Get sales chart data (last 7 days)
        const [salesChart] = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as sales, SUM(total_amount) as revenue
            FROM sales
            WHERE shop_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [shop_id]);

        res.json({
            success: true,
            data: {
                stats: {
                    today_sales: todaySales[0].count,
                    today_revenue: parseFloat(todaySales[0].total),
                    week_sales: weekSales[0].count,
                    week_revenue: parseFloat(weekSales[0].total),
                    month_sales: monthSales[0].count,
                    month_revenue: parseFloat(monthSales[0].total),
                    total_products: totalProducts[0].count,
                    low_stock_products: lowStock[0].count
                },
                recent_sales: recentSales,
                top_products: topProducts,
                sales_chart: salesChart
            }
        });

    } catch (error) {
        console.error('Get shop dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Dashboard (based on role)
const getDashboard = async (req, res) => {
    if (req.user.role === 'super_admin') {
        return getAdminDashboard(req, res);
    } else {
        return getShopDashboard(req, res);
    }
};

module.exports = {
    getDashboard,
    getAdminDashboard,
    getShopDashboard
};
