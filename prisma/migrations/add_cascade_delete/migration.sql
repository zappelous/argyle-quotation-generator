-- Drop existing foreign keys
ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS "Quotation_customerId_fkey";
ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS "QuotationItem_skuId_fkey";

-- Add cascade delete for Quotation -> Customer
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" 
  FOREIGN KEY ("customerId") REFERENCES "Customer"(id) ON DELETE CASCADE;

-- Add cascade delete for QuotationItem -> SKU
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_skuId_fkey" 
  FOREIGN KEY ("skuId") REFERENCES "SKU"(id) ON DELETE CASCADE;
