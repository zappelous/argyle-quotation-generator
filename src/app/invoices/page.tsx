'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    fetch('/api/invoices').then(r => r.json()).then(setInvoices)
  }

  const downloadPdf = async (id: string) => {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: id }),
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${id}.pdf`
    a.click()
  }

  const sendEmail = async (inv: any) => {
    setSendingId(inv.id)
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: inv.id,
        to: inv.customer.email,
        subject: `Invoice ${inv.invoiceNo}`,
        message: `Dear ${inv.customer.name},\n\nPlease find attached our invoice.\n\n${inv.balanceDue > 0 ? `Amount due: SGD ${Number(inv.balanceDue).toFixed(2)}\n` : ''}\nBest regards,\n${inv.template?.companyName || 'Our Team'}`,
      }),
    })
    setSendingId(null)
    if (res.ok) {
      alert('Email sent')
      // Update status to sent if draft
      if (inv.status === 'draft') {
        await fetch(`/api/invoices?id=${inv.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...inv, status: 'sent' }),
        })
        load()
      }
    } else alert('Failed to send email')
  }

  const archiveInv = async (id: string) => {
    if (!confirm('Archive this invoice? It will be hidden from normal views but can be restored by an admin.')) return
    await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <div className="flex gap-2">
            <Link href="/archive?type=invoices" className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2">View Archive</Link>
            <Link href="/invoices/new?mode=quotation" className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 text-sm">
              From Quotation
            </Link>
            <Link href="/invoices/new" className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">
              New Invoice
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Invoice No</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Issue Date</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Paid</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{inv.invoiceNo}</td>
                  <td className="px-4 py-2">{inv.customer?.name}</td>
                  <td className="px-4 py-2">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">{inv.template?.currency || 'SGD'} {Number(inv.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-green-600">{Number(inv.amountPaid).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium">{Number(inv.balanceDue).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[inv.status] || 'bg-slate-200'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Link href={`/invoices/edit?id=${inv.id}`} className="text-blue-600 hover:underline text-xs">Edit / Pay</Link>
                      <button onClick={() => downloadPdf(inv.id)} className="text-slate-700 hover:underline text-xs">PDF</button>
                      <button onClick={() => sendEmail(inv)} disabled={sendingId === inv.id} className="text-slate-700 hover:underline text-xs">
                        {sendingId === inv.id ? 'Sending...' : 'Email'}
                      </button>
                      <button onClick={() => archiveInv(inv.id)} className="text-red-600 hover:underline text-xs">Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No invoices yet. <Link href="/invoices/new" className="text-blue-600 underline">Create one</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
