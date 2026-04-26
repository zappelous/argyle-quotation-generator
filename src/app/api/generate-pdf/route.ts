import { NextResponse } from 'next/server'
import React from 'react'
import { prisma } from '@/lib/prisma'
import { QuotationPDF, InvoicePDF, StatementPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'

export async function POST(req: Request) {
  const { quotationId, invoiceId, statementData } = await req.json()

  // ── Generate Statement PDF ──────────────────────────────────────
  if (statementData) {
    const { customerId, periodStart, periodEnd } = statementData
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Fetch default template
    const template = await prisma.template.findFirst({ where: { isDefault: true } })
    if (!template) return NextResponse.json({ error: 'No default template' }, { status: 404 })

    const fromDate = new Date(periodStart)
    const toDate = new Date(periodEnd)

    // Get all invoices and payments for the period
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

    const serializedTemplate = {
      ...template,
      bankCurrency: template.bankCurrency,
    }

    const buffer = await renderToBuffer(
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

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SOA-${customer.name}-${periodStart}.pdf"`,
      },
    })
  }

  // ── Generate Invoice PDF ────────────────────────────────────────
  if (invoiceId) {
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
      items: invoice.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        sku: item.sku ? {
          ...item.sku,
          unitPrice: Number(item.sku.unitPrice),
        } : null,
      })),
      payments: invoice.payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        paymentDate: p.paymentDate.toISOString(),
      })),
    }

    const serializedTemplate = {
      ...invoice.template,
      bankCurrency: invoice.template.bankCurrency,
    }

    const buffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        template: serializedTemplate,
        customer: invoice.customer,
        invoice: serializedInvoice,
        items: serializedInvoice.items,
        payments: serializedInvoice.payments,
      }) as any
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNo}.pdf"`,
      },
    })
  }

  // ── Generate Quotation PDF ──────────────────────────────────────
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

  const serializedTemplate = {
    ...quotation.template,
    bankCurrency: quotation.template.bankCurrency,
  }

  const buffer = await renderToBuffer(
    React.createElement(QuotationPDF, {
      template: serializedTemplate,
      customer: quotation.customer,
      quotation: serializedQuotation,
      items: serializedQuotation.items,
    }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quotation.quotationNo}.pdf"`,
    },
  })
}
