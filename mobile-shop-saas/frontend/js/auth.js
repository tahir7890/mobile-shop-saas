// Authentication Functions

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Safely get form values
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const errorDiv = document.getElementById('loginError');
            
            // Validate inputs exist
            if (!emailInput || !passwordInput) {
                console.error('Login form inputs not found');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Validate email and password
            if (!email || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please enter both email and password.';
                    errorDiv.classList.remove('d-none');
                }
                return;
            }
            
            try {
                showLoading();
                
                const response = await api.auth.login(email, password);
                
                if (response && response.success) {
                    // Store token and user data
                    api.setToken(response.data.token);
                    api.setCurrentUser(response.data.user);
                    
                    // Hide login page and show main app
                    const loginPage = document.getElementById('loginPage');
                    const mainApp = document.getElementById('mainApp');
                    if (loginPage) loginPage.classList.add('d-none');
                    if (mainApp) mainApp.classList.remove('d-none');
                    
                    // Initialize app
                    initializeApp();
                    
                    showToast('Login successful!', 'success');
                    
                    // Clear error message
                    if (errorDiv) {
                        errorDiv.classList.add('d-none');
                    }
                } else {
                    throw new Error(response?.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorDiv) {
                    // Handle different error types
                    let errorMessage = 'Login failed. Please try again.';
                    
                    if (error.response) {
                        // Server responded with error status
                        if (error.response.status === 401) {
                            errorMessage = 'Invalid email or password.';
                        } else if (error.response.status === 403) {
                            errorMessage = 'Account is inactive or subscription expired.';
                        } else if (error.response.data && error.response.data.message) {
                            errorMessage = error.response.data.message;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    errorDiv.textContent = errorMessage;
                    errorDiv.classList.remove('d-none');
                }
            } finally {
                hideLoading();
            }
        });
    }
});

// Logout function
function logout() {
    api.removeToken();
    api.removeCurrentUser();
    
    // Show login page and hide main app
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginPage) loginPage.classList.remove('d-none');
    if (mainApp) mainApp.classList.add('d-none');
    
    // Reset login form
    if (loginForm) loginForm.reset();
    if (loginError) loginError.classList.add('d-none');
    
    showToast('Logged out successfully', 'info');
}

// Check if user is logged in on page load
function checkAuth() {
    const token = api.getToken();
    const user = api.getCurrentUser();
    
    if (token && user) {
        const loginPage = document.getElementById('loginPage');
        const mainApp = document.getElementById('mainApp');
        
        if (loginPage) loginPage.classList.add('d-none');
        if (mainApp) mainApp.classList.remove('d-none');
        
        initializeApp();
    }
}

// Initialize app after login
function initializeApp() {
    const user = api.getCurrentUser();
    
    if (!user) {
        console.error('No user data found');
        logout();
        return;
    }
    
    // Set user name in navbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.full_name || user.name || 'User';
    }
    
    // Build navigation based on role
    buildNavigation(user.role);
    
    // Load dashboard by default
    if (user.role === 'super_admin') {
        loadAdminDashboard();
    } else {
        loadShopDashboard();
    }
}

// Build navigation based on user role
function buildNavigation(role) {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) {
        console.error('Navigation element not found');
        return;
    }
    
    navLinks.innerHTML = '';
    
    const links = [];
    
    if (role === 'super_admin') {
        links.push(
            { name: 'Dashboard', icon: 'bi-speedometer2', action: 'loadAdminDashboard()' },
            { name: 'Users', icon: 'bi-people', action: 'loadUsers()' },
            { name: 'Shops', icon: 'bi-shop', action: 'loadShops()' },
            { name: 'Inventory', icon: 'bi-box-seam', action: 'loadInventory()' },
            { name: 'Subscriptions', icon: 'bi-calendar-check', action: 'loadSubscriptions()' },
            { name: 'Reports', icon: 'bi-graph-up', action: 'loadReports()' }
        );
    } else {
        links.push(
            { name: 'Dashboard', icon: 'bi-speedometer2', action: 'loadShopDashboard()' },
            { name: 'Billing', icon: 'bi-receipt', action: 'loadBilling()' },
            { name: 'Inventory', icon: 'bi-box-seam', action: 'loadInventory()' },
            { name: 'Reports', icon: 'bi-graph-up', action: 'loadShopReports()' }
        );
    }
    
    links.forEach(link => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `
            <a class="nav-link" href="#" onclick="${link.action}; return false;">
                <i class="bi ${link.icon}"></i> ${link.name}
            </a>
        `;
        navLinks.appendChild(li);
    });
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('d-none');
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('d-none');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set toast color based on type
    toast.className = 'toast';
    if (type === 'success') {
        toast.classList.add('text-bg-success');
    } else if (type === 'error') {
        toast.classList.add('text-bg-danger');
    } else if (type === 'warning') {
        toast.classList.add('text-bg-warning');
    } else {
        toast.classList.add('text-bg-info');
    }
    
    toastTitle.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    toastMessage.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date only (no time)
function formatDateOnly(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', checkAuth);
