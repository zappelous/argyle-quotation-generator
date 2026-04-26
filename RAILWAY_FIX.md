# Railway Production DB Migration Fix

## Problem
The `init` migration failed on Railway because the DB already had tables from the old schema. The app is stuck in a crash loop because `prisma migrate deploy` keeps hitting the failed migration.

## Solution

### Step 1: Fix the Database (do this ONCE)

**Option A: Railway Dashboard SQL Console** (easiest)
1. Go to your Railway project dashboard
2. Click on your PostgreSQL service
3. Go to the "Data" or "Query" tab
4. Paste the contents of `prisma/fix-railway.sql`
5. Click "Run" or "Execute"

**Option B: Railway CLI**
```bash
# Connect to your Railway DB
railway connect

# Then run the fix script
psql < prisma/fix-railway.sql
```

**Option C: psql with connection string**
```bash
# Get your DATABASE_URL from Railway environment variables
# Then:
psql "$DATABASE_URL" -f prisma/fix-railway.sql
```

### What the fix script does:
1. Marks the failed `init` migration as rolled back in `_prisma_migrations`
2. Adds any missing columns to existing tables (Quotation.status, Template.defaultDeliveryTerms, etc.)
3. Creates the new Invoice, InvoiceItem, and Payment tables
4. Adds all foreign keys and indexes
5. Marks the delta migration as already applied (so `prisma migrate deploy` won't try to run it again)

### Step 2: Deploy the App

After running the fix script, push the code changes to GitHub. Railway will auto-deploy:
```bash
git add -A
git commit -m "fix: add delta migration for Railway DB"
git push origin main
```

On the next Railway deploy, `prisma migrate deploy` will:
- See the `init` migration is marked as rolled back → skip it
- See the `add_invoices` delta migration is already applied → skip it
- Your app starts successfully!

### For New Environments (fresh DB)

If you ever need to set up a fresh database:
1. Run `npx prisma migrate reset --force`
2. The `init` migration creates all tables
3. The `add_invoices` migration adds new tables and columns (idempotent - safe to re-run)

## New App Features

After the fix, your app will have:
- **Invoices** (`/invoices`) — Create from quotations or scratch, track payments
- **Statements** (`/statements`) — Generate PDF statements of account for any customer
- **Payment Recording** — Bank Transfer, PayNow, Cheque, Cash, Credit Card
- **Auto-calculated Balance Due** — Updates when payments are recorded/deleted
- **PDF Generation** — Professional invoice and statement PDFs with your template branding
