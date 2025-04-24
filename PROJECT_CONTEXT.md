# Discover Boba - Project Context

This document provides a comprehensive overview of the Discover Boba project, including its architecture, dependencies, and functionality. It's designed to help developers and LLMs understand the project structure before making changes.

## Project Overview

Discover Boba is a directory website for finding boba tea shops in major cities across the United States. The site allows users to:

- Browse boba shops by city
- Search for shops by name, location, or features
- View detailed information about each shop
- Read and submit reviews
- View shop locations on maps
- Filter shops by various criteria

## Tech Stack

### Core Technologies
- **Next.js**: Version 15.3.1 (App Router)
- **React**: Version 19.1.0
- **TypeScript**: Version 5.8.3
- **Node.js**: Required for development and build processes

### Key Dependencies
- **@sentry/nextjs**: Version 9.13.0 - Error tracking and monitoring
- **@upstash/ratelimit** & **@upstash/redis**: Rate limiting for API routes
- **csv-parser**: Version 3.2.0 - Parsing CSV data files
- **tailwindcss**: Version 3.3.0 - Utility-first CSS framework
- **uuid**: Version 11.1.0 - Generating unique identifiers

## Project Structure

The project follows the Next.js App Router structure:

```
discover-boba/
├── data/                  # Data files
│   ├── Atlanta.csv        # Shop data for Atlanta
│   ├── Chicago.csv        # Shop data for Chicago
│   ├── Philadelphia.csv   # Shop data for Philadelphia
│   └── reviews/           # JSON files containing shop reviews
├── public/                # Static assets
│   └── images/            # Image assets
├── src/
│   ├── app/               # App Router pages and API routes
│   │   ├── api/           # API endpoints
│   │   ├── boba-shop/     # Shop detail pages
│   │   ├── find-boba-shops/ # City listing pages
│   │   └── ...            # Other page routes
│   ├── components/        # Reusable React components
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── middleware.ts          # Next.js middleware (rate limiting, security headers)
└── next.config.mjs        # Next.js configuration
```

## Data Management

### Shop Data
- Shop data is stored in CSV files in the `data/` directory, with one file per city
- The `src/utils/data.ts` module provides functions for loading and processing shop data
- Shop data includes details like name, address, rating, tags, and contact information

### Review Data
- Reviews are stored as JSON files in the `data/reviews/` directory
- Each shop has its own JSON file named after the shop's slug
- The `src/utils/reviews.ts` module handles review operations (get, add, delete, update)

## Key Components

### Layout Components
- **Header**: Navigation and search functionality
- **Footer**: Site links and information
- **Layout**: Root layout with metadata, fonts, and global components

### Shop-related Components
- **ShopCard**: Displays shop preview in listings
- **MapView**: Shows individual shop on a map
- **CityMapView**: Shows multiple shops on a city map
- **ReviewsSection**: Displays and manages shop reviews
- **FilterSidebar**: Allows filtering shops by tags

### Utility Components
- **OptimizedImage**: Wrapper around Next.js Image with optimizations
- **Pagination**: Handles pagination for listings
- **GoogleAnalytics**: Integrates Google Analytics tracking

## Routing and Pages

### Main Pages
- **/** (Home): Landing page with city selection
- **/find-boba-shops**: Lists all cities
- **/find-boba-shops/[city]**: Lists shops in a specific city
- **/boba-shop/[slug]**: Detailed view of a specific shop
- **/search**: Search results page
- **/faq**: Frequently asked questions
- **/contact**: Contact form

### API Routes
- **/api/shops**: Returns all shops (simplified data)
- **/api/search**: Searches shops by query
- **/api/reviews**: Manages shop reviews
- **/api/admin/reviews/[id]**: Admin endpoints for review management

## Styling

- **Tailwind CSS** is used for styling with custom configuration
- Custom components defined in `globals.css` include:
  - `.container-custom`: Container with responsive padding
  - `.btn-primary`: Primary button style
  - `.btn-secondary`: Secondary button style
  - `.card`: Card component style
  - `.tag`: Tag/badge style
- Custom color scheme with primary (blue) and secondary (purple) colors
- Dark mode support using `prefers-color-scheme`
- Fonts: Inter (body) and Poppins (headings) from Google Fonts

## Security and Performance

### Security
- **Content Security Policy (CSP)**: Implemented in `src/utils/csp.ts`
- **Rate Limiting**: Applied to API routes using Upstash Redis
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Permissions Policy**: Restricts access to sensitive browser features

### Performance
- **Image Optimization**: Using Next.js Image component with custom sizes
- **Caching**: Cache headers for static assets
- **Code Splitting**: Automatic code splitting by Next.js
- **Compression**: Enabled in Next.js config

## Error Handling and Monitoring

