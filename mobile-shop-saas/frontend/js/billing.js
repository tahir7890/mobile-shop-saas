// Billing Functions

let cart = [];
let allProducts = [];
let currentSale = null;

// Load Billing Page
async function loadBilling() {
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
    
    try {
        showLoading();
        
        // Load products
        const response = await api.products.getAll();
        
        if (response.success) {
            allProducts = response.data;
            cart = [];
            renderBilling();
        }
    } catch (error) {
        contentArea.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Failed to load billing: ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Render Billing Page
function renderBilling() {
    const contentArea = document.getElementById('contentArea');
    const user = api.getCurrentUser();
    
    contentArea.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="bi bi-receipt"></i> New Bill</h2>
            </div>
        </div>
        
        <div class="row">
            <!-- Products Grid -->
            <div class="col-lg-8 mb-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-box-seam"></i> Products
                        <input type="text" class="form-control form-control-sm mt-2" 
                               placeholder="Search products..." 
                               id="searchBillingProduct" 
                               onkeyup="filterBillingProducts()">
                    </div>
                    <div class="card-body">
                        <div class="product-grid" id="billingProductGrid">
                            ${renderProductGrid(allProducts)}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Cart -->
            <div class="col-lg-4 mb-4">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-cart3"></i> Cart
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Customer Name (Optional)</label>
                            <input type="text" class="form-control" id="customerName" placeholder="Walk-in customer">
                        </div>
                        
                        <div id="cartItems">
                            ${cart.length === 0 ? '<p class="text-muted text-center">Cart is empty</p>' : renderCartItems()}
                        </div>
                        
                        <hr>
                        
                        <div class="d-flex justify-content-between mb-2">
                            <span>Subtotal:</span>
                            <span id="subtotal">${formatCurrency(calculateSubtotal())}</span>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-3">
                            <strong>Total:</strong>
                            <strong id="totalAmount" class="text-primary">${formatCurrency(calculateTotal())}</strong>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Payment Method</label>
                            <select class="form-select" id="paymentMethod">
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="mobile">Mobile Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <button class="btn btn-success w-100 btn-lg" onclick="completeSale()" ${cart.length === 0 ? 'disabled' : ''}>
                            <i class="bi bi-check-circle"></i> Complete Sale
                        </button>
                        
                        <button class="btn btn-outline-danger w-100 mt-2" onclick="clearCart()">
                            <i class="bi bi-trash"></i> Clear Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Product Grid
function renderProductGrid(products) {
    if (products.length === 0) {
        return '<p class="text-muted text-center">No products available</p>';
    }
    
    return products.map(product => {
        const inCart = cart.find(item => item.product_id === product.id);
        const isLowStock = product.stock_quantity <= product.low_stock_threshold;
        const isOutOfStock = product.stock_quantity === 0;
        
        return `
            <div class="product-card ${isLowStock ? 'low-stock' : ''} ${inCart ? 'selected' : ''}" 
                 onclick="${isOutOfStock ? '' : `addToCart(${product.id})`}"
                 style="${isOutOfStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                <div class="product-icon">
                    <i class="bi bi-phone"></i>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.sale_price)}</div>
                <div class="product-stock">
                    ${isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock_quantity}`}
                </div>
                ${inCart ? `<div class="badge bg-primary position-absolute top-0 end-0 m-2">In Cart</div>` : ''}
            </div>
        `;
    }).join('');
}

// Filter Billing Products
function filterBillingProducts() {
    const search = document.getElementById('searchBillingProduct').value.toLowerCase();
    const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(search)
    );
    
    document.getElementById('billingProductGrid').innerHTML = renderProductGrid(filtered);
}

// Add to Cart
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock_quantity === 0) return;
    
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
            existingItem.quantity++;
        } else {
            showToast('Maximum stock reached', 'warning');
            return;
        }
    } else {
        cart.push({
            product_id: product.id,
            product_name: product.name,
            unit_price: product.sale_price,
            quantity: 1,
            max_quantity: product.stock_quantity
        });
    }
    
    updateCartDisplay();
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    updateCartDisplay();
}

// Update Cart Item Quantity
function updateCartItemQuantity(productId, change) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.max_quantity) {
        showToast('Maximum stock reached', 'warning');
        return;
    }
    
    item.quantity = newQuantity;
    updateCartDisplay();
}

// Render Cart Items
function renderCartItems() {
    return cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product_name}</div>
                <div class="cart-item-price">${formatCurrency(item.unit_price)} each</div>
            </div>
            <div class="cart-item-controls">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItemQuantity(${item.product_id}, -1)">-</button>
                <input type="number" class="form-control form-control-sm cart-item-quantity" 
                       value="${item.quantity}" 
                       min="1" 
                       max="${item.max_quantity}"
                       onchange="setCartItemQuantity(${item.product_id}, this.value)">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateCartItemQuantity(${item.product_id}, 1)">+</button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${item.product_id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            <div class="cart-item-subtotal">${formatCurrency(item.quantity * item.unit_price)}</div>
        </div>
    `).join('');
}

// Set Cart Item Quantity
function setCartItemQuantity(productId, value) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;
    
    const newQuantity = parseInt(value);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > item.max_quantity) {
        showToast('Maximum stock reached', 'warning');
        updateCartDisplay();
        return;
    }
    
    item.quantity = newQuantity;
    updateCartDisplay();
}

// Update Cart Display
function updateCartDisplay() {
    document.getElementById('cartItems').innerHTML = cart.length === 0 
        ? '<p class="text-muted text-center">Cart is empty</p>' 
        : renderCartItems();
    
    document.getElementById('subtotal').textContent = formatCurrency(calculateSubtotal());
    document.getElementById('totalAmount').textContent = formatCurrency(calculateTotal());
    
    // Update product grid to show selected items
    const search = document.getElementById('searchBillingProduct')?.value.toLowerCase() || '';
    const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(search)
    );
    document.getElementById('billingProductGrid').innerHTML = renderProductGrid(filtered);
    
    // Enable/disable complete sale button
    const completeBtn = document.querySelector('button[onclick="completeSale()"]');
    if (completeBtn) {
        completeBtn.disabled = cart.length === 0;
    }
}

