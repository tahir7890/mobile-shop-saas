# Deployment Guide - Mobile Shop Management System

This guide provides step-by-step instructions for deploying the Mobile Shop Management System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Process Management with PM2](#process-management-with-pm2)
9. [Security Hardening](#security-hardening)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Backup Strategy](#backup-strategy)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- A server with Ubuntu 20.04 LTS or later (recommended)
- Root or sudo access to the server
- A domain name pointed to your server's IP address
- Basic knowledge of Linux command line
- Git installed on your local machine

---

## Server Requirements

### Minimum Specifications

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Bandwidth**: 10 TB/month

### Recommended Specifications

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Bandwidth**: Unlimited

---

## Database Setup

### 1. Install MySQL Server

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

### 2. Create Database and User

```bash
# Login to MySQL
sudo mysql

# Run the following SQL commands
CREATE DATABASE mobile_shop_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mobileshop'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON mobile_shop_saas.* TO 'mobileshop'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Import Database Schema

```bash
# Navigate to the database directory
cd mobile-shop-saas/database

# Import the schema
mysql -u mobileshop -p mobile_shop_saas < schema.sql

# Verify import
mysql -u mobileshop -p mobile_shop_saas -e "SHOW TABLES;"
```

---

## Backend Deployment

### 1. Install Node.js and npm

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Clone and Setup Backend

```bash
# Navigate to web directory
cd /var/www

# Clone the repository (or upload files)
sudo mkdir -p mobile-shop-saas
cd mobile-shop-saas

# If using git
# sudo git clone <your-repo-url> .

# If uploading files, extract them here

# Navigate to backend
cd backend

# Install dependencies
sudo npm install --production

# Create .env file
sudo nano .env
```

### 3. Configure Environment Variables

Create `/var/www/mobile-shop-saas/backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=mobileshop
DB_PASSWORD=YourStrongPassword123!
DB_NAME=mobile_shop_saas
DB_PORT=3306

# JWT Configuration
JWT_SECRET=YourSuperSecretJWTKeyChangeThisInProduction123!
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

### 4. Test Backend

```bash
# Start the server to test
sudo npm start

# Test the health endpoint in another terminal
curl http://localhost:3000/api/health

# Press Ctrl+C to stop the server
```

---

## Frontend Deployment

### 1. Install Web Server

```bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Setup Frontend Files

```bash
# Navigate to web directory
cd /var/www/mobile-shop-saas

# Create frontend directory if not exists
sudo mkdir -p frontend

# Copy frontend files (or extract from upload)
# Ensure all frontend files are in /var/www/mobile-shop-saas/frontend/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/mobile-shop-saas/frontend
sudo chmod -R 755 /var/www/mobile-shop-saas/frontend
```

---

## Nginx Configuration

### 1. Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/mobile-shop-saas
```

Add the following configuration:

```nginx
# Upstream for backend
upstream backend {
    server 127.0.0.1:3000;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate paths (update after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend Files
    root /var/www/mobile-shop-saas/frontend;
    index index.html;

    # Frontend Routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Logging
    access_log /var/log/nginx/mobile-shop-saas-access.log;
    error_log /var/log/nginx/mobile-shop-saas-error.log;
}
```

### 2. Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/mobile-shop-saas /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### 1. Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate

```bash
# Obtain and configure SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts to complete the setup
```

### 3. Auto-Renewal Setup

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Verify with:
sudo systemctl status certbot.timer
```

---

## Process Management with PM2

### 1. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
cd /var/www/mobile-shop-saas/backend
sudo nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [{
    name: 'mobile-shop-api',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/mobile-shop-saas/error.log',
    out_file: '/var/log/mobile-shop-saas/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
```

### 3. Create Log Directory

```bash
sudo mkdir -p /var/log/mobile-shop-saas
sudo chown -R $USER:$USER /var/log/mobile-shop-saas
```

### 4. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output to complete setup
```

### 5. PM2 Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs mobile-shop-api

# Restart application
pm2 restart mobile-shop-api

# Stop application
pm2 stop mobile-shop-api

# Monitor application
pm2 monit
```

---

## Security Hardening

### 1. Configure Firewall

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban Setup

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

Add/modify these settings:

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 3. Rate Limiting in Nginx

Add to your Nginx configuration before the server block:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Add to location blocks:

```nginx
# Apply to API
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... rest of config
}

# Apply to login endpoint
location /api/auth/login {
    limit_req zone=login burst=3 nodelay;
    # ... rest of config
}
```

### 4. Disable Root SSH Login

```bash
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no
```

```bash
sudo systemctl restart sshd
```

---

## Monitoring and Logging

### 1. Application Monitoring

```bash
# Install PM2 Plus (optional, for advanced monitoring)
pm2 plus

# Or use basic monitoring
pm2 monit
```

### 2. Log Rotation Setup

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/mobile-shop-saas
```

Add:

```
/var/log/mobile-shop-saas/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Nginx Log Rotation

```bash
# Nginx logs are automatically rotated by logrotate
# View configuration
sudo cat /etc/logrotate.d/nginx
```

---

## Backup Strategy

### 1. Database Backup Script

Create backup script:

```bash
sudo nano /usr/local/bin/backup-mobile-shop.sh
```

Add:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/mobile-shop-saas"
DB_NAME="mobile_shop_saas"
DB_USER="mobileshop"
DB_PASS="YourStrongPassword123!"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# File backup
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/mobile-shop-saas

# Remove old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-mobile-shop.sh

# Test backup
sudo /usr/local/bin/backup-mobile-shop.sh
```

### 2. Automated Backups with Cron

```bash
# Edit crontab
sudo crontab -e
```

Add:

```
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-mobile-shop.sh >> /var/log/mobile-shop-backup.log 2>&1
```

---

## Troubleshooting

### Backend Issues

**Server won't start:**
```bash
# Check PM2 logs
pm2 logs mobile-shop-api

# Check port availability
sudo netstat -tlnp | grep 3000

# Check environment variables
cat /var/www/mobile-shop-saas/backend/.env
```

**Database connection errors:**
```bash
# Test MySQL connection
mysql -u mobileshop -p mobile_shop_saas

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Frontend Issues

**404 errors:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/mobile-shop-saas/frontend/

# Check Nginx logs
sudo tail -f /var/log/nginx/mobile-shop-saas-error.log
```

**API proxy errors:**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs mobile-shop-api

# Test backend directly
curl http://localhost:3000/api/health
```

### SSL Issues

**Certificate renewal failures:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Performance Issues

**High CPU usage:**
```bash
# Check PM2 monitoring
pm2 monit

# Check system resources
htop

# Increase PM2 instances if needed
pm2 scale mobile-shop-api 4
```

**High memory usage:**
```bash
# Check memory usage
free -h

# Check PM2 memory
pm2 show mobile-shop-api

# Restart application
pm2 restart mobile-shop-api
```

---

## Post-Deployment Checklist

- [ ] Database imported successfully
- [ ] Backend API is running (PM2 status: online)
- [ ] Frontend is accessible via HTTPS
- [ ] SSL certificate is valid and auto-renewal is configured
- [ ] Firewall is configured and enabled
- [ ] Fail2Ban is running
- [ ] Rate limiting is configured
- [ ] Daily backups are scheduled
- [ ] Log rotation is configured
- [ ] Default admin password is changed
- [ ] All environment variables are set correctly
- [ ] Application is tested end-to-end

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check application logs for errors
- Review system resource usage
- Verify backups are running

**Monthly:**
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review and rotate SSH keys
- Check SSL certificate status

**Quarterly:**
- Review and update security configurations
- Audit user access
- Test disaster recovery procedures

### Useful Commands

```bash
# System status
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# Logs
sudo tail -f /var/log/nginx/mobile-shop-saas-error.log
pm2 logs mobile-shop-api

# Backups
ls -lh /var/backups/mobile-shop-saas/

# Updates
cd /var/www/mobile-shop-saas/backend
git pull origin main
npm install --production
pm2 restart mobile-shop-api
```

---

## Contact

For deployment issues or questions, please contact your system administrator or refer to the project documentation.
