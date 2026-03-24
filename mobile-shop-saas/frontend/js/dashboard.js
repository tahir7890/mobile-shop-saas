// Dashboard Functions

// Load Admin Dashboard
async function loadAdminDashboard() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        const response = await api.dashboard.getAdmin();
        
        if (response.success) {
            const data = response.data;
            
            contentArea.innerHTML = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h2><i class="bi bi-speedometer2"></i> Admin Dashboard</h2>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-primary">
                            <i class="bi bi-shop icon"></i>
                            <div class="value">${data.stats.total_shops}</div>
                            <div class="label">Total Shops</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-success">
                            <i class="bi bi-people icon"></i>
                            <div class="value">${data.stats.active_users}</div>
                            <div class="label">Active Users</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-info">
                            <i class="bi bi-cart3 icon"></i>
                            <div class="value">${data.stats.total_sales}</div>
                            <div class="label">Total Sales</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-warning">
                            <i class="bi bi-currency-dollar icon"></i>
                            <div class="value">${formatCurrency(data.stats.total_revenue)}</div>
                            <div class="label">Total Revenue</div>
                        </div>
                    </div>
                </div>
                
                <!-- More Stats -->
                <div class="row mb-4">
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-info">
                            <i class="bi bi-calendar-day icon"></i>
                            <div class="value">${data.stats.today_sales}</div>
                            <div class="label">Today's Sales</div>
                            <small>${formatCurrency(data.stats.today_revenue)}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-success">
                            <i class="bi bi-calendar-week icon"></i>
                            <div class="value">${data.stats.month_sales}</div>
                            <div class="label">This Month</div>
                            <small>${formatCurrency(data.stats.month_revenue)}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-warning">
                            <i class="bi bi-calendar-check icon"></i>
                            <div class="value">${data.stats.expiring_subscriptions}</div>
                            <div class="label">Expiring Soon</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-danger">
                            <i class="bi bi-exclamation-triangle icon"></i>
                            <div class="value">${data.stats.low_stock_products}</div>
                            <div class="label">Low Stock</div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Top Shops -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-trophy"></i> Top Performing Shops
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Shop</th>
                                            <th>Sales</th>
                                            <th>Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.top_shops.map(shop => `
                                            <tr>
                                                <td>${shop.name}</td>
                                                <td>${shop.sales_count}</td>
                                                <td>${formatCurrency(shop.revenue)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Recent Sales -->
                    <div class="col-md-6 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-clock-history"></i> Recent Sales
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Shop</th>
                                            <th>Amount</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.recent_sales.map(sale => `
                                            <tr>
                                                <td>${sale.shop_name}</td>
                                                <td>${formatCurrency(sale.total_amount)}</td>
                                                <td>${formatDate(sale.created_at)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load dashboard: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Load Shop Dashboard
async function loadShopDashboard() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        const response = await api.dashboard.getShop();
        
        if (response.success) {
            const data = response.data;
            
            contentArea.innerHTML = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h2><i class="bi bi-speedometer2"></i> Dashboard</h2>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="quick-actions">
                    <button class="quick-action-btn quick-action-billing" onclick="loadBilling()">
                        <i class="bi bi-receipt"></i>
                        <span>New Bill</span>
                    </button>
                    <button class="quick-action-btn quick-action-inventory" onclick="loadInventory()">
                        <i class="bi bi-box-seam"></i>
                        <span>Inventory</span>
                    </button>
                    <button class="quick-action-btn quick-action-reports" onclick="loadShopReports()">
                        <i class="bi bi-graph-up"></i>
                        <span>Reports</span>
                    </button>
                    <button class="quick-action-btn quick-action-dashboard" onclick="loadShopDashboard()">
                        <i class="bi bi-arrow-clockwise"></i>
                        <span>Refresh</span>
                    </button>
                </div>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-info">
                            <i class="bi bi-calendar-day icon"></i>
                            <div class="value">${data.stats.today_sales}</div>
                            <div class="label">Today's Sales</div>
                            <small>${formatCurrency(data.stats.today_revenue)}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-success">
                            <i class="bi bi-calendar-week icon"></i>
                            <div class="value">${data.stats.week_sales}</div>
                            <div class="label">This Week</div>
                            <small>${formatCurrency(data.stats.week_revenue)}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-warning">
                            <i class="bi bi-calendar-month icon"></i>
                            <div class="value">${data.stats.month_sales}</div>
                            <div class="label">This Month</div>
                            <small>${formatCurrency(data.stats.month_revenue)}</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="dashboard-card stat-primary">
                            <i class="bi bi-box-seam icon"></i>
                            <div class="value">${data.stats.total_products}</div>
                            <div class="label">Products</div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Sales Chart -->
                    <div class="col-md-8 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-graph-up"></i> Sales (Last 7 Days)
                            </div>
                            <div class="card-body">
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Top Products -->
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-star"></i> Top Products
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.top_products.map(product => `
                                            <tr>
                                                <td>${product.product_name}</td>
                                                <td>${product.total_quantity}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Sales -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <i class="bi bi-clock-history"></i> Recent Sales
                            </div>
                            <div class="card-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Customer</th>
                                            <th>Amount</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.recent_sales.map(sale => `
                                            <tr>
                                                <td>#${sale.id}</td>
                                                <td>${sale.customer_name || 'Walk-in'}</td>
                                                <td>${formatCurrency(sale.total_amount)}</td>
                                                <td>${formatDate(sale.created_at)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Initialize sales chart
            if (data.sales_chart && data.sales_chart.length > 0) {
                initSalesChart(data.sales_chart);
            }
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load dashboard: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Initialize Sales Chart
function initSalesChart(chartData) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    const labels = chartData.map(d => formatDateOnly(d.date));
    const salesData = chartData.map(d => d.sales);
    const revenueData = chartData.map(d => parseFloat(d.revenue));
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales Count',
                    data: salesData,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Sales'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Revenue (PKR)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}
