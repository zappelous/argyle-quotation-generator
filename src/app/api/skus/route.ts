import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const skus = await prisma.sKU.findMany({ orderBy: { createdAt: 'desc' } })
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
  await prisma.sKU.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
