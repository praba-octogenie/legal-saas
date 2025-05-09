# Legal CRM SaaS - Technical Installation and Deployment Guide

This guide provides comprehensive instructions for setting up, configuring, and deploying the Legal CRM SaaS system for both development and production environments.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Environment Setup](#development-environment-setup)
3. [Production Deployment](#production-deployment)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [AI Integration Setup](#ai-integration-setup)
7. [Multi-Tenant Setup](#multi-tenant-setup)
8. [Security Considerations](#security-considerations)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

## System Requirements

### Backend Requirements

- Node.js 16.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher (for caching and session management)
- SMTP server for email notifications

### Frontend Requirements

- Node.js 16.x or higher
- NPM 8.x or higher

### Production Server Requirements

- Linux-based server (Ubuntu 20.04 LTS or higher recommended)
- Minimum 4GB RAM (8GB recommended)
- 2 CPU cores (4 cores recommended)
- 20GB SSD storage (more depending on expected document storage needs)
- Nginx or similar web server for reverse proxy
- SSL certificate for HTTPS

## Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/legal-crm-saas.git
cd legal-crm-saas
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the .env file with your local configuration
nano .env
```

### 3. Database Setup

```bash
# Make sure PostgreSQL is running
# Create the database (if not using the init script)
createdb legal_crm

# Initialize the database with sample data
npm run init-db
```
npx ts-node src/scripts/init-db.ts

### 4. Start the Backend Server

```bash
# Start in development mode with hot reloading
npm run dev
```

### 5. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit the .env.local file
nano .env.local
```

### 6. Start the Frontend Server

```bash
# Start in development mode with hot reloading
npm run dev
```

The frontend will be available at http://localhost:3000 and the backend API at http://localhost:3000/api/v1.

## Production Deployment

### 1. Server Preparation

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Clone and Setup the Application

```bash
# Clone the repository
git clone https://github.com/your-organization/legal-crm-saas.git
cd legal-crm-saas

# Install dependencies
npm install

# Create and configure environment file
cp .env.example .env
nano .env

# Build the application
npm run build
```

### 3. Setup the Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create and configure environment file
cp .env.local.example .env.local
nano .env.local

# Build the frontend
npm run build
```

### 4. Database Setup

```bash
# Create the database
sudo -u postgres createdb legal_crm

# Initialize the database
npm run init-db
```

### 5. Configure Nginx

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/legal-crm
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/legal-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 7. Start the Application with PM2

```bash
# Start the backend
pm2 start dist/index.js --name legal-crm-backend

# Start the frontend (if not using Nginx to serve static files)
cd frontend
pm2 start npm --name legal-crm-frontend -- start

# Save the PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

## Configuration

### Backend Configuration (.env)

```
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=legal_crm
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SCHEMA=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key
JWT_EXPIRATION=86400

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# Email
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@your-domain.com

# Storage
STORAGE_TYPE=s3  # local or s3
STORAGE_PATH=./uploads  # if using local storage
S3_BUCKET=your-s3-bucket
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=your-s3-region

# Integration APIs
ECOURT_API_KEY=your-ecourt-api-key
MANUPATRA_API_KEY=your-manupatra-api-key
SCC_ONLINE_API_KEY=your-scc-online-api-key
INDIAN_KANOON_API_KEY=your-indian-kanoon-api-key

# Rocket.Chat
ROCKETCHAT_URL=https://chat.your-domain.com
ROCKETCHAT_ADMIN_USERNAME=admin
ROCKETCHAT_ADMIN_PASSWORD=your-rocketchat-admin-password

# Google Meet
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback

# AI Integration
AI_API_KEY=your-openai-api-key
AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Frontend Configuration (.env.local)

```
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Legal CRM
```

## Database Setup

The system uses PostgreSQL with a multi-tenant architecture. Each tenant has its own schema within the same database.

### Initial Database Setup

The `init-db.ts` script handles:

1. Creating the database if it doesn't exist
2. Creating the public schema tables for tenant management
3. Creating a sample tenant with a dedicated schema
4. Setting up initial admin user

To run the initialization:

```bash
npm run init-db
```

### Database Migrations

For production environments, it's recommended to use migrations instead of `sync()`:

1. Install Sequelize CLI:
   ```bash
   npm install -g sequelize-cli
   ```

2. Create a migration:
   ```bash
   sequelize migration:generate --name create-tables
   ```

3. Run migrations:
   ```bash
   sequelize db:migrate
   ```

## AI Integration Setup

The system integrates with OpenAI's API for the AI-powered legal research assistant.

### Configuration

1. Obtain an API key from OpenAI (https://platform.openai.com/)
2. Add the following to your `.env` file:
   ```
   AI_API_KEY=your-openai-api-key
   AI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
   AI_MODEL=gpt-4
   ```

### Testing the AI Integration

1. Start the backend server
2. Make a test request to the AI endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/v1/legal-research/ai/ask \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"question":"What is the legal definition of negligence in India?","options":{"jurisdiction":"india"}}'
   ```

## Multi-Tenant Setup

The system uses a schema-based multi-tenant architecture where each tenant has its own schema within the same PostgreSQL database.

### How Multi-Tenancy Works

1. The `public` schema contains the `tenants` table with information about all tenants
2. Each tenant has a dedicated schema named `tenant_[uuid]`
3. When a request comes in, the system:
   - Extracts the tenant identifier from the subdomain or request header
   - Looks up the tenant in the `tenants` table
   - Establishes a connection to the tenant's schema
   - Processes the request using the tenant's data

### Adding a New Tenant

To add a new tenant programmatically:

```javascript
const tenantService = require('./services/tenant-management/tenant.service');

const newTenant = await tenantService.createTenant({
  name: 'New Law Firm',
  subdomain: 'newlawfirm',
  status: 'active',
  plan: 'professional',
  contactInfo: {
    email: 'contact@newlawfirm.com',
    phone: '+91 9876543210',
    address: {
      street: '123 Legal Avenue',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
  },
  settings: {
    // Tenant settings
  },
  integrations: {
    // Tenant integrations
  },
});
```

## Security Considerations

### Authentication and Authorization

- The system uses JWT for authentication
- Tokens expire after the time specified in `JWT_EXPIRATION` (in seconds)
- Role-based access control is implemented for authorization
- Middleware functions check permissions for each request

### Data Encryption

- Sensitive data is encrypted using AES-256-GCM
- Each tenant has its own encryption key
- The master encryption key is stored in the `.env` file

### API Security

- All API endpoints are protected with authentication middleware
- Rate limiting is implemented to prevent abuse
- Input validation is performed using Joi schemas

### Recommendations

1. Use a strong, unique `JWT_SECRET` and `ENCRYPTION_KEY`
2. Enable HTTPS in production
3. Regularly update dependencies
4. Implement proper logging and monitoring
5. Perform regular security audits

## Monitoring and Maintenance

### Logging

The system uses Winston for logging. Logs are stored in the `logs` directory:

- `app.log`: General application logs
- `error.log`: Error logs
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled promise rejections

### Monitoring with PM2

PM2 provides basic monitoring capabilities:

```bash
pm2 monit
pm2 logs
pm2 status
```

### Database Maintenance

Regular database maintenance tasks:

1. Create regular backups:
   ```bash
   pg_dump -U postgres legal_crm > backup_$(date +%Y%m%d).sql
   ```

2. Vacuum the database to reclaim space:
   ```bash
   psql -U postgres -d legal_crm -c "VACUUM FULL;"
   ```

### Updating the Application

To update the application:

```bash
# Pull the latest changes
git pull

# Install dependencies
npm install

# Build the application
npm run build

# Restart the services
pm2 restart all
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

**Problem**: Unable to connect to the database
**Solution**:
1. Check if PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify database credentials in `.env`
3. Ensure the database exists: `psql -U postgres -c "\l"`
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`

#### Redis Connection Issues

**Problem**: Unable to connect to Redis
**Solution**:
1. Check if Redis is running: `sudo systemctl status redis-server`
2. Verify Redis configuration in `.env`
3. Test Redis connection: `redis-cli ping`

#### JWT Authentication Issues

**Problem**: Invalid token or authentication failures
**Solution**:
1. Check if `JWT_SECRET` is correctly set in `.env`
2. Verify token expiration time
3. Clear browser cookies and local storage
4. Regenerate the token

#### AI Integration Issues

**Problem**: AI endpoints return errors
**Solution**:
1. Verify `AI_API_KEY` is correctly set in `.env`
2. Check OpenAI API status: https://status.openai.com/
3. Verify request format and parameters
4. Check API rate limits and quotas

### Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs in the `logs` directory
2. Review the GitHub repository issues section
3. Contact the development team at support@your-organization.com

---

This installation guide covers the basic setup and configuration of the Legal CRM SaaS system. For more detailed information about specific features and modules, please refer to the system documentation.