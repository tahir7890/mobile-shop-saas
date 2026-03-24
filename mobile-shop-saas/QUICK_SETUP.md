# Quick Setup Guide - Mobile Shop Management System

This guide will help you quickly set up and run the Mobile Shop Management System on your local machine.

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server (v5.7 or higher)
- A modern web browser (Chrome, Firefox, Edge)

## Step 1: Database Setup

### 1.1 Create Database and User

Open MySQL Command Line Client or MySQL Workbench and run:

```sql
CREATE DATABASE mobile_shop_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mobileshop'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON mobile_shop_saas.* TO 'mobileshop'@'localhost';
FLUSH PRIVILEGES;
```

### 1.2 Import Database Schema

```bash
# Navigate to the database directory
cd "c:/Users/E-TIME/Documents/javascript/mobile shop software/mobile-shop-saas/database"

# Import the schema (you'll be prompted for the password)
mysql -u mobileshop -p mobile_shop_saas < schema.sql
```

### 1.3 Verify Database Import

```bash
mysql -u mobileshop -p mobile_shop_saas -e "SHOW TABLES;"
```

You should see these tables:
- users
- shops
- products
- sales
- sale_items
- subscriptions
- settings

### 1.4 Verify Default Admin User

```bash
mysql -u mobileshop -p mobile_shop_saas -e "SELECT id, email, full_name, role, is_active FROM users WHERE email = 'admin@mobileshop.com';"
```

**Default Credentials:**
- Email: `admin@mobileshop.com`
- Password: `admin123`

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd "c:/Users/E-TIME/Documents/javascript/mobile shop software/mobile-shop-saas/backend"
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the backend directory (or edit the existing one):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=mobileshop
DB_PASSWORD=YourStrongPassword123!
DB_NAME=mobile_shop_saas

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:5500
```

### 2.3 Start the Backend Server

```bash
cd "c:/Users/E-TIME/Documents/javascript/mobile shop software/mobile-shop-saas/backend"
npm start
```

You should see:
```
Server running on port 3000
Database connected successfully
```

**Keep this terminal open!** The backend server needs to keep running.

## Step 3: Frontend Setup

### 3.1 Open the Frontend

You have two options:

**Option 1: Using VS Code Live Server (Recommended)**
1. Open VS Code
2. Right-click on `mobile-shop-saas/frontend/index.html`
3. Select "Open with Live Server"
4. The app will open in your browser at `http://localhost:5500`

**Option 2: Direct File Access**
1. Navigate to `mobile-shop-saas/frontend/`
2. Double-click `index.html`
3. The app will open in your browser

### 3.2 Test the Application

1. You should see the login page
2. Enter the default credentials:
   - Email: `admin@mobileshop.com`
   - Password: `admin123`
3. Click "Login"

If successful, you'll be redirected to the dashboard.

## Troubleshooting Common Issues

### Issue 1: "Failed to fetch" or "ERR_CONNECTION_REFUSED"

**Cause:** Backend server is not running

**Solution:**
```bash
cd "c:/Users/E-TIME/Documents/javascript/mobile shop software/mobile-shop-saas/backend"
npm start
```

### Issue 2: "401 Unauthorized" - Invalid email or password

**Cause:** Password hash in database is incorrect

**Solution:**
```bash
# Update the password hash in the database
mysql -u mobileshop -p mobile_shop_saas

UPDATE users 
SET password = '$2a$10$VCnLDFATMvniHCipwdP7LeG52.WpRhNaC4uVqHpa/P8TlKGFmJop2' 
WHERE email = 'admin@mobileshop.com';

EXIT;
```

### Issue 3: "Access denied for user 'mobileshop'@'localhost'"

**Cause:** Database user doesn't exist or password is wrong

**Solution:**
```sql
-- Recreate the database user
DROP USER IF EXISTS 'mobileshop'@'localhost';
CREATE USER 'mobileshop'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON mobile_shop_saas.* TO 'mobileshop'@'localhost';
FLUSH PRIVILEGES;
```

