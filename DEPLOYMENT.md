# Deployment Guide for Discover Boba

This guide provides step-by-step instructions for deploying the Discover Boba website to production.

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel](https://vercel.com) account
2. A [GitHub](https://github.com) account
3. A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key)
4. A [Sentry](https://sentry.io) account (for error tracking)
5. A [Upstash](https://upstash.com) account (for Redis rate limiting)

## Deployment Steps

### 1. Prepare Your Repository

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/discover-boba.git
   git push -u origin main
   ```

### 2. Set Up Vercel Project

1. Log in to [Vercel](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next

### 3. Configure Environment Variables

Add the following environment variables in the Vercel project settings:

```
# Application
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_google_analytics_id_here

# API Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Review System
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password_here
REVIEW_MODERATION_ENABLED=true

# Content Security Policy
NEXT_PUBLIC_CSP_CONNECT_SRC="'self' https://www.google-analytics.com https://*.sentry.io"
NEXT_PUBLIC_CSP_IMG_SRC="'self' data: https://maps.googleapis.com https://*.googleusercontent.com"
NEXT_PUBLIC_CSP_SCRIPT_SRC="'self' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com"
```

### 4. Set Up CI/CD with GitHub Actions

1. Make sure your repository contains the `.github/workflows/ci-cd.yml` file
2. Add the following secrets to your GitHub repository:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

To get these values:
- Vercel Token: Go to Vercel account settings > Tokens > Create new token
- Org ID & Project ID: Run `vercel link` in your project directory and check the `.vercel/project.json` file

### 5. Set Up Domain and SSL

1. In Vercel, go to your project settings > Domains
2. Add your custom domain (e.g., discoverboba.com)
3. Follow the instructions to configure your DNS settings
4. Vercel will automatically provision an SSL certificate

### 6. Set Up Monitoring

#### Sentry

1. Create a new project in Sentry
2. Add the DSN to your environment variables
3. Verify that error tracking is working by triggering a test error

#### Google Analytics

1. Create a new property in Google Analytics
2. Add the Measurement ID to your environment variables
3. Verify that analytics are being collected

### 7. Production Optimizations

1. Verify that caching headers are correctly set
2. Test the Content Security Policy
3. Verify that rate limiting is working correctly
4. Run performance tests using Lighthouse

### 8. Final Checks

Before announcing your site launch, verify:

- [ ] All pages load correctly
- [ ] Mobile responsiveness works on various devices
- [ ] Search functionality works
- [ ] Maps display correctly
- [ ] Review submission and moderation work
- [ ] All API endpoints are functioning
- [ ] Error tracking is capturing issues
- [ ] Analytics are recording visits
- [ ] Security headers are properly set

## Troubleshooting

### Common Issues

1. **Maps not displaying**: Verify your Google Maps API key is correct and has the necessary permissions.
2. **Rate limiting not working**: Check your Upstash Redis connection details.
3. **Sentry not capturing errors**: Verify your DSN is correct and the Sentry SDK is properly initialized.
4. **Build failures**: Check the build logs in Vercel for specific errors.
5. **CSP blocking resources**: Adjust your Content Security Policy directives if legitimate resources are being blocked.

### Monitoring Production

1. **Vercel Dashboard**: Monitor deployments, build logs, and site performance.
2. **Sentry Dashboard**: Track errors and exceptions.
3. **Google Analytics**: Monitor user behavior and traffic patterns.
4. **Uptime Monitoring**: Set up a service like UptimeRobot to monitor site availability.

## Scaling Considerations

As your site grows, consider:

1. **CDN Optimization**: Vercel provides a global CDN, but ensure your assets are optimized.
2. **Database Scaling**: If you add a database later, plan for scaling and backups.
3. **API Rate Limiting**: Adjust rate limits based on actual usage patterns.
4. **Caching Strategies**: Implement more aggressive caching for static content.
5. **Image Optimization**: Consider using a dedicated image optimization service for user-uploaded images.

## Maintenance

Regular maintenance tasks:

1. **Dependency Updates**: Regularly update npm packages to patch security vulnerabilities.
2. **Performance Monitoring**: Regularly run Lighthouse audits to identify performance issues.
3. **Security Scans**: Periodically scan for security vulnerabilities.
4. **Backup Strategy**: Implement regular backups of any user-generated content.
5. **Log Analysis**: Regularly review logs to identify potential issues.

## Conclusion

Following this guide will help you successfully deploy the Discover Boba website to production. The site is designed to be scalable and maintainable, with proper error tracking, analytics, and security measures in place.
