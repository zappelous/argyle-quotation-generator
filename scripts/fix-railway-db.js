const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Railway DB');

  // Step 1: Mark failed init migration as rolled back
  const existing = await client.query(
    `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = '20260426015710_init'`
  );

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE "_prisma_migrations" SET "finished_at" = NOW(), "applied_steps_count" = 0, "rolled_back_at" = NOW() WHERE "migration_name" = '20260426015710_init'`
    );
    console.log('Marked init migration as rolled back');
  } else {
    await client.query(
      `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES (gen_random_uuid(), '', NOW(), '20260426015710_init', '', NOW(), NOW(), 0)`
    );
    console.log('Inserted init migration as rolled back');
  }

  // Step 2: Mark delta migration as applied
  const delta = await client.query(
    `SELECT * FROM "_prisma_migrations" WHERE "migration_name" = '20260426015711_add_invoices'`
  );

  if (delta.rows.length > 0) {
    await client.query(
      `UPDATE "_prisma_migrations" SET "finished_at" = NOW(), "applied_steps_count" = 1, "rolled_back_at" = NULL WHERE "migration_name" = '20260426015711_add_invoices'`
    );
    console.log('Updated delta migration as applied');
  } else {
    await client.query(
      `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES (gen_random_uuid(), '', NOW(), '20260426015711_add_invoices', '', NULL, NOW(), 1)`
    );
    console.log('Inserted delta migration as applied');
  }

  // Step 3: Add missing columns to Quotation
  await client.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft'`);
  await client.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "notes" TEXT`);
  await client.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "dispatchDate" TEXT`);
  await client.query(`ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "warranty" TEXT`);
  console.log('Added Quotation columns');

  // Step 4: Add missing columns to Template
  await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "defaultDeliveryTerms" TEXT`);
  await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "defaultPaymentTerms" TEXT`);
  await client.query(`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "defaultWarranty" TEXT`);
  console.log('Added Template columns');

  // Step 5: Create new tables
  await client.query(`CREATE TABLE IF NOT EXISTS "Invoice" (
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
  )`);
  console.log('Created Invoice table');

  await client.query(`CREATE TABLE IF NOT EXISTS "InvoiceItem" (
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
  )`);
  console.log('Created InvoiceItem table');

  await client.query(`CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'Bank Transfer',
    "referenceNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
  )`);
  console.log('Created Payment table');

  // Step 6: Unique constraint
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo")`);

  // Step 7: Check and add foreign keys
  const fks = await client.query(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'Invoice' AND constraint_type = 'FOREIGN KEY'`);
  const fkNames = fks.rows.map(r => r.constraint_name);

  if (!fkNames.includes('Invoice_customerId_fkey')) {
    await client.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log('Added Invoice→Customer FK');
  }
  if (!fkNames.includes('Invoice_templateId_fkey')) {
    await client.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    console.log('Added Invoice→Template FK');
  }
  if (!fkNames.includes('Invoice_quotationId_fkey')) {
    await client.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log('Added Invoice→Quotation FK');
  }

  const fkItem = await client.query(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'InvoiceItem' AND constraint_type = 'FOREIGN KEY'`);
  const fkItemNames = fkItem.rows.map(r => r.constraint_name);

  if (!fkItemNames.includes('InvoiceItem_invoiceId_fkey')) {
    await client.query(`ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log('Added InvoiceItem→Invoice FK');
  }
  if (!fkItemNames.includes('InvoiceItem_skuId_fkey')) {
    await client.query(`ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log('Added InvoiceItem→SKU FK');
  }

  const fkPay = await client.query(`SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'Payment' AND constraint_type = 'FOREIGN KEY'`);
  const fkPayNames = fkPay.rows.map(r => r.constraint_name);

  if (!fkPayNames.includes('Payment_invoiceId_fkey')) {
    await client.query(`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    console.log('Added Payment→Invoice FK');
  }

  // Step 8: Add indexes
  await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_quotationId_idx" ON "Invoice"("quotationId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId")`);
  await client.query(`CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId")`);
  console.log('Added indexes');

  console.log('\n✅ ALL DONE! Database is fixed.');

  await client.end();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
