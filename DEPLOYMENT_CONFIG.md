# Deployment Configuration Guide

## Environment Variables for Production

Create a `.env.production` file with the following variables:

### Database Configuration
```env
MONGODB_URI=mongodb+srv://farmerdm_user:your_password@cluster0.xxxxx.mongodb.net/farmerdm?retryWrites=true&w=majority
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Security Configuration
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
UPLOAD_RATE_LIMIT_MAX_REQUESTS=10
SEARCH_RATE_LIMIT_MAX_REQUESTS=30
```

### Cloudinary Configuration
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Alternative: AWS S3 Configuration
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=farmerdm-uploads
```

### Email Configuration
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Payment Gateway Configuration
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Monitoring & Logging
```env
SENTRY_DSN=https://your_sentry_dsn
LOGDNA_INGESTION_KEY=your_logdna_key
PAPERTRAIL_URL=logs.papertrailapp.com:12345
LOG_LEVEL=info
```

### Redis Configuration
```env
REDIS_URL=redis://localhost:6379
```

### Server Configuration
```env
PORT=3000
HOST=0.0.0.0
```

### Backup Configuration
```env
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
MAX_BACKUPS=100
```

### Analytics (optional)
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. `MONGODB_URI` - Your MongoDB Atlas connection string
2. `JWT_SECRET` - Your JWT secret key
3. `JWT_REFRESH_SECRET` - Your JWT refresh secret key
4. `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
5. `CLOUDINARY_API_KEY` - Your Cloudinary API key
6. `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
7. `VERCEL_TOKEN` - Your Vercel API token
8. `VERCEL_ORG_ID` - Your Vercel organization ID
9. `VERCEL_PROJECT_ID` - Your Vercel project ID
10. `SNYK_TOKEN` - Your Snyk API token (for security scanning)

## Platform-Specific Configuration

### Vercel
- Add all environment variables in Vercel dashboard
- Configure custom domain in project settings
- Enable analytics in project settings

### Railway
- Add all environment variables in Railway dashboard
- Configure custom domain in project settings

### DigitalOcean App Platform
- Add all environment variables in app settings
- Configure custom domain in app settings
- Set build command: `npm run build`
- Set run command: `npm start`

## Security Checklist

- [ ] All JWT secrets are strong and unique
- [ ] MongoDB user has minimal required permissions
- [ ] CORS origins are properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] HTTPS is enabled
- [ ] Environment variables are not committed to git
- [ ] API keys are rotated regularly
- [ ] Database backups are configured
- [ ] Monitoring and logging are set up

## Monitoring Setup

### Health Check Endpoint
Access: `https://yourdomain.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": "1h 30m",
  "database": {
    "status": "connected",
    "readyState": 1
  },
  "memory": {
    "rss": "45MB",
    "heapUsed": "25MB",
    "heapTotal": "35MB"
  },
  "environment": "production"
}
```

### Backup Commands
```bash
# Manual backup
npm run backup

# Clean old backups
npm run backup:clean

# Check health
npm run health
```

## Post-Deployment Verification

1. **Database Connection**: Check health endpoint
2. **File Uploads**: Test image upload functionality
3. **Authentication**: Test register/login flows
4. **API Endpoints**: Verify all API routes work
5. **Security**: Check rate limiting and CORS
6. **Monitoring**: Verify logs are being sent
7. **Performance**: Check response times
8. **SSL**: Verify HTTPS is working
9. **Backups**: Test backup functionality
10. **Error Handling**: Test error scenarios
