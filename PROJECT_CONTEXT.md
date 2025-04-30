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
- Share shops on social media

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
- **react-markdown**: Version 10.1.0 - Rendering markdown content
- **resend**: Version 4.4.1 - Email sending functionality
- **sharp**: Version 0.34.1 - Image processing and optimization

## Project Structure

The project follows the Next.js App Router structure:

```
discover-boba/
├── data/                  # Data files
│   ├── Atlanta.csv        # Shop data for Atlanta
│   ├── Chicago.csv        # Shop data for Chicago
│   ├── Dallas.csv         # Shop data for Dallas
│   ├── New York.csv       # Shop data for New York
│   ├── Philadelphia.csv   # Shop data for Philadelphia
│   ├── Seattle.csv        # Shop data for Seattle
│   ├── Washington.csv     # Shop data for Washington DC
│   └── reviews/           # JSON files containing shop reviews
├── public/                # Static assets
│   ├── images/            # Original image assets
│   └── optimized/         # WebP optimized images in various sizes
├── scripts/               # Utility scripts
│   └── process-images.mjs # Image optimization script
├── src/
│   ├── app/               # App Router pages and API routes
│   │   ├── admin/         # Admin pages for review moderation
│   │   ├── api/           # API endpoints
│   │   ├── boba-shop/     # Shop detail pages
│   │   ├── contact/       # Contact page
│   │   ├── cookies-policy/# Cookies policy page
│   │   ├── faq/           # FAQ page
│   │   ├── find-boba-shops/# City listing pages
│   │   ├── privacy-policy/# Privacy policy page
│   │   ├── search/        # Search results page
│   │   ├── terms-of-service/# Terms of service page
│   │   └── about-us/      # About Us page
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
- Shop data includes details like name, address, rating, tags, contact information, menu links, and order links
- Each shop has a unique slug generated from its name for URL routing

### Review Data
- Reviews are stored as JSON files in the `data/reviews/` directory
- Each shop has its own JSON file named after the shop's slug
- The `src/utils/reviews.ts` module handles review operations (get, add, delete, update)
- Reviews include user information, rating, comment, date, and approval status
- Admin functionality allows for review moderation (approval/rejection)

## Key Components

### Layout Components
- **Header**: Navigation and search functionality with responsive mobile menu
- **Footer**: Site links, social media, and legal information
- **Layout**: Root layout with metadata, fonts, and global components

### Shop-related Components
- **ShopCard**: Displays shop preview in listings with rating, tags, and sharing options
- **MapView**: Shows individual shop on a map using Google Maps API
- **CityMapView**: Shows multiple shops on a city map with interactive markers
- **ReviewsSection**: Displays and manages shop reviews
- **ReviewForm**: Form for submitting new reviews
- **ReviewsList**: Displays approved reviews for a shop
- **FilterSidebar**: Allows filtering shops by tags. Collapsible on mobile view.

### Utility Components
- **OptimizedImage**: Wrapper around Next.js Image with advanced optimizations
- **Pagination**: Handles pagination for listings
- **SortDropdown**: Allows sorting shop listings
- **MarkdownContent**: Renders markdown content for legal pages
- **GoogleAnalytics**: Integrates Google Analytics tracking
- **GoogleAdsense**: Integrates Google AdSense for advertising

## Routing and Pages

### Main Pages
- **/** (Home): Landing page with city selection and search
- **/find-boba-shops**: Lists all cities with images
- **/find-boba-shops/[city]**: Lists shops in a specific city with filtering and map view
- **/boba-shop/[slug]**: Detailed view of a specific shop with information, map, and reviews
- **/search**: Search results page with filtering options
- **/faq**: Frequently asked questions
- **/contact**: Contact form for user inquiries
- **/about-us**: Information about the Discover Boba website and mission
- **/privacy-policy**, **/terms-of-service**, **/cookies-policy**: Legal pages

### Admin Pages
- **/admin/reviews**: Review moderation interface for approving/rejecting reviews

### API Routes
- **/api/shops**: Returns all shops (simplified data)
- **/api/search**: Searches shops by query across all cities
- **/api/reviews**: Manages shop reviews (GET, POST)
- **/api/contact**: Handles contact form submissions
- **/api/admin/reviews/[id]**: Admin endpoints for review management
- **/api/admin/reviews/[id]/approval**: Endpoint for updating review approval status

## Styling

- **Tailwind CSS** is used for styling with custom configuration
- Custom components defined in `globals.css` include:
  - `.container-custom`: Container with responsive padding
  - `.btn-primary`: Primary button style (blue)
  - `.btn-secondary`: Secondary button style (purple)
  - `.card`: Card component style
  - `.tag`: Tag/badge style
- Custom color scheme with primary (blue) and secondary (purple) colors
- Dark mode support using `prefers-color-scheme`
- Fonts: Inter (body) and Poppins (headings) from Google Fonts

## Image Optimization System

The project implements a comprehensive image optimization system:

1. **Preprocessing Script**: `scripts/process-images.mjs` generates optimized WebP variants of all images
   - Runs during the prebuild process via npm script
   - Creates multiple sizes (320w, 640w, 1024w, 1536w) for responsive loading
   - Converts all images to WebP format with quality setting of 85%
   - Stores optimized images in the `public/optimized/` directory

2. **OptimizedImage Component**: Enhanced wrapper around Next.js Image component
   - Supports responsive sizing with appropriate `srcset`
   - Handles lazy loading with optional low-quality placeholders
   - Provides fallback for failed image loads
   - Maintains proper aspect ratios

3. **Next.js Configuration**: `next.config.mjs` includes image optimization settings
   - Configured domains for remote images
   - Custom device and image sizes
   - Support for WebP and AVIF formats
   - Cache control headers for optimized delivery

## Security and Performance

### Security
- **Content Security Policy (CSP)**: Implemented in `src/utils/csp.ts`
  - Configurable via environment variables
  - Includes directives for scripts, styles, images, and connections
- **Rate Limiting**: Applied to API routes using Upstash Redis
  - Fallback to in-memory rate limiting if Redis is unavailable
  - Configurable limits via environment variables
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Permissions Policy**: Restricts access to sensitive browser features

### Performance
- **Image Optimization**: Using Next.js Image component with WebP conversion
- **Caching**: Cache headers for static assets
- **Code Splitting**: Automatic code splitting by Next.js
- **Compression**: Enabled in Next.js config

## Error Handling and Monitoring

- **Sentry Integration**: For error tracking and performance monitoring
  - Configured in `sentry.client.config.js`, `sentry.edge.config.js`, and `sentry.server.config.js`
- **Custom Error Pages**: global-error.tsx and not-found.tsx
- **API Error Handling**: Consistent error responses from API routes
- **Form Validation**: Client-side and server-side validation for forms

## Analytics and Advertising

- **Google Analytics**: Integrated via the GoogleAnalytics component
  - Page view tracking
  - Custom event tracking available through the trackEvent function
  - Type definitions in `src/types/gtag.d.ts`
- **Google AdSense**: Integrated via the GoogleAdsense component
  - Placeholder ad spaces throughout the site

## Contact Form System

- **Frontend Component**: `src/components/ContactForm.tsx`
  - Form validation with error handling
  - Success/error state management
- **API Endpoint**: `src/app/api/contact/route.ts`
  - Handles form submissions
  - Uses Resend for email delivery
  - Development mode logging

## Review System

- **Frontend Components**:
  - `ReviewsSection`: Container component for reviews
  - `ReviewsList`: Displays approved reviews
  - `ReviewForm`: Form for submitting new reviews
- **API Endpoints**:
  - `src/app/api/reviews/route.ts`: Handles review submission and retrieval
  - `src/app/api/admin/reviews/[id]/route.ts`: Handles review deletion
  - `src/app/api/admin/reviews/[id]/approval/route.ts`: Handles review approval
- **Admin Interface**: `src/app/admin/reviews/page.tsx`
  - Lists all reviews by shop
  - Allows approving/rejecting reviews
  - Allows deleting reviews

## Environment Variables

The following environment variables are used:

- `NEXT_PUBLIC_SITE_URL`: Public URL of the site
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key for map functionality
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics measurement ID
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN for error tracking
- `RATE_LIMIT_MAX`: Maximum requests per window for rate limiting
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting in milliseconds
- `CONTACT_EMAIL`: Email address for contact form submissions
- `RESEND_API_KEY`: API key for Resend email service
- `NEXT_PUBLIC_CSP_CONNECT_SRC`: CSP connect-src directive
- `NEXT_PUBLIC_CSP_IMG_SRC`: CSP img-src directive
- `NEXT_PUBLIC_CSP_SCRIPT_SRC`: CSP script-src directive
- `ADMIN_USERNAME`: Username for admin functionality
- `ADMIN_PASSWORD`: Password for admin functionality
- `REVIEW_MODERATION_ENABLED`: Toggle for review moderation

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

### Review Data Structure
The JSON files in the `data/reviews/` directory contain arrays of review objects with the following structure:
- `id`: Unique identifier (UUID)
- `shopId`: ID of the shop being reviewed
- `shopSlug`: Slug of the shop being reviewed
- `userName`: Name of the reviewer
- `userEmail`: Email of the reviewer (not displayed publicly)
- `rating`: Numerical rating (1-5)
- `comment`: Review text
- `date`: Timestamp of the review
- `isVerified`: Whether the reviewer is verified
- `isApproved`: Whether the review is approved for display

## Recent Updates

### UI Improvements and Search Bar Removal (April 30, 2025)
- **Changes Implemented**:
  - Commented out search bars in the header and hero section to simplify the interface
  - Reduced the front page hero height on mobile by 40% (from 70vh to 42vh) for better mobile experience
  - Replaced the "Sort by" dropdown on city pages with a "Jump to Map" button that smoothly scrolls to the map section
- **Implementation Details**:
  - Modified `src/components/Header.tsx` to comment out search forms in both desktop and mobile navigation
  - Updated `src/app/page.tsx` to comment out the hero search form and adjust hero height with responsive classes
  - Enhanced `src/app/find-boba-shops/[city]/page.tsx` to add an id to the map section
  - Created a new client component `src/components/JumpToMapButton.tsx` to handle the interactive scroll behavior
  - Fixed a React Server Component constraint by moving the onClick handler to a dedicated Client Component
- **Impact**: Improves user experience by simplifying the interface, optimizing mobile display, and providing easier navigation to the map section

### Mobile Filter Sidebar Enhancement (April 30, 2025)
- **Feature**: Improved the mobile user experience on city listing pages (`/find-boba-shops/[city]`) by making the filter sidebar collapsible.
- **Implementation**:
  - Modified `src/components/FilterSidebar.tsx`.
  - Added a "Filter Results" button visible only on mobile (`md:hidden`).
  - Introduced state (`isMobileFilterVisible`) to control the visibility of the filter controls on mobile. Filters are collapsed by default.
  - Clicking the "Filter Results" button toggles the visibility of the filter controls.
  - The "Apply Filters" and "Clear All" buttons now automatically collapse the filter section on mobile after being clicked.
  - Used Tailwind CSS responsive classes (`md:hidden`, `md:block`) to manage visibility across screen sizes.
  - Added ARIA attributes (`aria-expanded`, `aria-controls`) to the toggle button for accessibility.
- **Impact**: Reduces clutter on mobile screens by hiding filters until explicitly requested by the user, improving the initial view of shop listings.

### Added About Us Page (April 30, 2025)
- **Feature**: Created a new "About Us" page to provide information about the website's mission and team.
- **Implementation**:
  - Added a new route and component at `src/app/about-us/page.tsx`.
  - The page includes text content describing Discover Boba and an image (`boba-family.png`).
  - Used Tailwind CSS for layout, placing the image on the right side on larger screens.
  - Added the `/about-us` route to the sitemap (`src/app/sitemap.ts`).
- **Impact**: Provides users with context about the site's purpose and goals.

### Content Security Policy Fix for Images (April 29, 2025)
- **Issue Fixed**: Resolved an issue where images were not displaying on the local deployment after adding new pages for privacy policy, terms of service, and cookies policy
- **Root Cause**: The Content Security Policy (CSP) settings in the `.env` file were missing domains needed for the site's own images
- **Implementation**: Updated the `NEXT_PUBLIC_CSP_IMG_SRC` environment variable in both `.env` and `.env.example` files to include all required domains:
  - Added `https://*.vercel.app` and `https://discoverboba.com` to the allowed image sources
  - These domains were already included in the default fallback value in `src/utils/csp.ts`, but were being overridden by the incomplete value in the `.env` file
