import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const archived = searchParams.get('archived') === 'true'
  
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
  
  const where: any = {}
  if (!archived) {
    where.deletedAt = null
  } else {
    const admin = await isAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    where.deletedAt = { not: null }
  }
  
  const templates = await prisma.template.findMany({
    where,
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
  
  // Soft delete
  await prisma.template.update({
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

  const restored = await prisma.template.update({
    where: { id },
    data: { deletedAt: null },
  })
  return NextResponse.json({ success: true, restored })
}
