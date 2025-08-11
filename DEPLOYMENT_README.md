# Deployment Checklist & Guide

This document provides a comprehensive guide for deploying the Farmers' Direct Market application to production.

## 🚀 Pre-Deployment Checklist

### 1. MongoDB Atlas Setup

#### Create MongoDB Atlas Cluster
1. **Sign up/Login**: Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Project**: 
   - Click "New Project"
   - Name: `farmerdm-production`
   - Click "Create Project"

3. **Create Cluster**:
   - Click "Build a Database"
   - Choose "FREE" tier (M0) for development
   - Choose "M10" or higher for production
   - Select cloud provider (AWS/Google Cloud/Azure)
   - Select region closest to your users
   - Click "Create"

4. **Configure Database Access**:
   - Go to "Database Access" → "Add New Database User"
   - Username: `farmerdm_user`
   - Password: Generate strong password
   - Role: "Read and write to any database"
   - Click "Add User"

5. **Configure Network Access**:
   - Go to "Network Access" → "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your hosting provider's IP ranges
   - Click "Confirm"

6. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

#### Environment Variable
```env
MONGODB_URI=mongodb+srv://farmerdm_user:your_password@cluster0.xxxxx.mongodb.net/farmerdm?retryWrites=true&w=majority
```

### 2. Cloudinary Setup

