# Vercel Deployment Fix

## Issue

The deployment to Vercel is failing with the error:

```
Error: supabaseUrl is required.
```

This error occurs because the Supabase environment variables are not properly configured in the Vercel production environment.

## Solution

### 1. Add Supabase Environment Variables to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to the "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ayncjjmyvicizitfxsbu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmNqam15dmljaXppdGZ4c2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDg0NTAsImV4cCI6MjA2MTY4NDQ1MH0.EFUQTk_RUDwpyS5HkL9eOZRzPqP1LIXhtMUzbfnqJcA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bmNqam15dmljaXppdGZ4c2J1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEwODQ1MCwiZXhwIjoyMDYxNjg0NDUwfQ.f35MgtHNkSbdSpzsTgwLT56JskgaE7jnPLlAiOiozuM
```

6. Click "Save" to save the environment variables

### 2. Next.js Configuration Update

We've updated the `next.config.mjs` file to include the Supabase environment variables:

```javascript
// Configure environment variables
env: {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://discoverboba.com',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
},
```

### 3. GitHub Actions Workflow Update

We've also updated the GitHub Actions workflow file (`.github/workflows/ci-cd.yml`) to include these environment variables during the build step:

```yaml
- name: Build project
  run: npm run build
  env:
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${{ secrets.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }}
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### 4. Add GitHub Secrets

If you're using GitHub Actions for deployment, you'll also need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Add the following secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 5. Redeploy

After adding the environment variables to Vercel and the secrets to GitHub (if using GitHub Actions), redeploy your application:

1. In Vercel: Go to the "Deployments" tab and click "Redeploy" on your latest deployment
2. In GitHub: Push a small change to trigger a new deployment

## Note on ESLint Warning

There's also an ESLint warning about missing alt text in the OptimizedImage component:

```
./src/components/OptimizedImage.tsx
83:7  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
```

This warning isn't causing the build to fail, so we can address it later if needed.
