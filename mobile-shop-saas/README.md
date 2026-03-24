# Mobile Shop Management System - SaaS

A cloud-based multi-tenant system for mobile repairing shops with inventory management, billing, and sales tracking.

## Tech Stack
- Backend: Node.js + Express.js
- Frontend: HTML, CSS, Bootstrap, JavaScript
- Database: MySQL
- Authentication: JWT

## Installation

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
```

## Database Setup
1. Create MySQL database named `mobile_shop_saas`
2. Import `database/schema.sql`
3. Update database credentials in `backend/config/database.js`

## Running the Application

### Backend
```bash
cd backend
npm start
```

### Frontend
Open `frontend/index.html` in browser or use a local server



## Features
- Multi-tenant architecture (50+ shops)
- Role-based access (Super Admin, Shop User)
- Inventory management (Global + Custom products)
- Billing system with PDF generation
- Sales reports (Daily, Weekly, Monthly)
- Subscription management
- Urdu + English language support