// Calculate Subtotal
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
}

// Calculate Total
function calculateTotal() {
    return calculateSubtotal();
}

// Clear Cart
function clearCart() {
    if (cart.length === 0) return;
    
    if (!confirm('Are you sure you want to clear the cart?')) {
        return;
    }
    
    cart = [];
    updateCartDisplay();
    showToast('Cart cleared', 'info');
}

// Complete Sale
async function completeSale() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    
    const customerName = document.getElementById('customerName').value || null;
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    const saleData = {
        customer_name: customerName,
        items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        })),
        payment_method: paymentMethod
    };
    
    try {
        showLoading();
        const response = await api.sales.create(saleData);
        
        if (response.success) {
            currentSale = response.data;
            showToast('Sale completed successfully!', 'success');
            
            // Show print modal
            showBillPrintModal(response.data);
            
            // Clear cart and reload
            cart = [];
            await loadBilling();
        }
    } catch (error) {
        showToast(error.message || 'Failed to complete sale', 'error');
    } finally {
        hideLoading();
    }
}

// Show Bill Print Modal
function showBillPrintModal(sale) {
    const modal = new bootstrap.Modal(document.getElementById('billPrintModal'));
    const printArea = document.getElementById('billPrintArea');
    
    const user = api.getCurrentUser();
    const shopName = user.shop?.name || 'Mobile Shop';
    const shopAddress = user.shop?.address || '';
    const shopPhone = user.shop?.phone || '';
    
    printArea.innerHTML = `
        <div class="bill-header">
            <h3>${shopName}</h3>
            ${shopAddress ? `<p>${shopAddress}</p>` : ''}
            ${shopPhone ? `<p>Phone: ${shopPhone}</p>` : ''}
            <p>Date: ${formatDate(sale.created_at)}</p>
            <p>Bill #${sale.id}</p>
        </div>
        
        ${sale.customer_name ? `<p><strong>Customer:</strong> ${sale.customer_name}</p>` : ''}
        
        <div class="bill-items">
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
            </div>
            ${sale.items.map(item => `
                <div class="bill-item">
                    <span style="flex: 2;">${item.product_name}</span>
                    <span style="flex: 1;">${item.quantity}</span>
                    <span style="flex: 1;">${formatCurrency(item.unit_price)}</span>
                    <span style="flex: 1;">${formatCurrency(item.subtotal)}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="bill-footer">
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Total:</strong></span>
                <span><strong>${formatCurrency(sale.total_amount)}</strong></span>
            </div>
            <p style="margin-top: 10px;">Payment: ${sale.payment_method.toUpperCase()}</p>
            <p style="text-align: center; margin-top: 20px;">Thank you for your business!</p>
        </div>
    `;
    
    modal.show();
}

// Print Bill
function printBill() {
    const printContent = document.getElementById('billPrintArea').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="max-width: 300px; margin: 0 auto; font-family: 'Courier New', monospace;">
            ${printContent}
        </div>
    `;
    
    window.print();
    
    document.body.innerHTML = originalContent;
    location.reload();
}

