// Inventory Management Functions

let inventoryProducts = [];
let categories = [];

// Load Inventory Page
async function loadInventory() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        
        // Load products and categories
        const [productsResponse, categoriesResponse] = await Promise.all([
            api.products.getAll(),
            api.products.getCategories()
        ]);
        
        if (productsResponse.success) {
            inventoryProducts = productsResponse.data;
        }
        
        if (categoriesResponse.success) {
            categories = categoriesResponse.data;
        }
        
        renderInventory();
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load inventory: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Render Inventory
function renderInventory() {
    const contentArea = document.getElementById('contentArea');
    const user = api.getCurrentUser();
    
    contentArea.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="bi bi-box-seam"></i> Inventory</h2>
            </div>
        </div>
        
        <!-- Search and Filter -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <input type="text" class="form-control" id="searchProduct" placeholder="Search products..." onkeyup="filterProducts()">
                    </div>
                    <div class="col-md-3 mb-3">
                        <select class="form-select" id="filterCategory" onchange="filterProducts()">
                            <option value="">All Categories</option>
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <select class="form-select" id="filterType" onchange="filterProducts()">
                            <option value="">All Types</option>
                            <option value="global">Global Products</option>
                            <option value="custom">Custom Products</option>
                        </select>
                    </div>
                    <div class="col-md-2 mb-3">
                        ${user.role === 'shop_user' ? `
                            <button class="btn btn-primary w-100" onclick="openProductModal()">
                                <i class="bi bi-plus-lg"></i> Add Product
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Products Table -->
        <div class="table-container">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Cost Price</th>
                        <th>Sale Price</th>
                        <th>Stock</th>
                        <th>Type</th>
                        ${user.role === 'shop_user' ? '<th>Actions</th>' : ''}
                    </tr>
                </thead>
                <tbody id="productsTableBody">
                </tbody>
            </table>
        </div>
    `;
    
    renderProductsTable(inventoryProducts);
}

// Render Products Table
function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    const user = api.getCurrentUser();
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No products found</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const isLowStock = product.stock_quantity <= product.low_stock_threshold;
        const stockClass = isLowStock ? 'text-danger fw-bold' : '';
        const typeBadge = product.is_global 
            ? '<span class="badge bg-primary">Global</span>' 
            : '<span class="badge bg-success">Custom</span>';
        
        return `
            <tr class="${isLowStock ? 'table-warning' : ''}">
                <td>${product.name}</td>
                <td>${product.category || '-'}</td>
                <td>${product.cost_price ? formatCurrency(product.cost_price) : '-'}</td>
                <td>${formatCurrency(product.sale_price)}</td>
                <td class="${stockClass}">${product.stock_quantity}</td>
                <td>${typeBadge}</td>
                ${user.role === 'shop_user' && !product.is_global ? `
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                ` : user.role === 'shop_user' ? '<td>-</td>' : ''}
            </tr>
        `;
    }).join('');
}

// Filter Products
function filterProducts() {
    const search = document.getElementById('searchProduct').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const type = document.getElementById('filterType').value;
    
    let filtered = inventoryProducts.filter(product => {
        const matchSearch = product.name.toLowerCase().includes(search);
        const matchCategory = !category || product.category === category;
        const matchType = !type || 
            (type === 'global' && product.is_global) || 
            (type === 'custom' && !product.is_global);
        
        return matchSearch && matchCategory && matchType;
    });
    
    renderProductsTable(filtered);
}

// Open Product Modal (Add/Edit)
function openProductModal(productId = null) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    // Populate category datalist
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
    
    if (productId) {
        // Edit mode
        const product = inventoryProducts.find(p => p.id === productId);
        if (!product) return;
        
        title.textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productCostPrice').value = product.cost_price || '';
        document.getElementById('productSalePrice').value = product.sale_price;
        document.getElementById('productStock').value = product.stock_quantity;
        document.getElementById('productLowStock').value = product.low_stock_threshold;
    } else {
        // Add mode
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productLowStock').value = 10;
    }
    
    modal.show();
}

// Edit Product
function editProduct(productId) {
    openProductModal(productId);
}

// Save Product
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value || null,
        cost_price: parseFloat(document.getElementById('productCostPrice').value) || null,
        sale_price: parseFloat(document.getElementById('productSalePrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value) || 0,
        low_stock_threshold: parseInt(document.getElementById('productLowStock').value) || 10,
        is_global: false
    };
    
    // Validation
    if (!productData.name || !productData.sale_price) {
        showToast('Name and sale price are required', 'error');
        return;
    }
    
    try {
        showLoading();
        
        if (productId) {
            // Update
            await api.products.update(productId, productData);
            showToast('Product updated successfully', 'success');
        } else {
            // Create
            await api.products.create(productData);
            showToast('Product added successfully', 'success');
        }
        
        // Close modal and reload
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        await loadInventory();
    } catch (error) {
        showToast(error.message || 'Failed to save product', 'error');
    } finally {
        hideLoading();
    }
}

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        showLoading();
        await api.products.delete(productId);
        showToast('Product deleted successfully', 'success');
        await loadInventory();
    } catch (error) {
        showToast(error.message || 'Failed to delete product', 'error');
    } finally {
        hideLoading();
    }
}

// Load Low Stock Products
async function loadLowStockProducts() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        const response = await api.products.getLowStock();
        
        if (response.success) {
            const products = response.data;
            
            contentArea.innerHTML = `
                <div class="row mb-4">
                    <div class="col-12">
                        <h2><i class="bi bi-exclamation-triangle"></i> Low Stock Products</h2>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="table table-hover table-warning">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Threshold</th>
                                <th>Shop</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="text-center text-muted">No low stock products</td>
                                </tr>
                            ` : products.map(product => `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.category || '-'}</td>
                                    <td class="text-danger fw-bold">${product.stock_quantity}</td>
                                    <td>${product.low_stock_threshold}</td>
                                    <td>${product.is_global ? 'Global' : (product.shop_name || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load low stock products: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}
