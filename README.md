# QuoteFlow — White-Label Quotation Generator

A full-stack web application for generating professional quotations and proforma invoices. Built with a **white-label, multi-template architecture** — create different quotation templates for different companies, brands, or business units.

## Features

- **Template-based quotations**: Create multiple templates with different branding, colors, terms, and pricing
- **White-label ready**: Each template has its own company name, logo, colors, and styling
- **SKU-based quoting**: Select SKUs, enter quantities, auto-calculate totals
- **Template-specific pricing**: Override SKU prices per template
- **PDF Generation**: One-click download of professionally styled A4 quotations
- **Email Quotations**: Send PDFs directly to customers via email (Resend)
- **Customer Management**: Save customers and view their quotation history
- **Edit & Save**: Draft, update, and re-send existing quotations
- **Authentication**: Login + allowlist-based registration

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma 7
- **PDF**: `@react-pdf/renderer` with dynamic styling
- **Email**: Resend
- **Deploy targets**: Vercel (frontend) + Railway (backend + DB)

## Quick Start

### 1. Install dependencies

```bash
cd quotation-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/quotation_app?schema=public"
RESEND_API_KEY="re_xxxxxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"
```

### 3. Set up database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

The seed script creates a default "Argyle Solar" template with the pre-loaded SKU catalogue.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment Guide

### Option A: Deploy to Railway (Full-stack, Easiest)

Railway hosts the Next.js app + PostgreSQL database together.

#### Step 1: Push to GitHub

Already done if you're reading this. Make sure your repo is public or Railway has access.

#### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `argyle-quotation-generator` repository
4. Railway auto-detects the Next.js app and shows build settings

#### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **New** → **Database** → **Add PostgreSQL**
2. Wait for it to provision (takes ~30 seconds)
3. Railway automatically adds `DATABASE_URL` to your environment variables

#### Step 4: Add Environment Variables

In Railway dashboard → your service → **Variables** tab, add:

```
DATABASE_URL          = (auto-populated by Railway Postgres)
RESEND_API_KEY        = re_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL   = https://your-app-name.up.railway.app
NEXTAUTH_SECRET       = (generate with: openssl rand -base64 32)
```

