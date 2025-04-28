# Search Functionality Fix Plan

## Immediate Fixes

### 1. API Search Scope Fix
**File:** `src/app/api/search/route.ts`  
Update the search endpoint to search across all cities instead of being limited to a single city:

```typescript
// BEFORE
const city = searchParams.get('city');
const shops = await getShopsByCity(city);

// AFTER
const allShops = await Promise.all(
  getCities().map(c => getShopsByCity(c.name))
);
const shops = allShops.flat().filter(shop => 
  shop.name.toLowerCase().includes(query.toLowerCase())
);
```

### 2. Search Validation
**File:** `src/app/api/search/route.ts`  
Add basic query validation:

```typescript
// Add at top of handler
if (!searchParams.has('q') || searchParams.get('q')?.trim().length < 2) {
  return NextResponse.json(
    { error: 'Search query must be at least 2 characters' },
    { status: 400 }
  );
}
```

### 3. Error Logging
**File:** `src/app/api/search/route.ts`  
Add Sentry error tracking:

```typescript
import { captureException } from '@sentry/nextjs';

// Wrap search logic in try/catch
try {
  // ... existing search code ...
} catch (error) {
  captureException(error);
  return NextResponse.json(
    { error: 'Failed to process search request' },
    { status: 500 }
  );
}
```

## Medium-term Implementation

### Search Index Builder
**New File:** `scripts/build-search-index.mjs`  
Create a search index builder script:

```javascript
#!/usr/bin/env node
import { getCities } from '../src/utils/data.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const INDEX_PATH = join(process.cwd(), 'data/search-index.json');

async function buildIndex() {
  const cities = await getCities();
  const allShops = (await Promise.all(
    cities.map(c => getShopsByCity(c.name))
  )).flat();
  
  const index = {
    lastBuilt: new Date().toISOString(),
    shops: allShops.map(shop => ({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      tags: shop.tags,
      about: shop.about,
    }))
  };

  writeFileSync(INDEX_PATH, JSON.stringify(index));
  console.log(`Search index built with ${index.shops.length} entries`);
}

buildIndex().catch(console.error);
```

## Testing Plan

1. **Validation Tests**
   ```shell
   curl "http://localhost:3000/api/search?q=a"
   # Should return 400 error
   ```

2. **Cross-City Search Test**
   ```shell
   curl "http://localhost:3000/api/search?q=boba"
   # Should return results from all cities
   ```

3. **Performance Benchmark**
   ```shell
   npm run dev -- --profile
   # Check performance tab in developer tools
   ```

## Required Environment Variables
Add to `.env.example`:
```ini
SEARCH_INDEX_PATH="./data/search-index.json"
SEARCH_CACHE_TTL="3600" # 1 hour cache
```

## Implementation Roadmap

1. Immediate fixes (1-2 hours)
2. Index builder integration (3-4 hours)
3. Search ranking implementation (5-8 hours)
4. Frontend improvements (8-10 hours)
