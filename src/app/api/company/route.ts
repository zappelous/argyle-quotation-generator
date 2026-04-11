import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const company = await prisma.company.findFirst()
  return NextResponse.json(company)
}

export async function POST(req: Request) {
  const body = await req.json()
  const existing = await prisma.company.findFirst()
  if (existing) {
    const updated = await prisma.company.update({ where: { id: existing.id }, data: body })
    return NextResponse.json(updated)
  }
  const created = await prisma.company.create({ data: body })
  return NextResponse.json(created, { status: 201 })
}
