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

  const skus = await prisma.sKU.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(skus)
}

export async function POST(req: Request) {
  const body = await req.json()
  const sku = await prisma.sKU.create({ data: body })
  return NextResponse.json(sku, { status: 201 })
}

export async function PUT(req: Request) {
  const { id, ...data } = await req.json()
  const sku = await prisma.sKU.update({
    where: { id },
    data: { ...data, unitPrice: Number(data.unitPrice) },
  })
  return NextResponse.json(sku)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Soft delete
  await prisma.sKU.update({
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

  const restored = await prisma.sKU.update({
    where: { id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ success: true, restored })
}
