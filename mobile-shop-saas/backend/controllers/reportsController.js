const pool = require('../config/database');

// Get Daily Sales Report
const getDailySalesReport = async (req, res) => {
    try {
        const { date, shop_id } = req.query;
        const reportDate = date || new Date().toISOString().split('T')[0];

        let query = `
            SELECT 
                s.id,
                s.customer_name,
                s.total_amount,
                s.payment_method,
                s.created_at,
                sh.name as shop_name,
                COUNT(si.id) as item_count
            FROM sales s
            JOIN shops sh ON s.shop_id = sh.id
            LEFT JOIN sale_items si ON s.id = si.sale_id
            WHERE DATE(s.created_at) = ?
        `;

        const params = [reportDate];

        // Shop users can only see their own shop's data
        if (req.user.role === 'shop_user') {
            query += ' AND s.shop_id = ?';
            params.push(req.user.shop_id);
        } else if (shop_id) {
            query += ' AND s.shop_id = ?';
            params.push(shop_id);
        }

        query += ' GROUP BY s.id ORDER BY s.created_at DESC';

        const [sales] = await pool.query(query, params);

        // Calculate totals
        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);

        res.json({
            success: true,
            data: {
                date: reportDate,
                total_sales: totalSales,
                total_revenue: totalRevenue,
                sales
            }
        });

    } catch (error) {
        console.error('Get daily sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Weekly Sales Report
const getWeeklySalesReport = async (req, res) => {
    try {
        const { week, year, shop_id } = req.query;
        const currentWeek = week || getWeekNumber(new Date());
        const currentYear = year || new Date().getFullYear();

        let query = `
            SELECT 
                DATE(s.created_at) as date,
                COUNT(s.id) as sales_count,
                SUM(s.total_amount) as revenue
            FROM sales s
            WHERE YEARWEEK(s.created_at, 1) = YEARWEEK(STR_TO_DATE(CONCAT(?, ' Sunday'), '%X%V %W'), 1)
        `;

        const params = [`${currentYear}-${currentWeek.toString().padStart(2, '0')}`];

        // Shop users can only see their own shop's data
        if (req.user.role === 'shop_user') {
            query += ' AND s.shop_id = ?';
            params.push(req.user.shop_id);
        } else if (shop_id) {
            query += ' AND s.shop_id = ?';
            params.push(shop_id);
        }

        query += ' GROUP BY DATE(s.created_at) ORDER BY date ASC';

        const [dailyData] = await pool.query(query, params);

        // Calculate totals
        const totalSales = dailyData.reduce((sum, day) => sum + day.sales_count, 0);
        const totalRevenue = dailyData.reduce((sum, day) => sum + parseFloat(day.revenue), 0);

        res.json({
            success: true,
            data: {
                week: currentWeek,
                year: currentYear,
                total_sales: totalSales,
                total_revenue: totalRevenue,
                daily_data: dailyData
            }
        });

    } catch (error) {
        console.error('Get weekly sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Monthly Sales Report
const getMonthlySalesReport = async (req, res) => {
    try {
        const { month, year, shop_id } = req.query;
        const currentMonth = month || new Date().getMonth() + 1;
        const currentYear = year || new Date().getFullYear();

        let query = `
            SELECT 
                DATE(s.created_at) as date,
                COUNT(s.id) as sales_count,
                SUM(s.total_amount) as revenue
            FROM sales s
            WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ?
        `;

        const params = [currentYear, currentMonth];

        // Shop users can only see their own shop's data
        if (req.user.role === 'shop_user') {
            query += ' AND s.shop_id = ?';
            params.push(req.user.shop_id);
        } else if (shop_id) {
            query += ' AND s.shop_id = ?';
            params.push(shop_id);
        }

        query += ' GROUP BY DATE(s.created_at) ORDER BY date ASC';

        const [dailyData] = await pool.query(query, params);

        // Calculate totals
        const totalSales = dailyData.reduce((sum, day) => sum + day.sales_count, 0);
        const totalRevenue = dailyData.reduce((sum, day) => sum + parseFloat(day.revenue), 0);

        // Get top products for the month
        let productQuery = `
            SELECT 
                si.product_name,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ?
        `;

        const productParams = [currentYear, currentMonth];

        if (req.user.role === 'shop_user') {
            productQuery += ' AND s.shop_id = ?';
            productParams.push(req.user.shop_id);
        } else if (shop_id) {
            productQuery += ' AND s.shop_id = ?';
            productParams.push(shop_id);
        }

        productQuery += ' GROUP BY si.product_name ORDER BY total_quantity DESC LIMIT 10';

        const [topProducts] = await pool.query(productQuery, productParams);

        res.json({
            success: true,
            data: {
                month: currentMonth,
                year: currentYear,
                total_sales: totalSales,
                total_revenue: totalRevenue,
                daily_data: dailyData,
                top_products: topProducts
            }
        });

    } catch (error) {
        console.error('Get monthly sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Product Sales Report
const getProductSalesReport = async (req, res) => {
    try {
        const { start_date, end_date, shop_id } = req.query;

        let query = `
            SELECT 
                si.product_name,
                p.category,
                COUNT(DISTINCT si.sale_id) as sales_count,
                SUM(si.quantity) as total_quantity,
                SUM(si.subtotal) as total_revenue,
                AVG(si.unit_price) as avg_price
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE 1=1
        `;

        const params = [];

        if (start_date) {
            query += ' AND DATE(s.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(s.created_at) <= ?';
            params.push(end_date);
        }

        // Shop users can only see their own shop's data
        if (req.user.role === 'shop_user') {
            query += ' AND s.shop_id = ?';
            params.push(req.user.shop_id);
        } else if (shop_id) {
            query += ' AND s.shop_id = ?';
            params.push(shop_id);
        }

        query += ' GROUP BY si.product_name, p.category ORDER BY total_revenue DESC';

        const [products] = await pool.query(query, params);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Get product sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Shop Comparison Report (Super Admin only)
const getShopComparisonReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT 
                s.id as shop_id,
                s.name as shop_name,
                COUNT(DISTINCT sales.id) as sales_count,
                SUM(sales.total_amount) as total_revenue,
                AVG(sales.total_amount) as avg_sale_value
            FROM shops s
            LEFT JOIN sales sales ON s.id = sales.shop_id
            WHERE 1=1
        `;

        const params = [];

        if (start_date) {
            query += ' AND DATE(sales.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(sales.created_at) <= ?';
            params.push(end_date);
        }

        query += ' GROUP BY s.id ORDER BY total_revenue DESC';

        const [shops] = await pool.query(query, params);

        res.json({
            success: true,
            data: shops
        });

    } catch (error) {
        console.error('Get shop comparison report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Payment Method Report
const getPaymentMethodReport = async (req, res) => {
    try {
        const { start_date, end_date, shop_id } = req.query;

        let query = `
            SELECT 
                payment_method,
                COUNT(*) as sales_count,
                SUM(total_amount) as total_revenue
            FROM sales
            WHERE 1=1
        `;

        const params = [];

        if (start_date) {
            query += ' AND DATE(created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(created_at) <= ?';
            params.push(end_date);
        }

        // Shop users can only see their own shop's data
        if (req.user.role === 'shop_user') {
            query += ' AND shop_id = ?';
            params.push(req.user.shop_id);
        } else if (shop_id) {
            query += ' AND shop_id = ?';
            params.push(shop_id);
        }

        query += ' GROUP BY payment_method ORDER BY total_revenue DESC';

        const [paymentMethods] = await pool.query(query, params);

        res.json({
            success: true,
            data: paymentMethods
        });

    } catch (error) {
        console.error('Get payment method report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Helper function to get week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

module.exports = {
    getDailySalesReport,
    getWeeklySalesReport,
    getMonthlySalesReport,
    getProductSalesReport,
    getShopComparisonReport,
    getPaymentMethodReport
};
