// Admin Management Module - Users, Shops, Subscriptions

// Load Users Management Page
async function loadUsers() {
    showLoading();
    try {
        const response = await api.users.getAll();
        const users = response.data;
        
        const content = `
            <div class="page-header">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h2><i class="fas fa-users"></i> Users Management</h2>
                    <button class="btn btn-primary" onclick="openUserModal()">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="usersTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Shop</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.length === 0 ? '<tr><td colspan="6" class="text-center">No users found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = content;
        renderUsersTable(users);
    } catch (error) {
        showToast('Error loading users: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Render Users Table
function renderUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge ${user.role === 'super_admin' ? 'bg-danger' : 'bg-primary'}">${user.role === 'super_admin' ? 'Super Admin' : 'Shop User'}</span></td>
            <td>${user.shop_name || '-'}</td>
            <td><span class="badge ${user.is_active ? 'bg-success' : 'bg-secondary'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${user.role !== 'super_admin' ? `
                <button class="btn btn-sm btn-warning" onclick="toggleUserStatus(${user.id})" title="Toggle Status">
                    <i class="fas fa-power-off"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Open User Modal (Add/Edit)
async function openUserModal(userId = null) {
    const modal = document.getElementById('userModal');
    const modalTitle = modal.querySelector('.modal-title');
    const form = document.getElementById('userForm');
    
    // Load shops for dropdown
    const shopsResponse = await api.shops.getAll();
    const shops = shopsResponse.data;
    
    const shopOptions = shops.map(shop => 
        `<option value="${shop.id}">${shop.name}</option>`
    ).join('');
    
    document.getElementById('userShop').innerHTML = '<option value="">Select Shop</option>' + shopOptions;
    
    if (userId) {
        // Edit mode - load user data
        modalTitle.textContent = 'Edit User';
        const response = await api.users.getById(userId);
        const user = response.data;
        
        document.getElementById('userId').value = user.id;
        document.getElementById('userFullName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userShop').value = user.shop_id || '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
    } else {
        // Add mode
        modalTitle.textContent = 'Add New User';
        form.reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').placeholder = 'Enter password';
    }
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Save User
async function saveUser() {
    
    const userId = document.getElementById('userId').value;
    const userData = {
        full_name: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        shop_id: document.getElementById('userShop').value || null
    };
    
    const password = document.getElementById('userPassword').value;
    
    // Password is required when creating a new user
    if (!userId && !password) {
        showToast('Password is required for new users', 'error');
        return;
    }
    
    if (password) {
        userData.password = password;
    }
    
    showLoading();
    try {
        if (userId) {
            await api.users.update(userId, userData);
            showToast('User updated successfully', 'success');
        } else {
            await api.users.create(userData);
            showToast('User created successfully', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        loadUsers();
    } catch (error) {
        showToast('Error saving user: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Edit User
function editUser(userId) {
    openUserModal(userId);
}

// Toggle User Status
async function toggleUserStatus(userId) {
    if (!confirm('Are you sure you want to toggle this user\'s status?')) return;
    
    showLoading();
    try {
        await api.users.toggleStatus(userId);
        showToast('User status updated successfully', 'success');
        loadUsers();
    } catch (error) {
        showToast('Error updating user status: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Delete User
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    showLoading();
    try {
        await api.users.delete(userId);
        showToast('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showToast('Error deleting user: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Shops Management Page
async function loadShops() {
    showLoading();
    try {
        const response = await api.shops.getAll();
        const shops = response.data;
        
        const content = `
            <div class="page-header">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h2><i class="fas fa-store"></i> Shops Management</h2>
                    <button class="btn btn-primary" onclick="openShopModal()">
                        <i class="fas fa-plus"></i> Add Shop
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="shopsTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Owner</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Subscription</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${shops.length === 0 ? '<tr><td colspan="7" class="text-center">No shops found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = content;
        renderShopsTable(shops);
    } catch (error) {
        showToast('Error loading shops: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Render Shops Table
function renderShopsTable(shops) {
    const tbody = document.querySelector('#shopsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = shops.map(shop => `
        <tr>
            <td>${shop.name}</td>
            <td>${shop.owner_name || '-'}</td>
            <td>${shop.phone || '-'}</td>
            <td>${shop.address || '-'}</td>
            <td>
                <span class="badge ${getSubscriptionStatusBadge(shop.subscription_status)}">
                    ${shop.subscription_status || 'No Subscription'}
                </span>
                ${shop.subscription_end_date ? `<br><small>Exp: ${formatDate(shop.subscription_end_date)}</small>` : ''}
            </td>
            <td><span class="badge ${shop.is_active ? 'bg-success' : 'bg-secondary'}">${shop.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editShop(${shop.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="toggleShopStatus(${shop.id})" title="Toggle Status">
                    <i class="fas fa-power-off"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="openSubscriptionModal(${shop.id})" title="Subscription">
                    <i class="fas fa-credit-card"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteShop(${shop.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Get Subscription Status Badge Class
function getSubscriptionStatusBadge(status) {
    switch(status) {
        case 'active': return 'bg-success';
        case 'expired': return 'bg-danger';
        case 'expiring_soon': return 'bg-warning';
        case 'cancelled': return 'bg-secondary';
        default: return 'bg-secondary';
    }
}

// Open Shop Modal (Add/Edit)
async function openShopModal(shopId = null) {
    const modal = document.getElementById('shopModal');
    const modalTitle = modal.querySelector('.modal-title');
    const form = document.getElementById('shopForm');
    
    if (shopId) {
        // Edit mode - load shop data
        modalTitle.textContent = 'Edit Shop';
        const response = await api.shops.getById(shopId);
        const shop = response.data;
        
        document.getElementById('shopId').value = shop.id;
        document.getElementById('shopName').value = shop.name;
        document.getElementById('shopOwner').value = shop.owner_name || '';
        document.getElementById('shopPhone').value = shop.phone || '';
        document.getElementById('shopEmail').value = shop.email || '';
        document.getElementById('shopAddress').value = shop.address || '';
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Shop';
        form.reset();
        document.getElementById('shopId').value = '';
    }
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Save Shop
async function saveShop() {
    
    const shopId = document.getElementById('shopId').value;
    const shopData = {
        name: document.getElementById('shopName').value,
        owner_name: document.getElementById('shopOwner').value,
        phone: document.getElementById('shopPhone').value,
        email: document.getElementById('shopEmail').value,
        address: document.getElementById('shopAddress').value
    };
    
    showLoading();
    try {
        if (shopId) {
            await api.shops.update(shopId, shopData);
            showToast('Shop updated successfully', 'success');
        } else {
            await api.shops.create(shopData);
            showToast('Shop created successfully', 'success');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('shopModal')).hide();
        loadShops();
    } catch (error) {
        showToast('Error saving shop: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Edit Shop
function editShop(shopId) {
    openShopModal(shopId);
}

// Toggle Shop Status
async function toggleShopStatus(shopId) {
    if (!confirm('Are you sure you want to toggle this shop\'s status?')) return;
    
    showLoading();
    try {
        await api.shops.toggleStatus(shopId);
        showToast('Shop status updated successfully', 'success');
        loadShops();
    } catch (error) {
        showToast('Error updating shop status: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Delete Shop
async function deleteShop(shopId) {
    if (!confirm('Are you sure you want to delete this shop? This will also delete all associated data. This action cannot be undone.')) return;
    
    showLoading();
    try {
        await api.shops.delete(shopId);
        showToast('Shop deleted successfully', 'success');
        loadShops();
    } catch (error) {
        showToast('Error deleting shop: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Load Subscriptions Management Page
async function loadSubscriptions() {
    showLoading();
    try {
        const response = await api.subscriptions.getAll();
        const subscriptions = response.data;
        
        const content = `
            <div class="page-header">
                <h2><i class="fas fa-credit-card"></i> Subscriptions Management</h2>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Active</h5>
                            <h3>${subscriptions.filter(s => s.status === 'active').length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h5 class="card-title">Expiring Soon</h5>
                            <h3>${subscriptions.filter(s => s.status === 'expiring_soon').length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h5 class="card-title">Expired</h5>
                            <h3>${subscriptions.filter(s => s.status === 'expired').length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total</h5>
                            <h3>${subscriptions.length}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="subscriptionsTable">
                            <thead>
                                <tr>
                                    <th>Shop</th>
                                    <th>Plan</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subscriptions.length === 0 ? '<tr><td colspan="7" class="text-center">No subscriptions found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = content;
        renderSubscriptionsTable(subscriptions);
    } catch (error) {
        showToast('Error loading subscriptions: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Render Subscriptions Table
function renderSubscriptionsTable(subscriptions) {
    const tbody = document.querySelector('#subscriptionsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = subscriptions.map(sub => `
        <tr>
            <td>${sub.shop_name}</td>
            <td>${sub.plan_type || 'Standard'}</td>
            <td>${formatDate(sub.start_date)}</td>
            <td>${formatDate(sub.end_date)}</td>
            <td>${formatCurrency(sub.amount)}</td>
            <td><span class="badge ${getSubscriptionStatusBadge(sub.status)}">${sub.status}</span></td>
            <td>
                ${sub.status !== 'cancelled' ? `
                <button class="btn btn-sm btn-success" onclick="renewSubscription(${sub.id})" title="Renew">
                    <i class="fas fa-sync"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="cancelSubscription(${sub.id})" title="Cancel">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Open Subscription Modal
async function openSubscriptionModal(shopId) {
    const modal = document.getElementById('subscriptionModal');
    const form = document.getElementById('subscriptionForm');
    
    // Get shop info
    const shopResponse = await api.shops.getById(shopId);
    const shop = shopResponse.data;
    
    document.getElementById('subscriptionShopId').value = shopId;
    document.getElementById('subscriptionShopName').value = shop.name;
    document.getElementById('subscriptionPlan').value = 'monthly';
    document.getElementById('subscriptionAmount').value = '1000';
    document.getElementById('subscriptionStartDate').value = new Date().toISOString().split('T')[0];
    
    // Calculate end date based on plan
    updateSubscriptionEndDate();
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Update Subscription End Date based on plan
function updateSubscriptionEndDate() {
    const plan = document.getElementById('subscriptionPlan').value;
    const startDate = new Date();
    let endDate = new Date();
    
    switch(plan) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'quarterly':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
    }
    
    document.getElementById('subscriptionEndDate').value = endDate.toISOString().split('T')[0];
}

// Update subscription amount based on plan
function updateSubscriptionAmount() {
    const plan = document.getElementById('subscriptionPlan').value;
    const amounts = {
        'monthly': 1000,
        'quarterly': 2700,
        'yearly': 10000
    };
    document.getElementById('subscriptionAmount').value = amounts[plan] || 1000;
    updateSubscriptionEndDate();
}

// Save Subscription
async function saveSubscription() {
    
    const subscriptionData = {
        shop_id: document.getElementById('subscriptionShopId').value,
        plan_type: document.getElementById('subscriptionPlan').value,
        start_date: new Date().toISOString().split('T')[0],
        end_date: document.getElementById('subscriptionEndDate').value,
        amount: parseFloat(document.getElementById('subscriptionAmount').value),
        payment_method: 'cash'
    };
    
    showLoading();
    try {
        await api.subscriptions.create(subscriptionData);
        showToast('Subscription created successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('subscriptionModal')).hide();
        loadSubscriptions();
        loadShops();
    } catch (error) {
        showToast('Error creating subscription: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Renew Subscription
async function renewSubscription(subscriptionId) {
    const modal = document.getElementById('renewSubscriptionModal');
    document.getElementById('renewSubscriptionId').value = subscriptionId;
    
    // Set default plan and amount
    document.getElementById('renewPlan').value = 'monthly';
    document.getElementById('renewAmount').value = '1000';
    
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// Confirm Renew Subscription
async function confirmRenewSubscription() {
    const subscriptionId = document.getElementById('renewSubscriptionId').value;
    const plan = document.getElementById('renewPlan').value;
    const amount = document.getElementById('renewAmount').value;
    
    const defaultAmounts = {
        'monthly': 1000,
        'quarterly': 2700,
        'yearly': 10000
    };
    
    const finalAmount = amount || defaultAmounts[plan];
    
    showLoading();
    try {
        await api.subscriptions.renew({
            subscription_id: subscriptionId,
            plan_type: plan,
            amount: finalAmount
        });
        showToast('Subscription renewed successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('renewSubscriptionModal')).hide();
        loadSubscriptions();
        loadShops();
    } catch (error) {
        showToast('Error renewing subscription: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Cancel Subscription
async function cancelSubscription(subscriptionId) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    showLoading();
    try {
        await api.subscriptions.cancel(subscriptionId);
        showToast('Subscription cancelled successfully', 'success');
        loadSubscriptions();
        loadShops();
    } catch (error) {
        showToast('Error cancelling subscription: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}
