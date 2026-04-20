import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { templateId, skuId, customPrice, customName, isActive } = await req.json()
  
  const assignment = await prisma.templateSKU.upsert({
    where: {
      templateId_skuId: {
        templateId,
        skuId
      }
    },
    update: {
      customPrice: customPrice ? parseFloat(customPrice) : null,
      customName,
      isActive: isActive !== undefined ? isActive : true
    },
    create: {
      templateId,
      skuId,
      customPrice: customPrice ? parseFloat(customPrice) : null,
      customName,
      isActive: isActive !== undefined ? isActive : true
    }
  })
  
  return NextResponse.json(assignment, { status: 201 })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  
  await prisma.templateSKU.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
