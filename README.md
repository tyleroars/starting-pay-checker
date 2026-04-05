# Starting Pay Checker

Entry-level salary data for hundreds of occupations, powered by BLS OEWS data. Built for GradSimple.

## Stack

- Next.js 14 on Vercel (hobby plan, free)
- Upstash Redis for data storage (free tier)
- GitHub Actions to fetch and process BLS data annually

## Deploy steps

### 1. Create GitHub repo

```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/starting-pay-checker.git
git push -u origin main
```

### 2. Create Upstash Redis database

1. Go to upstash.com and create a free Redis database
2. Copy the REST URL and REST Token from the database dashboard

### 3. Deploy to Vercel

1. Go to vercel.com, click "Add New Project"
2. Import your GitHub repo
3. Add these environment variables:
   - `KV_REST_API_URL` — your Upstash REST URL
   - `KV_REST_API_TOKEN` — your Upstash REST Token
4. Deploy

### 4. Add GitHub Secrets

In your GitHub repo: Settings → Secrets and variables → Actions → New repository secret

Add:
- `KV_REST_API_URL` — same Upstash URL
- `KV_REST_API_TOKEN` — same Upstash token

### 5. Run the data fetch

Go to your GitHub repo → Actions → "Fetch BLS OES Data" → Run workflow

This downloads the full BLS national flat file (~30MB), parses all occupations,
filters to early-career relevant roles, and saves to Redis.

Takes about 2-3 minutes. Once done, visit your Vercel URL.

## Updating data

BLS releases new OES data every May (~May 15).

The GitHub Action is scheduled to auto-run on May 16 each year.
You can also trigger it manually anytime from the Actions tab.

## Data source

Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS)
https://www.bls.gov/oes/

- Entry-level pay = 10th percentile annual wage
- All figures are national estimates
- Education data from BLS entry-level education requirements dataset
