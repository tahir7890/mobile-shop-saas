// Main Application Initialization

// Application State
const App = {
    currentUser: null,
    currentLanguage: 'en',
    initialized: false
};

// Language Translations
const translations = {
    en: {
        login: 'Login',
        email: 'Email',
        password: 'Password',
        dashboard: 'Dashboard',
        inventory: 'Inventory',
        billing: 'Billing',
        reports: 'Reports',
        users: 'Users',
        shops: 'Shops',
        subscriptions: 'Subscriptions',
        logout: 'Logout',
        welcome: 'Welcome',
        search: 'Search',
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        success: 'Success',
        error: 'Error',
        loading: 'Loading...',
        noData: 'No data found',
        total: 'Total',
        today: 'Today',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        sales: 'Sales',
        revenue: 'Revenue',
        products: 'Products',
        shops: 'Shops',
        users: 'Users',
        active: 'Active',
        inactive: 'Inactive',
        lowStock: 'Low Stock',
        expired: 'Expired',
        expiringSoon: 'Expiring Soon',
        print: 'Print',
        download: 'Download',
        bill: 'Bill',
        customer: 'Customer',
        phone: 'Phone',
        address: 'Address',
        quantity: 'Quantity',
        price: 'Price',
        total: 'Total',
        paymentMethod: 'Payment Method',
        cash: 'Cash',
        card: 'Card',
        credit: 'Credit',
        date: 'Date',
        time: 'Time',
        status: 'Status',
        actions: 'Actions',
        name: 'Name',
        role: 'Role',
        shop: 'Shop',
        owner: 'Owner',
        plan: 'Plan',
        startDate: 'Start Date',
        endDate: 'End Date',
        amount: 'Amount',
        renew: 'Renew',
        cancel: 'Cancel',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly'
    },
    ur: {
        login: 'لاگ ان کریں',
        email: 'ای میل',
        password: 'پاس ورڈ',
        dashboard: 'ڈیش بورڈ',
        inventory: 'انوینٹری',
        billing: 'بلنگ',
        reports: 'رپورٹس',
        users: 'صارفین',
        shops: 'دکانیں',
        subscriptions: 'سبسکرپشنز',
        logout: 'لاگ آؤٹ',
        welcome: 'خوش آمدید',
        search: 'تلاش کریں',
        add: 'شامل کریں',
        edit: 'ترمیم کریں',
        delete: 'حذف کریں',
        save: 'محفوظ کریں',
        cancel: 'منسوخ کریں',
        confirm: 'تصدیق کریں',
        success: 'کامیابی',
        error: 'خرابی',
        loading: 'لوڈ ہو رہا ہے...',
        noData: 'کوئی ڈیٹا نہیں ملا',
        total: 'کل',
        today: 'آج',
        thisWeek: 'اس ہفتے',
        thisMonth: 'اس مہینے',
        sales: 'فروخت',
        revenue: 'آمدنی',
        products: 'پروڈکٹس',
        shops: 'دکانیں',
        users: 'صارفین',
        active: 'فعال',
        inactive: 'غیر فعال',
        lowStock: 'کم اسٹاک',
        expired: 'میعاد ختم',
        expiringSoon: 'جلد ہی میعاد ختم ہو رہی ہے',
        print: 'پرنٹ',
        download: 'ڈاؤن لوڈ',
        bill: 'بل',
        customer: 'کسٹمر',
        phone: 'فون',
        address: 'پتہ',
        quantity: 'مقدار',
        price: 'قیمت',
        total: 'کل',
        paymentMethod: 'ادائیگی کا طریقہ',
        cash: 'نقد',
        card: 'کارڈ',
        credit: 'کریڈٹ',
        date: 'تاریخ',
        time: 'وقت',
        status: 'حیثیت',
        actions: 'اقدامات',
        name: 'نام',
        role: 'کردار',
        shop: 'دکان',
        owner: 'مالک',
        plan: 'پلان',
        startDate: 'شروع کی تاریخ',
        endDate: 'اختتام کی تاریخ',
        amount: 'رقم',
        renew: 'تجدید کریں',
        cancel: 'منسوخ کریں',
        monthly: 'ماہانہ',
        quarterly: 'سہ ماہی',
        yearly: 'سالانہ'
    }
};

// Get Translation
function t(key) {
    return translations[App.currentLanguage][key] || key;
}

// Set Language
function setLanguage(lang) {
    App.currentLanguage = lang;
    localStorage.setItem('language', lang);
    applyLanguage();
}

// Apply Language to UI
function applyLanguage() {
    const dir = App.currentLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = App.currentLanguage;
    
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
}

// Initialize Application
async function initApp() {
    if (App.initialized) return;
    
    // Load saved language
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        App.currentLanguage = savedLang;
    }
    
    // Apply language
    applyLanguage();
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Validate token with backend and get current user
            const response = await api.auth.getCurrentUser();
            if (response && response.success && response.data) {
                // Update stored user data with fresh data from backend
                api.setCurrentUser(response.data);
                App.currentUser = response.data;
                showMainApp();
            } else {
                // Invalid response, clear token and show login
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                showLogin();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            // Token invalid or expired, clear all auth data and show login
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            showLogin();
        }
    } else {
        showLogin();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    App.initialized = true;
}