- **Sentry Integration**: For error tracking and performance monitoring
- **Custom Error Pages**: global-error.tsx and not-found.tsx
- **API Error Handling**: Consistent error responses from API routes

## Analytics

- **Google Analytics**: Integrated via the GoogleAnalytics component
- **Custom Event Tracking**: Available through the trackEvent function
- **Type Definitions**: Custom types for gtag in `src/types/gtag.d.ts`

## Important Considerations

### TypeScript Configuration
- TypeScript is configured to ignore build errors in production (`ignoreBuildErrors: true`)
- This means type checking is primarily for development, not enforced in production builds

### Data Loading
- Data is loaded from CSV files at request time
- No database is used; all data is file-based
- This approach works for the current scale but may need revision for larger datasets

### Rate Limiting
- API routes are rate-limited to prevent abuse
- In-memory fallback is used if Redis is unavailable

### SEO Optimization
- Each page has custom metadata
- Sitemap generation in `src/app/sitemap.ts`
- Robots.txt configuration in `src/app/robots.ts`

### Deployment
- The project is configured for deployment on Vercel
- Environment variables are required for various integrations (Sentry, Google Analytics, etc.)
- CI/CD workflow defined in `.github/workflows/ci-cd.yml`

## Environment Variables

The following environment variables are used:

- `NEXT_PUBLIC_SITE_URL`: Public URL of the site
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics measurement ID
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN for error tracking
- `RATE_LIMIT_MAX`: Maximum requests per window for rate limiting
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting in milliseconds
- `NEXT_PUBLIC_CSP_CONNECT_SRC`: CSP connect-src directive
- `NEXT_PUBLIC_CSP_IMG_SRC`: CSP img-src directive
- `NEXT_PUBLIC_CSP_SCRIPT_SRC`: CSP script-src directive

## Data Structure

### Shop Data Headers
The CSV files in the `data/` directory contain the following key headers:
- `name`: Name of the boba shop
- `formatted_address`: Full address of the shop
- `city`, `state`: Location information
- `rating`: Numerical rating (e.g., 4.7)
- `user_ratings_total`: Number of reviews
- `reviews_link`: Link to Google reviews
- `website`: Shop's website URL
- `formatted_phone_number`: Contact phone number
- `email_1`: Primary email address
- `working_hours`: Operating hours in JSON format
- `working_hours_old_format`: Alternative format for hours
- `menu_link`: URL to the shop's menu
- `order_links`: URL for online ordering
- `about`: Description and features in JSON format
- `photos`: Image URLs

## Recent Updates

### UI Modifications (April 2025)

#### City Images and SEO Improvements (April 24, 2025)
- **City-Specific Images**: Updated the application to use city-specific images from the `/public/images` folder
  - Modified the `getCities` function in `src/utils/data.ts` to use images named after each city
  - Images are now displayed in city cards on the main listing page and as header images on city pages
- **SEO Optimization**: 
  - Updated city page headers to include an H1 tag that says "Boba Shops in [city name]" over the city image
  - This improves search engine optimization for city-specific pages

#### Contact Information and Layout (April 23, 2025)
- **Combined Hours and Contact Info**: Moved contact information into the same box as hours of operation
  - For desktop: Side-by-side layout with a divider
  - For mobile: Stacked layout for better readability
  - Removed redundant Contact Information section from the sidebar
- **Enhanced Contact Information**:
  - Added colored icons for phone, email, and address
  - Made all contact information (address, phone, email) clickable links
- **Updated Action Buttons**:
  - Replaced "Directions" button with "Order Now" and/or "See Menu" buttons when available
  - Order and menu links are pulled from the CSV data
- **Social Media Sharing**:
  - Added sharing buttons to individual shop pages in the header section
  - Added sharing buttons to shop cards in the bottom-right corner
  - Included options for Facebook, Twitter, and email sharing

#### Previous Updates
- **Breadcrumb Navigation Fix**: Added a helper function to remove trailing commas from city names and URL paths in breadcrumb navigation on individual shop pages. This fixes the 404 errors that were occurring when users clicked on city names with trailing commas.
- **Image Containers**: Temporarily hidden image containers in both individual shop pages and shop cards. This is a temporary measure until a decision is made about including shop images.
  - In `src/app/boba-shop/[slug]/page.tsx`: Removed the image container at the top of individual shop pages.
  - In `src/components/ShopCard.tsx`: Hidden the image container while preserving the rating display.

## Conclusion

Discover Boba is a well-structured Next.js application that follows modern web development practices. It uses a file-based data approach, which is suitable for its current scale. The application has a clean component structure, consistent styling with Tailwind CSS, and integrations for monitoring, analytics, and security.

When making changes to this project, be mindful of:
1. The file-based data structure
2. TypeScript type definitions
3. Security headers and CSP configuration
4. Image optimization settings
5. The responsive design approach
