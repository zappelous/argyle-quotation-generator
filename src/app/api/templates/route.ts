import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  
  if (id) {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        skus: {
          include: { sku: true }
        },
        defaultCustomer: true,
      }
    })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    return NextResponse.json(template)
  }
  
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      defaultCustomer: true,
    }
  })
  return NextResponse.json(templates)
}

export async function POST(req: Request) {
  const body = await req.json()
  
  // If setting as default, unset others first
  if (body.isDefault) {
    await prisma.template.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    })
  }
  
  const template = await prisma.template.create({
    data: body,
    include: {
      skus: {
        include: { sku: true }
      },
      defaultCustomer: true,
    }
  })
  return NextResponse.json(template, { status: 201 })
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  
  const body = await req.json()
  
  if (body.isDefault) {
    await prisma.template.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    })
  }
  
  const template = await prisma.template.update({
    where: { id },
    data: body,
    include: {
      skus: {
        include: { sku: true }
      },
      defaultCustomer: true,
    }
  })
  return NextResponse.json(template)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  
  await prisma.template.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
