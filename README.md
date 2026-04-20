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

## Deployment

### Railway (Backend + Database)

1. Create a **PostgreSQL** database on Railway
2. Create a **New Project** → Deploy from GitHub repo
3. Add environment variables in Railway dashboard:
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
