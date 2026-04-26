import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  const fromDate = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
  const toDate = endDate ? new Date(endDate) : new Date()

  // Fetch quotations in period
  const quotations = await prisma.quotation.findMany({
    where: {
      customerId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true },
    orderBy: { issueDate: 'asc' },
  })

  // Fetch invoices in period
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: { items: true, payments: true },
    orderBy: { issueDate: 'asc' },
  })

  // Fetch all payments in period
  const payments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: fromDate, lte: toDate },
      invoice: { customerId },
    },
    include: { invoice: true },
    orderBy: { paymentDate: 'asc' },
  })

  // Build transactions list (quotations first, then invoices, then payments)
  let balance = 0
  const transactions: any[] = []

  // Quotations - show as debit if accepted
  for (const q of quotations) {
    const isAccepted = q.status === 'accepted'
    const amount = isAccepted ? Number(q.total) : 0
    if (isAccepted) balance += amount
    transactions.push({
      date: q.issueDate.toISOString(),
      type: 'quotation',
      docNo: q.quotationNo,
      description: isAccepted
        ? `Quotation (Accepted) — ${q.items.length} item(s)`
        : `Quotation — ${q.status}`,
      debit: amount,
      credit: 0,
      balance,
    })
  }

  // Invoices (increase balance)
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

  // Payments (decrease balance)
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

  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Recalculate running balances after sort
  let runningBalance = 0
  for (const tx of transactions) {
    if (tx.type === 'invoice') runningBalance += tx.debit
    if (tx.type === 'payment') runningBalance -= tx.credit
    tx.balance = runningBalance
  }

  // Get opening balance (all invoices before period minus all payments before period)
  const priorInvoices = await prisma.invoice.findMany({
    where: {
      customerId,
      createdAt: { lt: fromDate },
    },
  })
  const priorPayments = await prisma.payment.findMany({
    where: {
      paymentDate: { lt: fromDate },
      invoice: { customerId },
    },
  })
  const openingBalance = priorInvoices.reduce((s, i) => s + Number(i.total), 0) -
    priorPayments.reduce((s, p) => s + Number(p.amount), 0)

  const closingBalance = openingBalance + runningBalance

  return NextResponse.json({
    customer,
    periodStart: fromDate.toISOString(),
    periodEnd: toDate.toISOString(),
    openingBalance,
    closingBalance,
    transactions,
    summary: {
      totalQuotations: quotations.length,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
      totalInvoiced: invoices.reduce((s, i) => s + Number(i.total), 0),
      totalPaid: payments.reduce((s, p) => s + Number(p.amount), 0),
    },
  })
}
