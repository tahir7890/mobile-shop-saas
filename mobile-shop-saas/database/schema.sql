-- Mobile Shop Management System - Database Schema
-- Multi-tenant SaaS Architecture

-- Create Database
CREATE DATABASE IF NOT EXISTS mobile_shop_saas;
USE mobile_shop_saas;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'shop_user') NOT NULL DEFAULT 'shop_user',
    shop_id INT NULL,
    phone VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

-- Shops Table
CREATE TABLE shops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    owner_name VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table (Global + Custom)
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    cost_price DECIMAL(10, 2),
    sale_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    is_global TINYINT(1) DEFAULT 0,
    shop_id INT NULL,
    created_by INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shop_id (shop_id),
    INDEX idx_is_global (is_global)
);

-- Sales Table
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    customer_name VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'mobile', 'other') DEFAULT 'cash',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_shop_id (shop_id),
    INDEX idx_created_at (created_at)
);

-- Sale Items Table
CREATE TABLE sale_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_sale_id (sale_id)
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_id INT NOT NULL,
    plan_type ENUM('basic', 'standard', 'premium') DEFAULT 'basic',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_shop_id (shop_id),
    INDEX idx_end_date (end_date)
);

-- Settings Table (for global settings)
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Default Super Admin
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (email, password, full_name, role, phone) VALUES
('admin@mobileshop.com', '$2a$10$VCnLDFATMvniHCipwdP7LeG52.WpRhNaC4uVqHpa/P8TlKGFmJop2', 'Super Admin', 'super_admin', '+923001234567');

-- Insert Default Settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('system_name', 'Mobile Shop Management System', 'System display name'),
('currency', 'PKR', 'Default currency'),
('low_stock_alert', '10', 'Low stock threshold alert'),
('default_subscription_days', '30', 'Default subscription duration in days');

-- Create Views for Reports

-- Daily Sales View
CREATE VIEW daily_sales AS
SELECT 
    DATE(s.created_at) as sale_date,
    s.shop_id,
    sh.name as shop_name,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_revenue
FROM sales s
JOIN shops sh ON s.shop_id = sh.id
GROUP BY DATE(s.created_at), s.shop_id;

-- Weekly Sales View
CREATE VIEW weekly_sales AS
SELECT 
    YEARWEEK(s.created_at, 1) as week,
    MIN(DATE(s.created_at)) as week_start,
    MAX(DATE(s.created_at)) as week_end,
    s.shop_id,
    sh.name as shop_name,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_revenue
FROM sales s
JOIN shops sh ON s.shop_id = sh.id
GROUP BY YEARWEEK(s.created_at, 1), s.shop_id;

-- Monthly Sales View
CREATE VIEW monthly_sales AS
SELECT 
    YEAR(s.created_at) as year,
    MONTH(s.created_at) as month,
    s.shop_id,
    sh.name as shop_name,
    COUNT(s.id) as total_sales,
    SUM(s.total_amount) as total_revenue
FROM sales s
JOIN shops sh ON s.shop_id = sh.id
GROUP BY YEAR(s.created_at), MONTH(s.created_at), s.shop_id;

-- Low Stock View
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.stock_quantity,
    p.low_stock_threshold,
    p.shop_id,
    sh.name as shop_name,
    p.is_global
FROM products p
LEFT JOIN shops sh ON p.shop_id = sh.id
WHERE p.stock_quantity <= p.low_stock_threshold AND p.is_active = 1;

-- Dashboard Stats View
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(DISTINCT s.id) as total_shops,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.is_active = 1 THEN u.id END) as active_users,
    COALESCE(SUM(sales.total_amount), 0) as total_revenue,
    COALESCE(COUNT(sales.id), 0) as total_sales
FROM shops s
LEFT JOIN users u ON u.shop_id = s.id
LEFT JOIN sales sales ON sales.shop_id = s.id;
