import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const id = searchParams.get('id')
  const archived = searchParams.get('archived') === 'true'

  if (id) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        template: true,
        customer: true,
        quotation: { include: { items: { include: { sku: true } } } },
        items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })
    return NextResponse.json(invoice)
  }

  const where: any = customerId ? { customerId } : {}
  if (!archived) {
    where.deletedAt = null
  } else {
    const admin = await isAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    where.deletedAt = { not: null }
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      template: true,
      quotation: true,
      _count: { select: { items: true, payments: true } },
    },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    templateId,
    customerId,
    quotationId,
    items,
    taxRate,
    deliveryTerms,
    paymentTerms,
    warranty,
    dueDate,
    notes,
    milestone,
    milestonePct,
  } = body

  const invoiceNo = `INV-${Date.now()}`

  let subtotal = 0
  const lineItems = items.map((it: any, idx: number) => {
    const amt = Number(it.unitPrice) * Number(it.quantity)
    subtotal += amt
    return {
      skuId: it.skuId,
      quantity: Number(it.quantity),
      unitPrice: it.unitPrice,
      amount: amt,
      description: it.description,
      displayName: it.displayName,
      lineNo: idx + 1,
    }
  })

  const taxAmount = subtotal * (Number(taxRate || 0) / 100)
  const fullTotal = subtotal + taxAmount
  
  // For milestone invoices, the total is a percentage of the full total
  const pct = Number(milestonePct || 100)
  const total = fullTotal * (pct / 100)

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      templateId,
      customerId,
      quotationId: quotationId || null,
      subtotal,
      taxRate: Number(taxRate || 0),
      taxAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      deliveryTerms,
      paymentTerms,
      warranty,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      milestone,
      milestonePct: pct,
      status: 'draft',
      items: { create: lineItems },
    },
    include: {
      template: true,
      customer: true,
      quotation: true,
      items: { include: { sku: true } },
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const body = await req.json()
  const {
    templateId,
    customerId,
    items,
    taxRate,
    deliveryTerms,
    paymentTerms,
    warranty,
    dueDate,
    notes,
    status,
    milestone,
    milestonePct,
  } = body

  let subtotal = 0
  const lineItems = items.map((it: any, idx: number) => {
    const amt = Number(it.unitPrice) * Number(it.quantity)
    subtotal += amt
    return {
      skuId: it.skuId,
      quantity: Number(it.quantity),
      unitPrice: it.unitPrice,
      amount: amt,
      description: it.description,
      displayName: it.displayName,
      lineNo: idx + 1,
    }
  })

  const taxAmount = subtotal * (Number(taxRate || 0) / 100)
  const fullTotal = subtotal + taxAmount
  const pct = Number(milestonePct || 100)
  const total = fullTotal * (pct / 100)

  // Recalculate balance due based on existing payments
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  })
  const amountPaid = existing?.payments.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const balanceDue = total - amountPaid
  const newStatus = balanceDue <= 0 ? 'paid' : amountPaid > 0 ? 'partial' : (status || existing?.status || 'draft')

  await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } })

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      templateId,
      customerId,
      subtotal,
      taxRate: Number(taxRate || 0),
      taxAmount,
      total,
      amountPaid,
      balanceDue,
      deliveryTerms,
      paymentTerms,
      warranty,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
      status: newStatus,
      milestone,
      milestonePct: pct,
      items: { create: lineItems },
    },
    include: {
      template: true,
      customer: true,
      quotation: true,
      items: { include: { sku: true } },
      payments: true,
    },
  })

  return NextResponse.json(invoice)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ success: true, archived: true })
}

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')
  if (!id || action !== 'restore') {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
  }

  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const restored = await prisma.invoice.update({
    where: { id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ success: true, restored })
}
