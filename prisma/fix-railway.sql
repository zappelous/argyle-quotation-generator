-- Railway Production DB Fix Script
-- Run this in Railway's SQL console or via psql CLI

-- 1. Mark the failed init migration as rolled back
-- (so Prisma can proceed with new migrations)
UPDATE "_prisma_migrations" 
SET "finished_at" = NOW(),
    "applied_steps_count" = 0,
    "rolled_back_at" = NOW(),
    "migration_name" = '20260426015710_init'
WHERE "migration_name" = '20260426015710_init';

-- If the migration record doesn't exist at all, insert it as applied:
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    gen_random_uuid(),
    '',
    NOW(),
    '20260426015710_init',
    '',
    NOW(),
    NOW(),
    0
)
ON CONFLICT ("migration_name") DO UPDATE SET
    "finished_at" = NOW(),
    "rolled_back_at" = NOW(),
    "applied_steps_count" = 0;

-- 2. Check if Quotation has 'status' column — add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quotation' AND column_name = 'status'
    ) THEN
        ALTER TABLE "Quotation" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
    END IF;
END $$;

-- 3. Check if Quotation has 'notes' column — add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quotation' AND column_name = 'notes'
    ) THEN
        ALTER TABLE "Quotation" ADD COLUMN "notes" TEXT;
    END IF;
END $$;

-- 4. Check if Quotation has 'dispatchDate' column — add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quotation' AND column_name = 'dispatchDate'
    ) THEN
        ALTER TABLE "Quotation" ADD COLUMN "dispatchDate" TEXT;
    END IF;
END $$;

-- 5. Check if Quotation has 'warranty' column — add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Quotation' AND column_name = 'warranty'
    ) THEN
        ALTER TABLE "Quotation" ADD COLUMN "warranty" TEXT;
    END IF;
END $$;

-- 6. Check if Template has 'defaultDeliveryTerms' column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Template' AND column_name = 'defaultDeliveryTerms'
    ) THEN
        ALTER TABLE "Template" ADD COLUMN "defaultDeliveryTerms" TEXT;
    END IF;
END $$;

-- 7. Check if Template has 'defaultPaymentTerms' column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Template' AND column_name = 'defaultPaymentTerms'
    ) THEN
        ALTER TABLE "Template" ADD COLUMN "defaultPaymentTerms" TEXT;
    END IF;
END $$;

-- 8. Check if Template has 'defaultWarranty' column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Template' AND column_name = 'defaultWarranty'
    ) THEN
        ALTER TABLE "Template" ADD COLUMN "defaultWarranty" TEXT;
    END IF;
END $$;

-- 9. Create Invoice table (if not exists)
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "quotationId" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceDue" DECIMAL(10,2) NOT NULL,
    "deliveryTerms" TEXT,
    "paymentTerms" TEXT,
    "warranty" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- 10. Create InvoiceItem table (if not exists)
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "displayName" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- 11. Create Payment table (if not exists)
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'Bank Transfer',
    "referenceNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- 12. Create unique indexes (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");

-- 13. Add foreign keys (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Invoice_customerId_fkey' AND table_name = 'Invoice'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Invoice_templateId_fkey' AND table_name = 'Invoice'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Invoice_quotationId_fkey' AND table_name = 'Invoice'
    ) THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'InvoiceItem_invoiceId_fkey' AND table_name = 'InvoiceItem'
    ) THEN
        ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'InvoiceItem_skuId_fkey' AND table_name = 'InvoiceItem'
    ) THEN
        ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Payment_invoiceId_fkey' AND table_name = 'Payment'
    ) THEN
        ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 14. Verify and add indexes
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_quotationId_idx" ON "Invoice"("quotationId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- 15. Mark the delta migration as applied in _prisma_migrations
-- After you push the new delta migration to Railway, this record
-- will let Prisma know it's already been applied manually
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
    gen_random_uuid(),
    '',
    NOW(),
    '20260426015711_add_invoices',
    '',
    NULL,
    NOW(),
    1
)
ON CONFLICT ("migration_name") DO UPDATE SET
    "finished_at" = NOW(),
    "rolled_back_at" = NULL,
    "applied_steps_count" = 1;
