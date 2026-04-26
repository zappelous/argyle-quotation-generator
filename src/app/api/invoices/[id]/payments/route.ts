import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { amount, paymentDate, paymentMethod, referenceNo, notes } = body

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: id,
      amount: Number(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      referenceNo,
      notes,
    },
  })

  // Recalculate invoice balance
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  })

  if (invoice) {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceDue = Number(invoice.total) - totalPaid
    const newStatus = balanceDue <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : invoice.status

    await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: totalPaid,
        balanceDue: Math.max(0, balanceDue),
        status: newStatus,
      },
    })
  }

  return NextResponse.json(payment, { status: 201 })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 })

  await prisma.payment.delete({ where: { id: paymentId } })

  // Recalculate invoice balance
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  })

  if (invoice) {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceDue = Number(invoice.total) - totalPaid
    const newStatus = balanceDue <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'sent'

    await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: totalPaid,
        balanceDue: Math.max(0, balanceDue),
        status: newStatus,
      },
    })
  }

  return NextResponse.json({ success: true })
}
