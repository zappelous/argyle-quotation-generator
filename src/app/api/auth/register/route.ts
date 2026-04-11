import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const allowed = await prisma.allowedEmail.findUnique({ where: { email } })
  if (!allowed) {
    return NextResponse.json({ error: 'This email is not authorized to register. Contact admin.' }, { status: 403 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0],
      password: hashed,
      role: 'user',
    },
  })

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
}
