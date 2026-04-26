'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-purple-100 text-purple-700',
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    fetch('/api/quotations').then(r => r.json()).then(setQuotations)
  }

  const downloadPdf = async (id: string) => {
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotationId: id }),
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${id}.pdf`
    a.click()
  }

  const sendEmail = async (q: any) => {
    setSendingId(q.id)
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: q.id,
        to: q.customer.email,
        subject: `Quotation ${q.quotationNo}`,
        message: `Dear ${q.customer.name},\n\nPlease find attached our quotation.\n\nBest regards,\n${q.template?.companyName || 'Our Team'}`,
      }),
    })
    setSendingId(null)
    if (res.ok) {
      alert('Email sent')
      // Mark as sent if it was draft
      if (q.status === 'draft') {
        await fetch(`/api/quotations?id=${q.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...q, status: 'sent' }),
        })
        load()
      }
    }
    else alert('Failed to send email')
  }

  const markAccepted = async (q: any) => {
    await fetch(`/api/quotations?id=${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...q, status: 'accepted' }),
    })
    load()
  }

  const deleteQ = async (id: string) => {
    if (!confirm('Delete this quotation?')) return
    await fetch(`/api/quotations?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quotations</h1>
          <Link href="/quotations/new" className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">New Quotation</Link>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Quotation No</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-center">Status</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} className="border-t">
                  <td className="px-4 py-2">{q.quotationNo}</td>
                  <td className="px-4 py-2">{q.customer?.name}</td>
                  <td className="px-4 py-2">{new Date(q.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">{q.template?.currency || 'SGD'} {Number(q.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[q.status] || 'bg-slate-200'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Link href={`/quotations/edit?id=${q.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                      <button onClick={() => downloadPdf(q.id)} className="text-slate-700 hover:underline text-xs">PDF</button>
                      <button onClick={() => sendEmail(q)} disabled={sendingId === q.id} className="text-slate-700 hover:underline text-xs">
                        {sendingId === q.id ? 'Sending...' : 'Email'}
                      </button>
                      {q.status === 'sent' && (
                        <button onClick={() => markAccepted(q)} className="text-purple-600 hover:underline text-xs">Accept</button>
                      )}
                      {(q.status === 'accepted' || q.status === 'sent') && (
                        <Link href={`/invoices/new?quotationId=${q.id}`} className="text-green-600 hover:underline text-xs font-medium">→ Invoice</Link>
                      )}
                      <button onClick={() => deleteQ(q.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
