# Discover Boba

A modern, SEO-optimized directory website to help users find Boba tea shops in major cities across the United States. Built with Next.js, this website dynamically generates static pages for each city based on CSV files in the `/data` directory.

## Features

- 🏠 Modern, responsive homepage with hero section and featured cities
- 🧋 Shop cards and detailed listings for each boba shop
- 🏷️ Tag-based filtering and search functionality
- 📄 FAQ page with information about boba tea
- 📱 Mobile-first design approach
- 🗺️ Placeholder for map integration
- 📌 SEO optimization with dynamic sitemap and meta tags

## Tech Stack

- **Next.js** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **CSV Parser** - For parsing CSV data files

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/discover-boba.git
   cd discover-boba
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
discover-boba/
├── data/                  # CSV files for each city
├── images/                # Static images
├── public/                # Public assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # Admin pages
│   │   │   ├── reviews/   # Review moderation interface
│   │   ├── api/           # API routes
│   │   │   ├── admin/     # Admin API endpoints
│   │   │   ├── reviews/   # Reviews API endpoints
│   │   │   ├── search/    # Search API endpoints
│   │   ├── boba-shop/     # Individual shop pages
│   │   ├── faq/           # FAQ page
│   │   ├── find-boba-shops/ # City listing pages
│   ├── components/        # Reusable UI components
│   ├── styles/            # Global styles
│   └── utils/             # Utility functions
├── next.config.mjs        # Next.js configuration
├── package.json           # Project dependencies
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Adding a New City

To add a new city to the Discover Boba website, follow these steps:

1. Create a new CSV file in the `/data` directory with the city name (e.g., `NewYork.csv`).

2. Ensure your CSV file has the following required columns:
   - `name` - The name of the boba shop
   - `formatted_address` - The full address of the shop
   - `rating` - Numerical rating (e.g., 4.5)
   - `user_ratings_total` - Number of reviews
   - `about` - JSON-formatted string containing tags and features

3. The website will automatically detect the new city and generate:
   - A city page at `/find-boba-shops/[city-slug]`
   - Individual shop pages for each entry
   - Updated sitemap.xml with the new pages

4. No code changes are required - the site will build with the new city data automatically!

## CSV Format Requirements

The CSV files should follow this format:

- Each row represents a single boba shop
- The first row should contain column headers
- Required columns:
  - `name`: Shop name
  - `formatted_address`: Full address including city and state
  - `rating`: Numerical rating (e.g., 4.5)
  - `user_ratings_total`: Number of reviews
  - `about`: JSON string containing tags and features
  - `website` (optional): Shop website URL
  - `formatted_phone_number` (optional): Phone number
  - `opening_hours` (optional): JSON string with hours of operation
  - `photos` (optional): URL to shop photo

## Development

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running Production Build

```bash
npm start
# or
yarn start
```

## Reviews System

The website includes a comprehensive reviews system that allows users to:

1. Submit reviews for boba shops with ratings and comments
2. View reviews from other users
3. Sort and filter reviews

### Review Moderation

For site administrators, a moderation interface is available at `/admin/reviews`. This page allows administrators to:

- View all reviews across all shops
- Approve or unapprove reviews
- Delete inappropriate reviews

To access the admin interface, navigate to `/admin/reviews` in your browser.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
