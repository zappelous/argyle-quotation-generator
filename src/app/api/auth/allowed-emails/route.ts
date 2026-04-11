import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const list = await prisma.allowedEmail.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  try {
    const item = await prisma.allowedEmail.create({ data: { email } })
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Email already in allowlist' }, { status: 409 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await prisma.allowedEmail.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
