import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { QuotationPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { quotationId, to, subject, message } = await req.json()
  if (!quotationId || !to) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

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

  try {
    await resend.emails.send({
      from: quotation.company.email,
      to,
      subject: subject || `Quotation ${quotation.quotationNo}`,
      text: message || `Please find attached quotation ${quotation.quotationNo}.`,
      attachments: [
        {
          filename: `${quotation.quotationNo}.pdf`,
          content: Buffer.from(buffer).toString('base64'),
        },
      ],
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
