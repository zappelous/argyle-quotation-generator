import { NextResponse } from 'next/server'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { QuotationPDF, InvoicePDF, StatementPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }
  const resend = new Resend(apiKey)

  const { quotationId, invoiceId, statementData, to, subject, message } = await req.json()
  if (!to) {
    return NextResponse.json({ error: 'Missing recipient email' }, { status: 400 })
  }

  let buffer: Buffer
  let filename: string
  let fromEmail: string

  // ── Email Statement ─────────────────────────────────────────────
  if (statementData) {
    const { customerId, periodStart, periodEnd } = statementData
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const template = await prisma.template.findFirst({ where: { isDefault: true } })
    if (!template) return NextResponse.json({ error: 'No default template' }, { status: 404 })

    const fromDate = new Date(periodStart)
    const toDate = new Date(periodEnd)

    const invoices = await prisma.invoice.findMany({
      where: { customerId, createdAt: { gte: fromDate, lte: toDate } },
      include: { items: true },
      orderBy: { issueDate: 'asc' },
    })
    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: fromDate, lte: toDate }, invoice: { customerId } },
      include: { invoice: true },
      orderBy: { paymentDate: 'asc' },
    })

    const priorInvoices = await prisma.invoice.findMany({
      where: { customerId, createdAt: { lt: fromDate } },
    })
    const priorPayments = await prisma.payment.findMany({
      where: { paymentDate: { lt: fromDate }, invoice: { customerId } },
    })
    const openingBalance = priorInvoices.reduce((s, i) => s + Number(i.total), 0) -
      priorPayments.reduce((s, p) => s + Number(p.amount), 0)

    let balance = openingBalance
    const transactions: any[] = []

    for (const inv of invoices) {
      balance += Number(inv.total)
      transactions.push({
        date: inv.issueDate.toISOString(),
        type: 'invoice',
        docNo: inv.invoiceNo,
        description: `Invoice — ${inv.items.length} item(s)`,
        debit: Number(inv.total),
        credit: 0,
        balance,
      })
    }
    for (const p of payments) {
      balance -= Number(p.amount)
      transactions.push({
        date: p.paymentDate.toISOString(),
        type: 'payment',
        docNo: p.referenceNo || p.id.slice(0, 8),
        description: `Payment — ${p.paymentMethod}`,
        debit: 0,
        credit: Number(p.amount),
        balance,
      })
    }

    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let runningBalance = openingBalance
    for (const tx of transactions) {
      if (tx.type === 'invoice') runningBalance += tx.debit
      if (tx.type === 'payment') runningBalance -= tx.credit
      tx.balance = runningBalance
    }

    const serializedTemplate = { ...template, bankCurrency: template.bankCurrency }

    const buf = await renderToBuffer(
      React.createElement(StatementPDF, {
        template: serializedTemplate,
        customer,
        transactions,
        openingBalance,
        closingBalance: runningBalance,
        periodStart,
        periodEnd,
      }) as any
    )

    buffer = Buffer.from(buf)
    filename = `SOA-${customer.name}-${periodStart}.pdf`
    fromEmail = template.companyEmail
  }

  // ── Email Invoice ───────────────────────────────────────────────
  else if (invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        template: true,
        customer: true,
        items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })

    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const serializedInvoice = {
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate?.toISOString() || null,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
      milestonePct: Number(invoice.milestonePct),
      items: invoice.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        sku: item.sku ? { ...item.sku, unitPrice: Number(item.sku.unitPrice) } : null,
      })),
      payments: invoice.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
      })),
    }

    const serializedTemplate = { ...invoice.template, bankCurrency: invoice.template.bankCurrency }

    const buf = await renderToBuffer(
      React.createElement(InvoicePDF, {
        template: serializedTemplate,
        customer: invoice.customer,
        invoice: serializedInvoice,
        items: serializedInvoice.items,
        payments: serializedInvoice.payments,
      }) as any
    )

    buffer = Buffer.from(buf)
    filename = `${invoice.invoiceNo}.pdf`
    fromEmail = invoice.template.companyEmail
  }

  // ── Email Quotation ─────────────────────────────────────────────
  else if (quotationId) {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        template: true,
        customer: true,
        items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
      },
    })

    if (!quotation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
        sku: item.sku ? { ...item.sku, unitPrice: Number(item.sku.unitPrice) } : null,
      })),
    }

    const serializedTemplate = { ...quotation.template, bankCurrency: quotation.template.bankCurrency }

    const buf = await renderToBuffer(
      React.createElement(QuotationPDF, {
        template: serializedTemplate,
        customer: quotation.customer,
        quotation: serializedQuotation,
        items: serializedQuotation.items,
      }) as any
    )

    buffer = Buffer.from(buf)
    filename = `${quotation.quotationNo}.pdf`
    fromEmail = quotation.template.companyEmail
  }

  else {
    return NextResponse.json({ error: 'Missing quotationId, invoiceId, or statementData' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: subject || 'Document from QuoteFlow',
      text: message || `Please find the attached document.\n\nBest regards,\nQuoteFlow`,
      attachments: [
        {
          filename,
          content: buffer.toString('base64'),
        },
      ],
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
