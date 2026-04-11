import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const id = searchParams.get('id')

  if (id) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
        items: { include: { sku: true }, orderBy: { lineNo: 'asc' } },
      },
    })
    return NextResponse.json(quotation)
  }

  const where = customerId ? { customerId } : {}
  const quotations = await prisma.quotation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      company: true,
      _count: { select: { items: true } },
    },
  })
  return NextResponse.json(quotations)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    companyId,
    customerId,
    items,
    gstRate,
    deliveryTerms,
    paymentTerms,
    warranty,
    dispatchDate,
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

  const gstAmount = subtotal * (Number(gstRate || 0) / 100)
  const total = subtotal + gstAmount

  const quotation = await prisma.quotation.create({
    data: {
      quotationNo,
      companyId,
      customerId,
      subtotal,
      gstRate: Number(gstRate || 0),
      gstAmount,
      total,
      deliveryTerms,
      paymentTerms,
      warranty,
      dispatchDate,
      items: { create: lineItems },
    },
    include: {
      company: true,
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
    customerId,
    items,
    gstRate,
    deliveryTerms,
    paymentTerms,
    warranty,
    dispatchDate,
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

  const gstAmount = subtotal * (Number(gstRate || 0) / 100)
  const total = subtotal + gstAmount

  await prisma.quotationItem.deleteMany({ where: { quotationId: id } })

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      customerId,
      subtotal,
      gstRate: Number(gstRate || 0),
      gstAmount,
      total,
      deliveryTerms,
      paymentTerms,
      warranty,
      dispatchDate,
      items: { create: lineItems },
    },
    include: {
      company: true,
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

  await prisma.quotation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