// Download Bill as PDF
function downloadBillPDF() {
    if (!currentSale) return;
    
    // Check if jsPDF is loaded using global flags
    if (window.jspdfLoadError) {
        showToast('jsPDF library failed to load from CDN. PDF download is not available. Please check your internet connection or try a different network.', 'error');
        console.error('jsPDF library failed to load');
        return;
    }
    
    if (!window.jspdfLoaded || !window.jspdf || !window.jspdf.jsPDF) {
        showToast('jsPDF library is still loading. Please wait a moment and try again.', 'warning');
        console.warn('jsPDF library not yet loaded');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Thermal printer size
    });
    
    const user = api.getCurrentUser();
    const shopName = user.shop?.name || 'Mobile Shop';
    const shopAddress = user.shop?.address || '';
    const shopPhone = user.shop?.phone || '';
    
    let y = 10;
    const leftMargin = 5;
    const rightMargin = 75;
    
    // Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(shopName, 40, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    if (shopAddress) {
        doc.text(shopAddress, 40, y, { align: 'center' });
        y += 4;
    }
    if (shopPhone) {
        doc.text(`Phone: ${shopPhone}`, 40, y, { align: 'center' });
        y += 4;
    }
    
    doc.text(`Date: ${formatDate(currentSale.created_at)}`, 40, y, { align: 'center' });
    y += 4;
    doc.text(`Bill #${currentSale.id}`, 40, y, { align: 'center' });
    y += 6;
    
    // Customer
    if (currentSale.customer_name) {
        doc.text(`Customer: ${currentSale.customer_name}`, leftMargin, y);
        y += 5;
    }
    
    // Line
    doc.line(leftMargin, y, rightMargin, y);
    y += 5;
    
    // Items header
    doc.setFont('helvetica', 'bold');
    doc.text('Item', leftMargin, y);
    doc.text('Qty', 45, y);
    doc.text('Price', 55, y);
    doc.text('Total', rightMargin, y, { align: 'right' });
    y += 5;
    
    // Line
    doc.line(leftMargin, y, rightMargin, y);
    y += 5;
    
    // Items
    doc.setFont('helvetica', 'normal');
    currentSale.items.forEach(item => {
        const name = item.product_name.substring(0, 20);
        doc.text(name, leftMargin, y);
        doc.text(item.quantity.toString(), 45, y);
        doc.text(formatCurrency(item.unit_price), 55, y);
        doc.text(formatCurrency(item.subtotal), rightMargin, y, { align: 'right' });
        y += 4;
    });
    
    // Line
    y += 2;
    doc.line(leftMargin, y, rightMargin, y);
    y += 5;
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', leftMargin, y);
    doc.text(formatCurrency(currentSale.total_amount), rightMargin, y, { align: 'right' });
    y += 5;
    
    // Payment
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment: ${currentSale.payment_method.toUpperCase()}`, leftMargin, y);
    y += 8;
    
    // Thank you
    doc.text('Thank you!', 40, y, { align: 'center' });
    
    // Save
    doc.save(`bill_${currentSale.id}.pdf`);
    showToast('PDF downloaded', 'success');
}
