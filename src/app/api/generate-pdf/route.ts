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
      company: true,
      customer: true,
      items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
    },
  })

  if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const buffer = await renderToBuffer(
    QuotationPDF({
      company: quotation.company,
      customer: quotation.customer,
      quotation,
      items: quotation.items,
    })
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotation.quotationNo}.pdf"`,
    },
  })
}
