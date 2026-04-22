import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { quotations: true } } },
  })
  return NextResponse.json(customers)
}

export async function POST(req: Request) {
  const body = await req.json()
  const customer = await prisma.customer.create({ data: body })
  return NextResponse.json(customer, { status: 201 })
}

export async function PUT(req: Request) {
  const { id, ...data } = await req.json()
  const customer = await prisma.customer.update({
    where: { id },
    data,
  })
  return NextResponse.json(customer)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
