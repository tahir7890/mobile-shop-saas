// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Get stored token
function getToken() {
    return localStorage.getItem('token');
}

// Set token
function setToken(token) {
    localStorage.setItem('token', token);
}

// Remove token
function removeToken() {
    localStorage.removeItem('token');
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Remove current user
function removeCurrentUser() {
    localStorage.removeItem('currentUser');
}

// Generic API request function
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                // Clear all auth data
                removeToken();
                removeCurrentUser();
                // Reload page to show login screen
                window.location.reload();
                throw new Error('Session expired. Please login again.');
            }
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const authAPI = {
    login: (email, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    getCurrentUser: () => {
        return apiRequest('/auth/me');
    },
    
    logout: () => {
        return apiRequest('/auth/logout', { method: 'POST' });
    }
};

// User API
const userAPI = {
    getAll: () => apiRequest('/users'),
    
    getById: (id) => apiRequest(`/users/${id}`),
    
    create: (userData) => {
        return apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    update: (id, userData) => {
        return apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },
    
    delete: (id) => {
        return apiRequest(`/users/${id}`, { method: 'DELETE' });
    },
    
    changePassword: (id, newPassword) => {
        return apiRequest(`/users/${id}/change-password`, {
            method: 'POST',
            body: JSON.stringify({ new_password: newPassword })
        });
    },
    
    toggleStatus: (id) => {
        return apiRequest(`/users/${id}/toggle-status`, { method: 'PATCH' });
    }
};

// Shop API
const shopAPI = {
    getAll: () => apiRequest('/shops'),
    
    getById: (id) => apiRequest(`/shops/${id}`),
    
    create: (shopData) => {
        return apiRequest('/shops', {
            method: 'POST',
            body: JSON.stringify(shopData)
        });
    },
    
    update: (id, shopData) => {
        return apiRequest(`/shops/${id}`, {
            method: 'PUT',
            body: JSON.stringify(shopData)
        });
    },
    
    delete: (id) => {
        return apiRequest(`/shops/${id}`, { method: 'DELETE' });
    },
    
    toggleStatus: (id) => {
        return apiRequest(`/shops/${id}/toggle-status`, { method: 'PATCH' });
    }
};

// Product API
const productAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/products${queryString ? `?${queryString}` : ''}`);
    },
    
    getById: (id) => apiRequest(`/products/${id}`),
    
    create: (productData) => {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    },
    
    update: (id, productData) => {
        return apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    },
    
    delete: (id) => {
        return apiRequest(`/products/${id}`, { method: 'DELETE' });
    },
    
    getLowStock: () => apiRequest('/products/low-stock'),
    
    getCategories: () => apiRequest('/products/categories')
};

// Sales API
const salesAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/sales${queryString ? `?${queryString}` : ''}`);
    },
    
    getById: (id) => apiRequest(`/sales/${id}`),
    
    create: (saleData) => {
        return apiRequest('/sales', {
            method: 'POST',
            body: JSON.stringify(saleData)
        });
    },
    
    delete: (id) => {
        return apiRequest(`/sales/${id}`, { method: 'DELETE' });
    },
    
    getToday: () => apiRequest('/sales/today'),
    
    getRecent: () => apiRequest('/sales/recent')
};

// Subscription API
const subscriptionAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/subscriptions${queryString ? `?${queryString}` : ''}`);
    },
    
    getByShopId: (shopId) => apiRequest(`/subscriptions/shop/${shopId}`),
    
    create: (subData) => {
        return apiRequest('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subData)
        });
    },
    
    renew: (subData) => {
        return apiRequest('/subscriptions/renew', {
            method: 'POST',
            body: JSON.stringify(subData)
        });
    },
    
    cancel: (id) => {
        return apiRequest(`/subscriptions/${id}`, { method: 'DELETE' });
    },
    
    getExpiring: (days = 7) => apiRequest(`/subscriptions/expiring?days=${days}`)
};

// Dashboard API
const dashboardAPI = {
    get: () => apiRequest('/dashboard'),
    
    getAdmin: () => apiRequest('/dashboard/admin'),
    
    getShop: () => apiRequest('/dashboard/shop')
};

// Reports API
const reportsAPI = {
    getDaily: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/daily${queryString ? `?${queryString}` : ''}`);
    },
    
    getWeekly: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/weekly${queryString ? `?${queryString}` : ''}`);
    },
    
    getMonthly: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/monthly${queryString ? `?${queryString}` : ''}`);
    },
    
    getProducts: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/products${queryString ? `?${queryString}` : ''}`);
    },
    
    getPaymentMethods: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/payment-methods${queryString ? `?${queryString}` : ''}`);
    },
    
    getShopComparison: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/reports/shop-comparison${queryString ? `?${queryString}` : ''}`);
    }
};

// Export all APIs
window.api = {
    auth: authAPI,
    users: userAPI,
    shops: shopAPI,
    products: productAPI,
    sales: salesAPI,
    subscriptions: subscriptionAPI,
    dashboard: dashboardAPI,
    reports: reportsAPI,
    getToken,
    setToken,
    removeToken,
    getCurrentUser,
    setCurrentUser,
    removeCurrentUser
};
