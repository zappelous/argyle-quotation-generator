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
