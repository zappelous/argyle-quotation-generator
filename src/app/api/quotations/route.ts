import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const id = searchParams.get('id')
  const archived = searchParams.get('archived') === 'true'

  if (id) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        template: true,
        customer: true,
        items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
      },
    })
    return NextResponse.json(quotation)
  }

  const where: any = customerId ? { customerId } : {}
  if (!archived) {
    where.deletedAt = null
  } else {
    const admin = await isAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    where.deletedAt = { not: null }
  }

  const quotations = await prisma.quotation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      template: true,
      _count: { select: { items: true } },
    },
  })
  return NextResponse.json(quotations)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    templateId,
    customerId,
    items,
    taxRate,
    deliveryTerms,
    paymentTerms,
    warranty,
    dispatchDate,
    notes,
  } = body

  const quotationNo = `INV-${Date.now()}`

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
  const total = subtotal + taxAmount

  const quotation = await prisma.quotation.create({
    data: {
      quotationNo,
      templateId,
      customerId,
      subtotal,
      taxRate: Number(taxRate || 0),
      taxAmount,
      total,
      deliveryTerms,
      paymentTerms,
      warranty,
      dispatchDate,
      notes,
      items: { create: lineItems },
    },
    include: {
      template: true,
      customer: true,
      items: { include: { sku: true } },
    },
  })

  return NextResponse.json(quotation, { status: 201 })
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
    dispatchDate,
    status,
    notes,
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
  const total = subtotal + taxAmount

  await prisma.quotationItem.deleteMany({ where: { quotationId: id } })

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      templateId,
      customerId,
      subtotal,
      taxRate: Number(taxRate || 0),
      taxAmount,
      total,
      deliveryTerms,
      paymentTerms,
      warranty,
      dispatchDate,
      notes,
      status: status || 'draft',
      items: { create: lineItems },
    },
    include: {
      template: true,
      customer: true,
      items: { include: { sku: true } },
    },
  })

  return NextResponse.json(quotation)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Soft delete
  await prisma.quotation.update({
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

  const restored = await prisma.quotation.update({
    where: { id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ success: true, restored })
}
