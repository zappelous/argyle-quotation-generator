import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuotationPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'

export async function POST(req: Request) {
  const { quotationId } = await req.json()
  if (!quotationId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      template: true,
      customer: true,
      items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
    },
  })

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Serialize Decimal and Date values for the PDF component
  const serializedQuotation = {
    ...quotation,
    issueDate: quotation.issueDate.toISOString(),
    subtotal: Number(quotation.subtotal),
    taxRate: Number(quotation.taxRate),
    taxAmount: Number(quotation.taxAmount),
    total: Number(quotation.total),
    items: quotation.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
      sku: item.sku ? {
        ...item.sku,
        unitPrice: Number(item.sku.unitPrice),
      } : null,
    })),
  }

  const buffer = await renderToBuffer(
    <QuotationPDF
      template={quotation.template}
      customer={quotation.customer}
      quotation={serializedQuotation}
      items={serializedQuotation.items}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotation.quotationNo}.pdf"`,
    },
  })
}
