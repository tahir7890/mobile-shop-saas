// Reports Functions

// Load Reports Page (Admin)
async function loadReports() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        
        // Load today's report
        const todayResponse = await api.reports.getDaily();
        
        // Load monthly report
        const monthResponse = await api.reports.getMonthly();
        
        // Load product report
        const productResponse = await api.reports.getProducts();
        
        if (todayResponse.success && monthResponse.success && productResponse.success) {
            renderAdminReports(todayResponse.data, monthResponse.data, productResponse.data);
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load reports: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Render Admin Reports
function renderAdminReports(todayData, monthData, productData) {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="bi bi-graph-up"></i> Reports</h2>
            </div>
        </div>
        
        <!-- Report Type Tabs -->
        <ul class="nav nav-tabs mb-4" id="reportTabs">
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="showReportTab('daily'); return false;">Daily</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('weekly'); return false;">Weekly</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('monthly'); return false;">Monthly</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('products'); return false;">Products</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('shops'); return false;">Shop Comparison</a>
            </li>
        </ul>
        
        <!-- Daily Report -->
        <div id="dailyReport" class="report-tab">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-day"></i> Today's Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-control" id="dailyReportDate" 
                                value="${new Date().toISOString().split('T')[0]}"
                                onchange="loadDailyReport()">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dashboard-card stat-info">
                                <div class="value">${todayData.total_sales}</div>
                                <div class="label">Total Sales</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="dashboard-card stat-success">
                                <div class="value">${formatCurrency(todayData.total_revenue)}</div>
                                <div class="label">Total Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <h5>Sales Details</h5>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Shop</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${todayData.sales.map(sale => `
                            <tr>
                                <td>#${sale.id}</td>
                                <td>${sale.shop_name}</td>
                                <td>${sale.customer_name || 'Walk-in'}</td>
                                <td>${formatCurrency(sale.total_amount)}</td>
                                <td>${sale.payment_method}</td>
                                <td>${formatDate(sale.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Weekly Report -->
        <div id="weeklyReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-week"></i> Weekly Sales Report
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" onclick="loadWeeklyReport()">
                        <i class="bi bi-arrow-clockwise"></i> Load Report
                    </button>
                </div>
            </div>
            <div id="weeklyReportContent"></div>
        </div>
        
        <!-- Monthly Report -->
        <div id="monthlyReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-month"></i> Monthly Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Month</label>
                            <select class="form-select" id="monthlyReportMonth" onchange="loadMonthlyReport()">
                                ${Array.from({length: 12}, (_, i) => 
                                    `<option value="${i + 1}" ${new Date().getMonth() === i ? 'selected' : ''}>
                                        ${new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Year</label>
                            <select class="form-select" id="monthlyReportYear" onchange="loadMonthlyReport()">
                                ${Array.from({length: 5}, (_, i) => 
                                    `<option value="${new Date().getFullYear() - i}" ${i === 0 ? 'selected' : ''}>
                                        ${new Date().getFullYear() - i}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dashboard-card stat-info">
                                <div class="value">${monthData.total_sales}</div>
                                <div class="label">Total Sales</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="dashboard-card stat-success">
                                <div class="value">${formatCurrency(monthData.total_revenue)}</div>
                                <div class="label">Total Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">Daily Sales Chart</div>
                        <div class="card-body">
                            <canvas id="monthlySalesChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">Top Products</div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthData.top_products.map(p => `
                                        <tr>
                                            <td>${p.product_name}</td>
                                            <td>${p.total_quantity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Products Report -->
        <div id="productsReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-box-seam"></i> Product Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="productReportStart">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" id="productReportEnd">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-primary" onclick="loadProductReport()">
                                <i class="bi bi-search"></i> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Sales Count</th>
                            <th>Total Qty</th>
                            <th>Revenue</th>
                            <th>Avg Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productData.map(p => `
                            <tr>
                                <td>${p.product_name}</td>
                                <td>${p.category || '-'}</td>
                                <td>${p.sales_count}</td>
                                <td>${p.total_quantity}</td>
                                <td>${formatCurrency(p.total_revenue)}</td>
                                <td>${formatCurrency(p.avg_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Shop Comparison Report -->
        <div id="shopsReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-shop"></i> Shop Comparison Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="shopReportStart">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" id="shopReportEnd">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-primary" onclick="loadShopComparisonReport()">
                                <i class="bi bi-search"></i> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="shopComparisonContent"></div>
        </div>
    `;
    
    // Initialize monthly chart
    if (monthData.daily_data && monthData.daily_data.length > 0) {
        initMonthlyChart(monthData.daily_data);
    }
}

// Load Shop Reports (for Shop Users)
async function loadShopReports() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        
        // Load today's report
        const todayResponse = await api.reports.getDaily();
        
        // Load monthly report
        const monthResponse = await api.reports.getMonthly();
        
        // Load product report
        const productResponse = await api.reports.getProducts();
        
        if (todayResponse.success && monthResponse.success && productResponse.success) {
            renderShopReports(todayResponse.data, monthResponse.data, productResponse.data);
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load reports: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Render Shop Reports
function renderShopReports(todayData, monthData, productData) {
    const contentArea = document.getElementById('contentArea');
    
    contentArea.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="bi bi-graph-up"></i> Reports</h2>
            </div>
        </div>
        
        <!-- Report Type Tabs -->
        <ul class="nav nav-tabs mb-4" id="reportTabs">
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="showReportTab('daily'); return false;">Daily</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('weekly'); return false;">Weekly</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('monthly'); return false;">Monthly</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="showReportTab('products'); return false;">Products</a>
            </li>
        </ul>
        
        <!-- Daily Report -->
        <div id="dailyReport" class="report-tab">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-day"></i> Today's Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Date</label>
                            <input type="date" class="form-control" id="dailyReportDate" 
                                value="${new Date().toISOString().split('T')[0]}"
                                onchange="loadDailyReport()">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dashboard-card stat-info">
                                <div class="value">${todayData.total_sales}</div>
                                <div class="label">Total Sales</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="dashboard-card stat-success">
                                <div class="value">${formatCurrency(todayData.total_revenue)}</div>
                                <div class="label">Total Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <h5>Sales Details</h5>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${todayData.sales.map(sale => `
                            <tr>
                                <td>#${sale.id}</td>
                                <td>${sale.customer_name || 'Walk-in'}</td>
                                <td>${formatCurrency(sale.total_amount)}</td>
                                <td>${sale.payment_method}</td>
                                <td>${formatDate(sale.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Weekly Report -->
        <div id="weeklyReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-week"></i> Weekly Sales Report
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" onclick="loadWeeklyReport()">
                        <i class="bi bi-arrow-clockwise"></i> Load Report
                    </button>
                </div>
            </div>
            <div id="weeklyReportContent"></div>
        </div>
        
        <!-- Monthly Report -->
        <div id="monthlyReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-calendar-month"></i> Monthly Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Month</label>
                            <select class="form-select" id="monthlyReportMonth" onchange="loadMonthlyReport()">
                                ${Array.from({length: 12}, (_, i) => 
                                    `<option value="${i + 1}" ${new Date().getMonth() === i ? 'selected' : ''}>
                                        ${new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Year</label>
                            <select class="form-select" id="monthlyReportYear" onchange="loadMonthlyReport()">
                                ${Array.from({length: 5}, (_, i) => 
                                    `<option value="${new Date().getFullYear() - i}" ${i === 0 ? 'selected' : ''}>
                                        ${new Date().getFullYear() - i}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="dashboard-card stat-info">
                                <div class="value">${monthData.total_sales}</div>
                                <div class="label">Total Sales</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="dashboard-card stat-success">
                                <div class="value">${formatCurrency(monthData.total_revenue)}</div>
                                <div class="label">Total Revenue</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">Daily Sales Chart</div>
                        <div class="card-body">
                            <canvas id="monthlySalesChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">Top Products</div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${monthData.top_products.map(p => `
                                        <tr>
                                            <td>${p.product_name}</td>
                                            <td>${p.total_quantity}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Products Report -->
        <div id="productsReport" class="report-tab d-none">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-box-seam"></i> Product Sales Report
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="productReportStart">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">End Date</label>
                            <input type="date" class="form-control" id="productReportEnd">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-primary" onclick="loadProductReport()">
                                <i class="bi bi-search"></i> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Sales Count</th>
                            <th>Total Qty</th>
                            <th>Revenue</th>
                            <th>Avg Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productData.map(p => `
                            <tr>
                                <td>${p.product_name}</td>
                                <td>${p.category || '-'}</td>
                                <td>${p.sales_count}</td>
                                <td>${p.total_quantity}</td>
                                <td>${formatCurrency(p.total_revenue)}</td>
                                <td>${formatCurrency(p.avg_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Initialize monthly chart
    if (monthData.daily_data && monthData.daily_data.length > 0) {
        initMonthlyChart(monthData.daily_data);
    }
}

// Show Report Tab
function showReportTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.report-tab').forEach(tab => {
        tab.classList.add('d-none');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('#reportTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Report`).classList.remove('d-none');
    
    // Add active class to clicked link
    event.target.classList.add('active');
}

// Load Daily Report
async function loadDailyReport() {
    const date = document.getElementById('dailyReportDate').value;
    
    try {
        showLoading();
        const response = await api.reports.getDaily({ date });
        
        if (response.success) {
            showToast('Report loaded', 'success');
            // Reload reports page with new data
            const user = api.getCurrentUser();
            if (user.role === 'super_admin') {
                loadReports();
            } else {
                loadShopReports();
            }
        }
    } catch (error) {
        showToast(error.message || 'Failed to load report', 'error');
    } finally {
        hideLoading();
    }
}

// Load Weekly Report
async function loadWeeklyReport() {
    try {
        showLoading();
        const response = await api.reports.getWeekly();
        
        if (response.success) {
            const data = response.data;
            
            document.getElementById('weeklyReportContent').innerHTML = `
                <div class="card mb-4">
                    <div class="card-header">
                        <i class="bi bi-calendar-week"></i> Week ${data.week}, ${data.year}
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="dashboard-card stat-info">
                                    <div class="value">${data.total_sales}</div>
                                    <div class="label">Total Sales</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="dashboard-card stat-success">
                                    <div class="value">${formatCurrency(data.total_revenue)}</div>
                                    <div class="label">Total Revenue</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <h5>Daily Breakdown</h5>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Sales</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.daily_data.map(d => `
                                <tr>
                                    <td>${formatDateOnly(d.date)}</td>
                                    <td>${d.sales_count}</td>
                                    <td>${formatCurrency(d.revenue)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        showToast(error.message || 'Failed to load report', 'error');
    } finally {
        hideLoading();
    }
}

// Load Monthly Report
async function loadMonthlyReport() {
    const month = document.getElementById('monthlyReportMonth').value;
    const year = document.getElementById('monthlyReportYear').value;
    
    try {
        showLoading();
        const response = await api.reports.getMonthly({ month, year });
        
        if (response.success) {
            showToast('Report loaded', 'success');
            // Reload reports page with new data
            const user = api.getCurrentUser();
            if (user.role === 'super_admin') {
                loadReports();
            } else {
                loadShopReports();
            }
        }
    } catch (error) {
        showToast(error.message || 'Failed to load report', 'error');
    } finally {
        hideLoading();
    }
}

// Load Product Report
async function loadProductReport() {
    const startDate = document.getElementById('productReportStart').value;
    const endDate = document.getElementById('productReportEnd').value;
    
    try {
        showLoading();
        const response = await api.reports.getProducts({ 
            start_date: startDate, 
            end_date: endDate 
        });
        
        if (response.success) {
            showToast('Report loaded', 'success');
            // Reload reports page with new data
            const user = api.getCurrentUser();
            if (user.role === 'super_admin') {
                loadReports();
            } else {
                loadShopReports();
            }
        }
    } catch (error) {
        showToast(error.message || 'Failed to load report', 'error');
    } finally {
        hideLoading();
    }
}

// Load Shop Comparison Report
async function loadShopComparisonReport() {
    const startDate = document.getElementById('shopReportStart').value;
    const endDate = document.getElementById('shopReportEnd').value;
    
    try {
        showLoading();
        const response = await api.reports.getShopComparison({ 
            start_date: startDate, 
            end_date: endDate 
        });
        
        if (response.success) {
            const data = response.data;
            
            document.getElementById('shopComparisonContent').innerHTML = `
                <div class="table-container">
                    <h5>Shop Performance Comparison</h5>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Shop</th>
                                <th>Sales Count</th>
                                <th>Total Revenue</th>
                                <th>Average Sale</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(shop => `
                                <tr>
                                    <td>${shop.shop_name}</td>
                                    <td>${shop.sales_count}</td>
                                    <td>${formatCurrency(shop.total_revenue)}</td>
                                    <td>${formatCurrency(shop.avg_sale_value)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        showToast(error.message || 'Failed to load report', 'error');
    } finally {
        hideLoading();
    }
}

// Initialize Monthly Chart
function initMonthlyChart(chartData) {
    const ctx = document.getElementById('monthlySalesChart');
    if (!ctx) return;
    
    const labels = chartData.map(d => formatDateOnly(d.date));
    const salesData = chartData.map(d => d.sales_count);
    const revenueData = chartData.map(d => parseFloat(d.revenue));
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Sales Count',
                    data: salesData,
                    backgroundColor: 'rgba(13, 110, 253, 0.5)',
                    borderColor: '#0d6efd',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(25, 135, 84, 0.5)',
                    borderColor: '#198754',
                    borderWidth: 1,
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
