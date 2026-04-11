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
