import { NextResponse } from 'next/server'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { QuotationPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }
  const resend = new Resend(apiKey)

  const { quotationId, to, subject, message } = await req.json()
  if (!quotationId || !to) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

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
    React.createElement(QuotationPDF, {
      template: quotation.template,
      customer: quotation.customer,
      quotation: serializedQuotation,
      items: serializedQuotation.items,
    }) as any
  )

  try {
    await resend.emails.send({
      from: quotation.template.companyEmail,
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