- **Impact**: All images now display correctly across the site, including the logo, hero images, city images, and content images

### Breadcrumb Navigation Fix for All City Suburbs (April 28, 2025)
- **Issue Fixed**: Resolved an issue where the breadcrumb for shops in suburbs displayed the suburb name instead of the main city name
- **Implementation**: Enhanced the breadcrumb generation logic in `src/app/boba-shop/[slug]/page.tsx` to map suburbs to their main cities:
  - Created a comprehensive mapping of suburbs to their main cities for all supported cities
  - Added special handling for cities with the same name in different states (e.g., Arlington in VA vs TX)
  - Implemented a two-step check that first looks for exact suburb name matches, then checks if the address contains the suburb
  - Maintained the existing special case handling for New York boroughs and Washington DC
- **User Experience**: Ensures consistent navigation for all shops, regardless of whether they're located in the city proper or a suburb
- **Maintainability**: Used an array-based approach to avoid duplicate key issues with cities that share the same name

### Breadcrumb Navigation Fix for New York Shops (April 28, 2025)
- **Issue Fixed**: Resolved an issue where the breadcrumb for New York shops displayed "York" instead of "New York"
- **Borough Handling**: Added special case handling for New York boroughs (Queens, Brooklyn, etc.) to ensure they link to the New York city page
- **Implementation**: Updated the breadcrumb generation logic in `src/app/boba-shop/[slug]/page.tsx` to detect New York shops based on multiple criteria:
  - City name is "York"
  - City path is "york"
  - City name is one of the New York boroughs (Queens, Brooklyn, Bronx, Manhattan, Staten Island)
  - Address contains "New York" or "NY"