#### Create Cloudinary Account
1. **Sign up**: Go to [Cloudinary](https://cloudinary.com)
2. **Create Account**: Use your email and create a password
3. **Get Credentials**:
   - Go to Dashboard
   - Note your Cloud Name, API Key, and API Secret

#### Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Alternative: AWS S3 Setup
If you prefer S3 over Cloudinary:

1. **Create AWS Account**: Go to [AWS Console](https://aws.amazon.com)
2. **Create S3 Bucket**:
   - Go to S3 → "Create bucket"
   - Bucket name: `farmerdm-uploads`
   - Region: Choose closest to your users
   - Uncheck "Block all public access" (for image serving)
   - Click "Create bucket"

3. **Configure CORS**:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
        "AllowedOrigins": ["https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

4. **Create IAM User**:
   - Go to IAM → "Users" → "Add user"
   - Username: `farmerdm-s3-user`
   - Attach policy: `AmazonS3FullAccess`
   - Generate access keys

5. **Environment Variables**:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=farmerdm-uploads
```

### 3. Environment Configuration

#### Create Production Environment File
Create `.env.production` (never commit this file):

```env
# Database
MONGODB_URI=mongodb+srv://farmerdm_user:your_password@cluster0.xxxxx.mongodb.net/farmerdm?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
UPLOAD_RATE_LIMIT_MAX_REQUESTS=10
SEARCH_RATE_LIMIT_MAX_REQUESTS=30

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment Gateways (configure as needed)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Monitoring
SENTRY_DSN=https://your_sentry_dsn
LOGDNA_INGESTION_KEY=your_logdna_key
PAPERTRAIL_URL=logs.papertrailapp.com:12345

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
HOST=0.0.0.0
```

### 4. GitHub Actions CI/CD

#### Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:coverage
      env:
        CI: true
    
    - name: Run API tests
      run: npm run test:api
      env:
        CI: true
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella

  e2e-tests:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start application
      run: npm run build && npm start &
      env:
        MONGODB_URI: ${{ secrets.MONGODB_URI }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
        CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
        CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
    
    - name: Wait for application to start
      run: sleep 30
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        CYPRESS_baseUrl: http://localhost:3000

  deploy:
    runs-on: ubuntu-latest
    needs: [test, e2e-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        MONGODB_URI: ${{ secrets.MONGODB_URI }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
        CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
        CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
        CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
    
    # Deploy to Vercel
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
    
    # Alternative: Deploy to Railway
    # - name: Deploy to Railway
    #   uses: railway/deploy@v1
    #   with:
    #     railway_token: ${{ secrets.RAILWAY_TOKEN }}
    #     service: farmerdm
    
    # Alternative: Deploy to DigitalOcean App Platform
    # - name: Deploy to DigitalOcean
    #   uses: digitalocean/app_action@main
    #   with:
    #     app_name: farmerdm
    #     token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level moderate
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
```

#### Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions:

1. **MONGODB_URI**: Your MongoDB Atlas connection string
2. **JWT_SECRET**: Your JWT secret key
3. **JWT_REFRESH_SECRET**: Your JWT refresh secret key
4. **CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name
5. **CLOUDINARY_API_KEY**: Your Cloudinary API key
6. **CLOUDINARY_API_SECRET**: Your Cloudinary API secret
7. **VERCEL_TOKEN**: Your Vercel API token
8. **VERCEL_ORG_ID**: Your Vercel organization ID
9. **VERCEL_PROJECT_ID**: Your Vercel project ID
10. **SNYK_TOKEN**: Your Snyk API token (for security scanning)

### 5. Monitoring & Logging Setup

#### Sentry Error Tracking
1. **Create Sentry Account**: Go to [Sentry](https://sentry.io)
2. **Create Project**: 
   - Choose "Next.js" platform
   - Project name: `farmerdm`
3. **Get DSN**: Copy the DSN from project settings
4. **Install SDK**: `npm install @sentry/nextjs`
5. **Configure**: Add to `next.config.mjs`:

```javascript
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  // your existing config
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: "your-org",
  project: "farmerdm",
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

#### LogDNA/Papertrail Logging
1. **Create LogDNA Account**: Go to [LogDNA](https://logdna.com)
2. **Get Ingestion Key**: Copy from dashboard
3. **Configure Environment Variable**:
```env
LOGDNA_INGESTION_KEY=your_logdna_key
```

4. **Install Winston Logger**:
```bash
npm install winston winston-logdna
```

5. **Create Logger Configuration** (`src/lib/logger.js`):
```javascript
const winston = require('winston');
require('winston-logdna');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'farmerdm' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

if (process.env.LOGDNA_INGESTION_KEY) {
  logger.add(new winston.transports.Logdna({
    key: process.env.LOGDNA_INGESTION_KEY,
    hostname: process.env.HOSTNAME || 'farmerdm',
    app: 'farmerdm',
    level: 'info',
    index_meta: true
  }));
}

module.exports = logger;
```

### 6. Performance Monitoring

#### Vercel Analytics (if using Vercel)
1. **Enable Analytics**: In Vercel dashboard → Project → Analytics
2. **Add to `_app.js`**:
```javascript
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

#### Google Analytics
1. **Create GA4 Property**: Go to [Google Analytics](https://analytics.google.com)
2. **Get Measurement ID**: Copy from property settings
3. **Add to `_app.js`**:
```javascript
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}
```

### 7. SSL/HTTPS Configuration

#### Vercel (Automatic)
Vercel automatically provides SSL certificates for custom domains.

#### Manual SSL Setup
If using a custom server:

1. **Install Certbot**:
```bash
sudo apt-get update
sudo apt-get install certbot
```

2. **Generate Certificate**:
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

3. **Configure HTTPS in `server.js`**:
```javascript
const https = require('https');
const fs = require('fs');

const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

const httpsServer = https.createServer(httpsOptions, app);
httpsServer.listen(443, () => {
  console.log('HTTPS Server running on port 443');
});
```

### 8. Database Backup Strategy

#### MongoDB Atlas Automated Backups
1. **Enable Backups**: In Atlas → Cluster → "Backup" tab
2. **Schedule**: Daily backups with 7-day retention
3. **Point-in-Time Recovery**: Enable for production clusters

#### Manual Backup Script
Create `scripts/backup.js`:
```javascript
const { exec } = require('child_process');
const path = require('path');

const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `farmerdm-backup-${timestamp}.gz`;

exec(`mongodump --uri="${process.env.MONGODB_URI}" --archive="${backupDir}/${filename}" --gzip`, (error, stdout, stderr) => {
  if (error) {
    console.error('Backup failed:', error);
    return;
  }
  console.log('Backup completed:', filename);
});
```

Add to `package.json`:
```json
{
  "scripts": {
    "backup": "node scripts/backup.js"
  }
}
```

### 9. Health Checks

#### Create Health Check Endpoint
Create `src/app/api/health/route.js`:
```javascript
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    
    // Check uptime
    const uptime = process.uptime();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      database: dbStatus,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      environment: process.env.NODE_ENV
    };
    
    const statusCode = dbState === 1 ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

### 10. Deployment Platforms

#### Vercel (Recommended for Next.js)
1. **Connect Repository**: Go to [Vercel](https://vercel.com)
2. **Import Project**: Connect your GitHub repository
3. **Configure Environment Variables**: Add all production env vars
4. **Deploy**: Automatic deployment on push to main branch

#### Railway
1. **Connect Repository**: Go to [Railway](https://railway.app)
2. **Create Project**: Connect your GitHub repository
3. **Add Environment Variables**: Configure all production env vars
4. **Deploy**: Automatic deployment on push

#### DigitalOcean App Platform
1. **Create App**: Go to [DigitalOcean](https://cloud.digitalocean.com)
2. **Connect Repository**: Link your GitHub repository
3. **Configure Build**: Set build command and run command
4. **Add Environment Variables**: Configure all production env vars
5. **Deploy**: Automatic deployment on push

### 11. Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test database connection and create indexes
- [ ] Verify file uploads work with Cloudinary/S3
- [ ] Test authentication flows (register, login, logout)
- [ ] Verify email notifications are working
- [ ] Test payment integration (if applicable)
- [ ] Check SSL certificate is valid
- [ ] Verify monitoring and logging are working
- [ ] Test backup and restore procedures
- [ ] Run security scan on production environment
- [ ] Test rate limiting and security headers
- [ ] Verify responsive design on mobile devices
- [ ] Test multilingual functionality
- [ ] Check performance with real data
- [ ] Verify error handling and user feedback

### 12. Maintenance

#### Regular Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and rotate API keys and secrets
- **Annually**: Review and update SSL certificates

#### Monitoring Alerts
Set up alerts for:
- High error rates (>5%)
- Response time > 2 seconds
- Database connection failures
- Disk space > 80%
- Memory usage > 80%
- Failed deployments

This deployment guide ensures your Farmers' Direct Market application is production-ready with proper security, monitoring, and scalability measures in place.