Get your Resend API key from [resend.com](https://resend.com) (free tier: 3000 emails/day).

#### Step 5: Deploy & Run Migrations

1. Railway auto-deploys on every git push
2. After first deploy, open the **Logs** tab and wait for build to finish
3. Run migrations using Railway's shell:
   - Railway dashboard → your service → **Shell** tab
   - Run: `npx prisma migrate deploy`
   - Then: `npx prisma db seed`

#### Step 6: Add First Admin Email

Before anyone can register, you need to add their email to the allowlist:

```bash
# In Railway shell
npx prisma studio
```

Prisma Studio opens in browser. Create one record in the `AllowedEmail` table with your email address.

#### Step 7: Access Your App

Railway provides a domain like `https://argyle-quotation-generator-production.up.railway.app`

Your app is live! 🎉

---

### Option B: Deploy to Vercel (Frontend) + Railway (Database)

Use this if you want Vercel's CDN + Railway's database.

#### Step 1: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Vercel auto-detects Next.js settings
4. Add environment variables in Vercel dashboard:
   ```
   DATABASE_URL        = (Railway Postgres connection string)
   RESEND_API_KEY      = re_xxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   NEXTAUTH_SECRET     = (generate with: openssl rand -base64 32)
   ```
5. Deploy

#### Step 2: Keep Database on Railway

Follow Steps 2-3 from Option A to create a Railway Postgres database.

Copy the `DATABASE_URL` from Railway and paste it into Vercel's environment variables.

#### Step 3: Run Migrations

Since the database lives on Railway but the app deploys on Vercel, run migrations from your local machine:

```bash
cd quotation-app
# Set DATABASE_URL to your Railway Postgres URL
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npx prisma db seed
```

Or use Railway's shell (connects to the same DB).

---

### Option C: Self-Host with Docker

```bash
cd quotation-app

# Build
docker build -t quotation-app .

# Run with env vars
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e RESEND_API_KEY="re_..." \
  -e NEXTAUTH_SECRET="..." \
  quotation-app
```

---

## Post-Deployment Checklist

| Task | How |
|------|-----|
| ✅ First admin email | Add to `AllowedEmail` table via Prisma Studio |
| ✅ Test registration | Visit `/register` with allowed email |
| ✅ Create template | Go to `/templates` → New Template |
| ✅ Upload logo | In template settings, upload image |
| ✅ Add SKUs | Go to `/skus` → add your products |
| ✅ Add customers | Go to `/customers` → add buyers |
| ✅ Create quotation | Go to `/quotations/new` → select template + customer + SKUs |
| ✅ Download PDF | Click PDF button on any quotation |
| ✅ Send email | Click Email button (needs Resend API key + verified domain) |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `RESEND_API_KEY` | ✅ (for email) | From [resend.com](https://resend.com) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL |
| `NEXTAUTH_SECRET` | ✅ | Random string for session encryption |

---

## Custom Domain (Optional)

### Railway
Railway dashboard → Settings → **Custom Domain** → Add your domain → Follow DNS instructions.

### Vercel
Vercel dashboard → Project → Settings → **Domains** → Add domain → Follow DNS instructions.

Update `NEXT_PUBLIC_APP_URL` to your custom domain after setup.

---

## Troubleshooting

**Build fails on Railway?**
- Check Node.js version: Railway uses Node 18+ by default
- Ensure `package.json` has `"build": "next build"` script

**Database connection errors?**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db?schema=public`
- Railway Postgres may require `?sslmode=require` suffix

**PDF generation fails?**
- `@react-pdf/renderer` needs a Node environment. Ensure you're not running in Edge runtime.
- Check that template has valid colors (hex format)

**Emails not sending?**
- Verify Resend API key
- With free Resend, you must verify your sending domain first
- Check Resend dashboard for delivery logs

---. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (from your Railway Postgres connection string)
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Railway domain)
   - `NEXTAUTH_SECRET`
4. Railway will auto-build with `npm run build` and start with `npm start`

### Vercel (Frontend)

1. Import the `quotation-app` folder to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
   - `DATABASE_URL` (Railway Postgres connection string)
   - `RESEND_API_KEY`
   - `NEXTAUTH_SECRET`
3. Deploy

**Option A — Full app on Railway**: Deploy everything to Railway. No Vercel needed.

**Option B — Split Vercel + Railway**: Host frontend on Vercel, API/backend on Railway.

## Templates System

### Creating a Template

1. Go to **Templates** page
2. Click **New Template**
3. Fill in:
   - **Company info**: Name, address, UEN, contact details, logo
   - **Bank details**: Account info for payment instructions
   - **Styling**: Primary/secondary colors, font, header style, table style
   - **Layout toggles**: Show/hide logo, UEN, bank details, signatures
   - **Default terms**: Delivery, payment, warranty terms
   - **Tax settings**: Currency, tax name, tax rate
4. Set as **Default** if this should be the primary template

### Template Features

| Feature | Description |
|---------|-------------|
| **Colors** | Primary, secondary, accent colors used throughout the PDF |
| **Header styles** | Standard (classic), Minimal (clean), Banner (full-width colored) |
| **Table styles** | Bordered, Minimal, Striped |
| **Font** | Helvetica, Times Roman, or Courier |
| **Currency** | Any currency code (SGD, USD, EUR, etc.) |
| **Tax name** | Customize (GST, VAT, Tax, etc.) |
| **Custom SKU pricing** | Override SKU prices per template |

### Duplicating Templates

Click **Duplicate** on any template to create a copy. Useful for:
- Creating seasonal variants
- Testing new styling
- Setting up different brands under the same account

## Pre-loaded SKUs

The seed includes a sample solar panel catalogue:

- LONGi 54c HiMo x10 PV panel (490W)
- Huawei SUN2000-12KTL-M5 Smart PV Controller (15kWp)
- MC6 plug solar cables (red & black)
- 12kW PV Roof Mounting Structure
- Installation service
- Complete PV AC Distribution Board / DC Combiner Box

## Customization

- Navigate to **Templates** page to create and manage quotation templates
- Navigate to **SKUs** page to add/remove products
- Navigate to **Customers** page to manage your customer database
- Tax rate, delivery terms, and payment terms are editable per quotation

## Authentication

- Registration is **allowlist-based**: Only pre-approved emails can sign up
- Admin can manage allowed emails at `/admin/allowed-emails`
- All app pages require authentication (middleware protected)

## Notes

- Logo is stored as base64 in the database (no external storage required)
- Each quotation is tied to a specific template — changing the template later won't affect already-generated quotations
- Template-specific SKU pricing allows different price lists for different markets or customer tiers