- **User Experience**: Ensures consistent navigation for all New York shops, regardless of how the address is formatted in the data

### Image Optimization Overhaul (April 25, 2025)
- **Preprocessing Script**: Implemented `scripts/process-images.mjs` to generate WebP variants of all images
- **Size Variants**: Added generation of multiple sizes (320w, 640w, 1024w, 1536w) for responsive loading
- **OptimizedImage Component**: Enhanced with quality settings (85%) and srcset support
- **Format Conversion**: Migrated all images to modern WebP format with fallbacks
- **Next.js Configuration**: Updated image optimization settings in next.config.mjs
- **Performance Impact**: Significantly reduced page load times and bandwidth usage

### City Images and SEO Improvements (April 24, 2025)
- **City-Specific Images**: Updated the application to use city-specific images from the `/public/images` folder
  - Modified the `getCities` function in `src/utils/data.ts` to use images named after each city
  - Images are now displayed in city cards on the main listing page and as header images on city pages
- **SEO Optimization**: 
  - Updated city page headers to include an H1 tag that says "Boba Shops in [city name]" over the city image
  - This improves search engine optimization for city-specific pages

### Contact Information and Layout (April 23, 2025)
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

### Search Functionality Improvements (April 20, 2025)
- **Cross-City Search**: Updated search to work across all cities instead of being limited to a single city
- **Search Validation**: Added validation to ensure search queries are at least 2 characters
- **Error Handling**: Added Sentry error tracking to the search API endpoint
- **Performance**: Implemented sorting by relevance with name matches prioritized

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

## Conclusion

Discover Boba is a well-structured Next.js application that follows modern web development practices. It uses a file-based data approach, which is suitable for its current scale. The application has a clean component structure, consistent styling with Tailwind CSS, and integrations for monitoring, analytics, and security.

When making changes to this project, be mindful of:
1. The file-based data structure
2. TypeScript type definitions
3. Security headers and CSP configuration
4. Image optimization settings
5. The responsive design approach
6. Review moderation system
7. Breadcrumb navigation logic for suburbs and special cases
