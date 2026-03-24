# Troubleshooting Guide - Mobile Shop Management System

This guide explains common issues, their causes, and solutions for the Mobile Shop Management System.

---

## Table of Contents

1. [JavaScript Errors](#javascript-errors)
2. [CORS Issues](#cors-issues)
3. [API Connection Issues](#api-connection-issues)
4. [Authentication Issues](#authentication-issues)
5. [Database Issues](#database-issues)
6. [Best Practices](#best-practices)

---

## JavaScript Errors

### 1. Duplicate Variable Declaration

**Error:**
```
Uncaught SyntaxError: Identifier 'allProducts' has already been declared
```

**Cause:**
The variable `allProducts` was declared in multiple JavaScript files ([`inventory.js`](mobile-shop-saas/frontend/js/inventory.js:3) and [`billing.js`](mobile-shop-saas/frontend/js/billing.js:4)), causing a naming conflict when both files are loaded.

**Solution:**
Renamed the variable in [`inventory.js`](mobile-shop-saas/frontend/js/inventory.js:3) from `allProducts` to `inventoryProducts` to avoid conflicts.

**Best Practice:**
- Use unique variable names for different modules
- Prefix variables with module names (e.g., `inventoryProducts`, `billingProducts`)
- Consider using a namespace or module pattern to avoid global scope pollution

---

### 2. Null Reference Error

**Error:**
```
TypeError: Cannot read properties of null (reading 'value')
```

**Cause:**
Code attempts to access `.value` property of a DOM element that doesn't exist in the current page context. This happens when:
- The element hasn't been rendered yet
- The element ID is misspelled
- The element is conditionally rendered

**Example Problem Code:**
```javascript
// This will fail if the element doesn't exist
const value = document.getElementById('someElement').value;
```

**Solution:**
Created utility functions in [`utils.js`](mobile-shop-saas/frontend/js/utils.js) for safe DOM access:

```javascript
// Safe way to get element value
function safeGetValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

// Usage
const value = safeGetValue('someElement'); // Returns '' if element doesn't exist
```

**Available Utility Functions:**
- `safeGetValue(elementId)` - Get element value safely
- `safeSetValue(elementId, value)` - Set element value safely
- `safeGetElement(elementId)` - Get element reference safely
- `safeGetNumber(elementId)` - Get number value safely
- `safeGetInt(elementId)` - Get integer value safely
- `safeGetChecked(elementId)` - Get checkbox state safely
- `safeSetText(elementId, text)` - Set text content safely
- `safeSetHTML(elementId, html)` - Set HTML content safely
- `safeShow(elementId)` - Show element safely
- `safeHide(elementId)` - Hide element safely
- `safeFocus(elementId)` - Focus element safely
- `safeDisable(elementId)` - Disable element safely
- `safeEnable(elementId)` - Enable element safely

**Best Practice:**
- Always check if DOM elements exist before accessing their properties
- Use the provided utility functions for all DOM access
- Add defensive programming practices throughout your code

---

## CORS Issues

### 3. CORS Policy Violation

**Error:**
```
CORS error: Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:5500' 
that is not equal to the supplied origin 'null'
```

**Cause:**
The backend CORS configuration only allowed requests from `http://localhost:5500`, but the frontend was being accessed from a different origin (e.g., `file://`, `null`, or a different port).

**Original Problematic Configuration:**
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));
```

**Solution:**
Updated [`server.js`](mobile-shop-saas/backend/server.js:19) with a flexible CORS configuration:

```javascript
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'file://', // For local file access
    'null' // For some browser scenarios
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or file://)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('CORS policy violation'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Best Practice:**
- Define an array of allowed origins
- Use a dynamic origin function for flexibility
- Allow requests with no origin for development and testing
- Specify allowed methods and headers explicitly
- In production, restrict to specific domains only

---

## API Connection Issues

### 4. Failed to Fetch

**Error:**
```
POST http://localhost:3000/api/auth/login net::ERR_FAILED
TypeError: Failed to fetch
```

**Cause:**
Multiple possible causes:
1. Backend server is not running
2. Wrong port number
3. Network connectivity issues
4. CORS blocking the request
5. Firewall blocking the connection

**Solutions:**

**1. Check if backend is running:**
```bash
# Check if the server is running on port 3000
netstat -an | grep 3000  # Linux/Mac
netstat -an | findstr 3000  # Windows

# Or test with curl
curl http://localhost:3000/health
```

**2. Verify backend configuration:**
```bash
# Check .env file
cd mobile-shop-saas/backend
cat .env

# Ensure PORT is set correctly
PORT=3000
```

**3. Start the backend server:**
```bash
cd mobile-shop-saas/backend
npm install
npm start
```

**4. Check API base URL in frontend:**
Verify the API base URL in [`api.js`](mobile-shop-saas/frontend/js/api.js) matches your backend URL:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Best Practice:**
- Always test API endpoints with curl or Postman first
- Use environment variables for API URLs
- Implement proper error handling in API calls
- Add health check endpoints for monitoring
- Use logging to track API requests and responses

---

## Authentication Issues

### 5. Login Form Null Reference Error

**Error:**
```
TypeError: Cannot read properties of null (reading 'value')
```

**Cause:**
Code attempts to access `.value` property of email/password input elements that don't exist when the login form hasn't loaded yet.

**Original Problematic Code:**
```javascript
// This will fail if elements don't exist
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // ...
});
```

**Solution:**
Updated [`auth.js`](mobile-shop-saas/frontend/js/auth.js:4) with proper DOM ready checking and null safety:

```javascript
// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Safely get form elements
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
            
            // ... rest of login logic
        });
    }
});
```

**Best Practice:**
- Always wrap DOM event listeners in `DOMContentLoaded` event
- Check if elements exist before accessing their properties
- Validate form inputs before submission
- Trim whitespace from input values

---

### 6. 401 Unauthorized Error

**Error:**
```
POST http://localhost:3000/api/auth/login 401 (Unauthorized)
```

**Cause:**
Backend rejects login request due to:
1. Invalid email or password
2. User account is inactive
3. User subscription has expired
4. Database connection issues

**Solution:**
Updated [`auth.js`](mobile-shop-saas/frontend/js/auth.js:55) with comprehensive error handling:

```javascript
try {
    const response = await api.auth.login(email, password);
    
    if (response && response.success) {
        // Success handling
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
}
```

**Troubleshooting Steps:**

1. **Verify Default Credentials:**
   - Email: `admin@mobileshop.com`
   - Password: `admin123`

2. **Check Database:**
   ```bash
   mysql -u mobileshop -p mobile_shop_saas
   SELECT id, email, is_active FROM users WHERE email = 'admin@mobileshop.com';
   ```

3. **Verify Password Hash:**
   The database schema now includes a valid bcrypt hash for the default password. If you're still getting 401 errors, verify the password hash in the database:
   ```sql
   SELECT email, password FROM users WHERE email = 'admin@mobileshop.com';
   ```
   The password hash should be: `$2a$10$VCnLDFATMvniHCipwdP7LeG52.WpRhNaC4uVqHpa/P8TlKGFmJop2`

4. **Update Password Hash if Needed:**
   If the password hash is incorrect, you can update it:
   ```sql
   UPDATE users
   SET password = '$2a$10$VCnLDFATMvniHCipwdP7LeG52.WpRhNaC4uVqHpa/P8TlKGFmJop2'
   WHERE email = 'admin@mobileshop.com';
   ```

5. **Verify User is Active:**
   ```sql
   UPDATE users SET is_active = 1 WHERE email = 'admin@mobileshop.com';
   ```

6. **Check Subscription Status:**
   ```sql
   SELECT s.*, u.email
   FROM subscriptions s
   JOIN users u ON s.shop_id = u.shop_id
   WHERE u.email = 'admin@mobileshop.com';
   ```

7. **Test API Directly:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mobileshop.com","password":"admin123"}'
   ```

8. **Regenerate Password Hash:**
   If you need to create a new password hash, use the provided script:
   ```bash
   cd mobile-shop-saas/backend
   node generate-hash.js
   ```
   This will generate a new bcrypt hash that you can use in the database.

**Best Practice:**
- Provide clear, user-friendly error messages
- Log errors for debugging
- Implement proper error handling for different HTTP status codes
- Validate credentials before API call
- Test API endpoints independently

---

### 7. API Error: Invalid Email or Password

**Error:**
```
API Error: Invalid email or password
```

**Cause:**
The fetch call throws an error when credentials are wrong, and the error handling doesn't properly distinguish between different error types.

**Solution:**
The updated error handling in [`auth.js`](mobile-shop-saas/frontend/js/auth.js:55) now properly handles:
- Network errors
- 401 Unauthorized (invalid credentials)
- 403 Forbidden (inactive account/expired subscription)
- 500 Internal Server Error
- Other unexpected errors

**Additional Improvements:**

1. **Input Validation:**
   ```javascript
   const email = emailInput.value.trim();
   const password = passwordInput.value;
   
   if (!email || !password) {
       errorDiv.textContent = 'Please enter both email and password.';
       errorDiv.classList.remove('d-none');
       return;
   }
   ```

2. **Email Format Validation:**
   ```javascript
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
       errorDiv.textContent = 'Please enter a valid email address.';
       errorDiv.classList.remove('d-none');
       return;
   }
   ```

3. **Password Strength Validation:**
   ```javascript
   if (password.length < 6) {
       errorDiv.textContent = 'Password must be at least 6 characters.';
       errorDiv.classList.remove('d-none');
       return;
   }
   ```

**Best Practice:**
- Validate inputs on the client side before sending to server
- Provide specific error messages for different failure scenarios
- Don't reveal whether email or password is incorrect (security best practice)
- Implement rate limiting to prevent brute force attacks
- Log failed login attempts for security monitoring

---

## CDN Loading Issues

### 8. jsPDF CDN Connection Timeout

**Error:**
```
GET https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js net::ERR_CONNECTION_TIMED_OUT
```

**Cause:**
The CDN (Content Delivery Network) is unreachable due to:
1. Network connectivity issues
2. DNS resolution problems
3. Firewall blocking the CDN
4. CDN service outage
5. Corporate proxy blocking external resources

**Solutions:**

**1. Check Internet Connection:**
```bash
# Test connectivity to CDN
ping cdnjs.cloudflare.com

# Test with curl
curl -I https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
```

**2. Use Alternative CDNs:**
The [`index.html`](mobile-shop-saas/frontend/index.html:262) now includes automatic fallback to jsDelivr:

```html
<!-- Primary CDN -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- Fallback CDN -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
```

**3. Download and Host Locally:**
For production, it's recommended to host libraries locally:

```bash
# Download jsPDF
cd mobile-shop-saas/frontend
mkdir -p libs
cd libs
curl -o jspdf.umd.min.js https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js

# Update index.html to use local file
# <script src="libs/jspdf.umd.min.js"></script>
```

**4. Check Firewall/Proxy Settings:**
- Ensure port 443 (HTTPS) is not blocked
- Check corporate proxy settings
- Disable VPN temporarily to test
- Check antivirus/firewall settings

**5. Clear Browser Cache:**
```
Chrome: Ctrl+Shift+Delete → Clear cached images and files
Firefox: Ctrl+Shift+Delete → Cache
Edge: Ctrl+Shift+Delete → Cached data and files
```

**6. Try Different Browser:**
Sometimes browser-specific issues can cause CDN loading problems. Try:
- Chrome/Edge (Chromium-based)
- Firefox
- Safari

**7. Use Browser DevTools to Debug:**
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for jsPDF request
5. Check status code and response headers
6. Check Console for error messages

**Code Implementation:**

The [`index.html`](mobile-shop-saas/frontend/index.html:262) now includes dynamic script loading with fallback:

```javascript
<script>
    // Try to load jsPDF from primary CDN
    var jsPDFScript = document.createElement('script');
    jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jsPDFScript.onerror = function() {
        console.warn('Failed to load jsPDF from Cloudflare CDN, trying jsDelivr...');
        // Fallback to jsDelivr CDN
        var fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        fallbackScript.onerror = function() {
            console.error('Failed to load jsPDF from all CDNs. PDF download will not work.');
            // Show warning to user
            document.addEventListener('DOMContentLoaded', function() {
                var warning = document.createElement('div');
                warning.className = 'alert alert-warning m-3';
                warning.innerHTML = '<strong>Warning:</strong> jsPDF library failed to load. PDF download feature may not work. Please check your internet connection.';
                document.body.insertBefore(warning, document.body.firstChild);
            });
        };
        document.head.appendChild(fallbackScript);
    };
    document.head.appendChild(jsPDFScript);
</script>
```

**Safe Usage in Code:**

The [`billing.js`](mobile-shop-saas/frontend/js/billing.js:416) now checks if jsPDF is loaded before using it:

```javascript
function downloadBillPDF() {
    if (!currentSale) return;
    
    // Check if jsPDF is loaded
    if (!window.jspdf || !window.jspdf.jsPDF) {
        showToast('jsPDF library not loaded. Please check your internet connection and refresh the page.', 'error');
        console.error('jsPDF library not available');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    // ... rest of PDF generation code
}
```

**Best Practice:**
- Always use multiple CDN sources for critical libraries
- Implement graceful degradation when libraries fail to load
- Host critical libraries locally in production
- Provide user-friendly error messages
- Log CDN loading failures for monitoring
- Test CDN accessibility before deployment

---

## Database Issues

### 9. Database Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Cause:**
MySQL server is not running or connection details are incorrect.

**Solutions:**

**1. Check if MySQL is running:**
```bash
# Linux/Mac
sudo systemctl status mysql

# Windows
# Check Services app for MySQL service
```

**2. Start MySQL if not running:**
```bash
# Linux/Mac
sudo systemctl start mysql

# Windows
# Start MySQL service from Services app
```

**3. Verify database credentials in .env:**
```bash
DB_HOST=localhost
DB_USER=mobileshop
DB_PASSWORD=YourStrongPassword123!
DB_NAME=mobile_shop_saas
DB_PORT=3306
```

**4. Test database connection:**
```bash
mysql -u mobileshop -p mobile_shop_saas
```

**5. Import database schema if needed:**
```bash
mysql -u mobileshop -p mobile_shop_saas < database/schema.sql
```

**Best Practice:**
- Use connection pooling for better performance
- Implement connection retry logic
- Log database connection errors
- Use environment variables for credentials
- Never commit .env files to version control

---

## Best Practices

### 1. Variable Naming

**Do:**
```javascript
// Module-specific prefixes
let inventoryProducts = [];
let billingProducts = [];
let cartItems = [];

// Descriptive names
let userAuthenticationToken = '';
let productStockQuantity = 0;
```

**Don't:**
```javascript
// Generic names that can conflict
let products = [];
let items = [];
let data = [];
```

### 2. DOM Access

**Do:**
```javascript
// Always check if element exists
const element = document.getElementById('myElement');
if (element) {
    const value = element.value;
}

// Or use utility functions
const value = safeGetValue('myElement');
```

**Don't:**
```javascript
// Direct access without checking
const value = document.getElementById('myElement').value;
```

### 3. Error Handling

**Do:**
```javascript
try {
    const response = await api.getData();
    // Process response
} catch (error) {
    console.error('Error fetching data:', error);
    showToast('Failed to load data', 'error');
}
```

**Don't:**
```javascript
// No error handling
const response = await api.getData();
processData(response.data);
```

### 4. API Configuration

**Do:**
```javascript
// Use environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Configure CORS properly
app.use(cors({
    origin: function(origin, callback) {
        // Dynamic origin checking
    },
    credentials: true
}));
```

**Don't:**
```javascript
// Hardcoded values
const API_BASE_URL = 'http://localhost:3000/api';

// Overly permissive CORS
app.use(cors());
```

### 5. Code Organization

**Do:**
```javascript
// Separate concerns into different files
// utils.js - Utility functions
// api.js - API calls
// auth.js - Authentication logic
// dashboard.js - Dashboard functionality
```

**Don't:**
```javascript
// Everything in one file
// app.js with 2000+ lines
```

---

## Debugging Tips

### 1. Use Browser Developer Tools

**Console:**
- Check for JavaScript errors
- Use `console.log()` for debugging
- Use `console.error()` for errors

**Network Tab:**
- Monitor API requests
- Check request/response headers
- Verify CORS headers

**Elements Tab:**
- Inspect DOM structure
- Check element IDs
- Verify CSS styles

### 2. Use Server Logs

**Backend Logs:**
```bash
# Check PM2 logs
pm2 logs mobile-shop-api

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check application logs
tail -f /var/log/mobile-shop-saas/error.log
```

### 3. Test APIs Independently

**Using curl:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mobileshop.com","password":"admin123"}'
```

**Using Postman:**
- Create collections for API endpoints
- Save authentication tokens
- Test different scenarios

---

## Common Solutions Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Duplicate variable | Same variable name in multiple files | Use unique, descriptive names |
| Null reference | Accessing non-existent DOM element | Use safe utility functions |
| CORS error | Origin not allowed in backend | Configure allowed origins |
| Failed to fetch | Backend not running or wrong URL | Start backend, verify URL |
| Login null reference | Form elements not loaded when script runs | Wrap in DOMContentLoaded event |
| 401 Unauthorized | Invalid credentials or inactive account | Verify credentials, check user status |
| Invalid email/password error | Wrong credentials or poor error handling | Implement proper error handling |
| Database connection | MySQL not running or wrong credentials | Start MySQL, check .env |
| jsPDF CDN timeout | Network connectivity or CDN issues | Use fallback CDNs or host locally |

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Check the server logs for backend errors
3. Verify all configuration files are correct
4. Test API endpoints independently
5. Review the [Deployment Guide](DEPLOYMENT.md) for setup instructions

---

## Additional Resources

- [MDN Web Docs - JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [MDN Web Docs - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