### Issue 4: "jsPDF library not loaded"

**Cause:** CDN connection timeout

**Solution:**
- Check your internet connection
- The app will automatically try a fallback CDN
- If both fail, you'll see a warning message but the app will still work (PDF download won't work)

### Issue 5: "Cannot read properties of null (reading 'value')"

**Cause:** DOM elements not loaded when script runs

**Solution:**
- This should be fixed with the current code
- If you still see this error, refresh the page
- Make sure you're using Live Server or opening the file directly

### Issue 6: CORS Error

**Cause:** Frontend origin not allowed in backend

**Solution:**
- The backend is configured to allow multiple origins
- If you're still seeing CORS errors, check the backend console for details
- Make sure the backend server is running on port 3000

## Testing the API

You can test the API endpoints directly using curl or Postman:

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@mobileshop.com\",\"password\":\"admin123\"}"
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@mobileshop.com",
      "full_name": "Super Admin",
      "role": "super_admin"
    }
  }
}
```

## Next Steps

After successful login:

1. **Create a Shop** (as Super Admin)
   - Go to Admin → Shops
   - Click "Add Shop"
   - Fill in shop details

2. **Create a Shop User**
   - Go to Admin → Users
   - Click "Add User"
   - Select the shop and set role to "shop_user"

3. **Add Products**
   - Go to Inventory
   - Click "Add Product"
   - Add global products (available to all shops)
   - Or add custom products for specific shops

4. **Create a Sale**
   - Go to Billing
   - Add products to cart
   - Complete the sale
   - Print or download the bill

5. **View Reports**
   - Go to Reports
   - View sales, inventory, and performance reports

## Development Tips

### Backend Development

- The backend server auto-restarts on file changes (if using nodemon)
- Check the backend console for API request logs
- Use the provided API endpoints in `api.js` for frontend-backend communication

### Frontend Development

- Use browser DevTools (F12) to debug JavaScript errors
- Check the Console tab for error messages
- Use the Network tab to monitor API requests
- The app uses Bootstrap 5 for styling

### Database Management

- Use MySQL Workbench or phpMyAdmin for visual database management
- You can run SQL queries directly from the command line
- The database schema includes views for reports

## Security Notes

⚠️ **Important for Production:**

1. Change the default admin password immediately
2. Update `JWT_SECRET` in `.env` to a strong, random string
3. Use HTTPS in production
4. Restrict CORS origins to your actual domain
5. Enable rate limiting on API endpoints
6. Implement proper logging and monitoring
7. Regularly update dependencies
8. Use environment variables for all sensitive data

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file for detailed solutions
2. Check the browser console for JavaScript errors
3. Check the backend console for server errors
4. Verify your database connection and credentials
5. Test API endpoints independently using curl or Postman

## File Structure

```
mobile-shop-saas/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── productController.js # Product management
│   │   ├── salesController.js   # Sales management
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── productRoutes.js     # Product routes
│   │   └── ...
│   ├── .env                     # Environment variables
│   ├── package.json             # Node.js dependencies
│   ├── server.js                # Express server setup
│   └── generate-hash.js          # Password hash generator
├── frontend/
│   ├── css/
│   │   └── style.css            # Custom styles
│   ├── js/
│   │   ├── api.js               # API communication
│   │   ├── auth.js              # Authentication functions
│   │   ├── billing.js           # Billing functionality
│   │   ├── dashboard.js         # Dashboard logic
│   │   ├── inventory.js         # Inventory management
│   │   ├── reports.js           # Reports generation
│   │   ├── utils.js             # Utility functions
│   │   └── ...
│   └── index.html               # Main HTML file
├── database/
│   └── schema.sql               # Database schema
├── DEPLOYMENT.md                # Deployment guide
├── README.md                    # Project documentation
├── TROUBLESHOOTING.md           # Troubleshooting guide
└── QUICK_SETUP.md               # This file
```

## Support

For more information, refer to:
- [README.md](README.md) - Project overview and features
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