// Setup Event Listeners
function setupEventListeners() {
    // Login form is handled by auth.js - no need to add listener here
    
    // User form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', saveUser);
    }
    
    // Shop form
    const shopForm = document.getElementById('shopForm');
    if (shopForm) {
        shopForm.addEventListener('submit', saveShop);
    }
    
    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', saveProduct);
    }
    
    // Subscription form
    const subscriptionForm = document.getElementById('subscriptionForm');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', saveSubscription);
    }
    
    // Subscription plan change
    const subscriptionPlan = document.getElementById('subscriptionPlan');
    if (subscriptionPlan) {
        subscriptionPlan.addEventListener('change', updateSubscriptionAmount);
    }
    
    // Renew plan change
    const renewPlan = document.getElementById('renewPlan');
    if (renewPlan) {
        renewPlan.addEventListener('change', updateRenewAmount);
    }
    
    // Language toggle
    const languageToggle = document.getElementById('languageToggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', toggleLanguage);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Toggle Language
function toggleLanguage() {
    const newLang = App.currentLanguage === 'en' ? 'ur' : 'en';
    setLanguage(newLang);
}

// Show Login Page
function showLogin() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('mainApp').classList.add('d-none');
}

// Show Main Application
function showMainApp() {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    
    // Set user name in navbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement && App.currentUser) {
        userNameElement.textContent = App.currentUser.full_name || App.currentUser.name || 'User';
    }
    
    // Build navigation
    buildNavigation(App.currentUser.role);
    
    // Load dashboard by default
    if (App.currentUser.role === 'super_admin') {
        loadAdminDashboard();
    } else {
        loadShopDashboard();
    }
}

// Handle Login - This function is now handled by auth.js
// Kept for reference but not used to avoid conflicts
// async function handleLogin(event) {
//     event.preventDefault();
//
//     const emailInput = document.getElementById('email');
//     const passwordInput = document.getElementById('password');
//
//     // Validate inputs exist
//     if (!emailInput || !passwordInput) {
//         console.error('Login form inputs not found');
//         return;
//     }
//
//     const email = emailInput.value;
//     const password = passwordInput.value;
//
//     // Validate email and password
//     if (!email || !password) {
//         showToast('Please enter both email and password', 'error');
//         return;
//     }
//
//     showLoading();
//     try {
//         const response = await api.auth.login(email, password);
//         localStorage.setItem('token', response.data.token);
//         App.currentUser = response.data.user;
//         showToast('Login successful', 'success');
//         showMainApp();
//     } catch (error) {
//         showToast('Login failed: ' + error.message, 'error');
//     } finally {
//         hideLoading();
//     }
// }

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        App.currentUser = null;
        showLogin();
        showToast('Logged out successfully', 'success');
    }
}

// Build Navigation - This function is now handled by auth.js
// Kept for reference but not used to avoid conflicts
// function buildNavigation() {
//     const navLinks = document.getElementById('navLinks');
//     if (!navLinks) return;
//
//     // Check if user is logged in
//     if (!App.currentUser || !App.currentUser.role) {
//         console.error('User not logged in or user data missing');
//         return;
//     }
//
//     let links = '';
//
//     // Common links
//     links += `
//         <li class="nav-item">
//             <a class="nav-link" href="#" onclick="loadDashboard(); return false;">
//                 <i class="fas fa-tachometer-alt"></i> ${t('dashboard')}
//             </a>
//         </li>
//         <li class="nav-item">
//             <a class="nav-link" href="#" onclick="loadInventory(); return false;">
//                 <i class="fas fa-boxes"></i> ${t('inventory')}
//             </a>
//         </li>
//         <li class="nav-item">
//             <a class="nav-link" href="#" onclick="loadBilling(); return false;">
//                 <i class="fas fa-cash-register"></i> ${t('billing')}
//             </a>
//         </li>
//         <li class="nav-item">
//             <a class="nav-link" href="#" onclick="loadReports(); return false;">
//                 <i class="fas fa-chart-bar"></i> ${t('reports')}
//             </a>
//         </li>
//     `;
//
//     // Admin only links
//     if (App.currentUser.role === 'super_admin') {
//         links += `
//             <li class="nav-item">
//                 <a class="nav-link" href="#" onclick="loadUsers(); return false;">
//                     <i class="fas fa-users"></i> ${t('users')}
//                 </a>
//             </li>
//             <li class="nav-item">
//                 <a class="nav-link" href="#" onclick="loadShops(); return false;">
//                     <i class="fas fa-store"></i> ${t('shops')}
//                 </a>
//             </li>
//             <li class="nav-item">
//                 <a class="nav-link" href="#" onclick="loadSubscriptions(); return false;">
//                     <i class="fas fa-credit-card"></i> ${t('subscriptions')}
//                 </a>
//             </li>
//         `;
//     }
//
//     navLinks.innerHTML = links;
// }

// Load Dashboard (wrapper)
function loadDashboard() {
    if (App.currentUser.role === 'super_admin') {
        loadAdminDashboard();
    } else {
        loadShopDashboard();
    }
}

// Update Renew Amount
function updateRenewAmount() {
    const plan = document.getElementById('renewPlan').value;
    const amounts = {
        'monthly': 1000,
        'quarterly': 2700,
        'yearly': 10000
    };
    document.getElementById('renewAmount').value = amounts[plan] || 1000;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);

// Handle page visibility change (for auto-refresh when tab becomes active)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && App.currentUser) {
        // Optionally refresh data when tab becomes active
        // This can be implemented per page as needed
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    showToast('You are back online', 'success');
});

window.addEventListener('offline', () => {
    showToast('You are offline. Some features may not work.', 'warning');
});

// Export App object for use in other modules
window.App = App;
