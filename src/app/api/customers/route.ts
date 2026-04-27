import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'

  const where: any = {}
  if (!archived) {
    where.deletedAt = null
  } else {
    const admin = await isAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    where.deletedAt = { not: null }
  }

  const customers = await prisma.customer.findMany({
    where,
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
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Soft delete
  await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
  return NextResponse.json({ success: true, archived: true })
}

export async function PATCH(req: Request) {
  const { id, action } = await req.json()
  if (!id || action !== 'restore') {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
  }

  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const restored = await prisma.customer.update({
    where: { id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ success: true, restored })
}
