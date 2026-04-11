# Quotation Generator

A full-stack web application for generating professional quotations and proforma invoices. Built for Argyle Solar's workflow but flexible for any business.

## Features

- **SKU-based quoting**: Select SKUs, enter quantities, auto-calculate totals
- **PDF Generation**: One-click download of A4 professional quotations
- **Email Quotations**: Send PDFs directly to customers via email (Resend)
- **Customer Management**: Save customers and view their quotation history
- **Company Settings**: Upload logo, configure bank details, contact info
- **Edit & Save**: Draft, update, and re-send existing quotations

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS + TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma 7
- **PDF**: `@react-pdf/renderer`
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
```

### 3. Set up database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

The seed script includes the Argyle Solar SKU catalogue.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Railway (Backend + Database)

1. Create a **PostgreSQL** database on Railway
2. Create a **New Project** → Deploy from GitHub repo
3. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (from your Railway Postgres connection string)
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Railway domain)
4. Railway will auto-build with `npm run build` and start with `npm start`

### Vercel (Frontend)

1. Import the `quotation-app` folder to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
   - `DATABASE_URL` (Railway Postgres connection string — or keep frontend only if API routes live on Railway)
   - `RESEND_API_KEY`
3. Deploy

**Option A — Full app on Railway**: Deploy everything to Railway. No Vercel needed.

**Option B — Split Vercel + Railway**: Host frontend on Vercel, API/backend on Railway. Update frontend API calls to point to Railway backend URL.

## Pre-loaded SKUs

The seed includes Argyle Solar's standard products:

- LONGi 54c HiMo x10 PV panel (490W)
- Huawei SUN2000-12KTL-M5 Smart PV Controller (15kWp)
- MC6 plug solar cables (red & black)
- 12kW PV Roof Mounting Structure
- Installation service
- Complete PV AC Distribution Board / DC Combiner Box

## Customization

- Navigate to **Company** page to upload logo and set bank details
- Navigate to **SKUs** page to add/remove products
- GST rate, delivery terms, and payment terms are editable per quotation

## Notes

- Currency is locked to **SGD** for now
- Logo is stored as base64 in the database (no external storage required)
