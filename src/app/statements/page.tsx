'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'

export default function StatementsPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [statement, setStatement] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  const generate = async () => {
    if (!customerId) return alert('Select a customer')
    setLoading(true)
    const res = await fetch(`/api/statements?customerId=${customerId}&startDate=${startDate}&endDate=${endDate}`)
    const data = await res.json()
    setStatement(data)
    setLoading(false)
  }

  const downloadPdf = async () => {
    if (!statement) return
    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementData: {
          customerId,
          periodStart: startDate,
          periodEnd: endDate,
        },
      }),
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOA-${statement.customer.name}-${startDate}.pdf`
    a.click()
  }

  const sendEmail = async () => {
    if (!statement) return
    setSending(true)
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementData: {
          customerId,
          periodStart: startDate,
          periodEnd: endDate,
        },
        to: statement.customer.email,
        subject: `Statement of Account — ${statement.customer.name} — ${startDate} to ${endDate}`,
        message: `Dear ${statement.customer.name},\n\nPlease find attached your statement of account for the period ${startDate} to ${endDate}.\n\nClosing Balance: SGD ${Number(statement.closingBalance).toFixed(2)}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,`,
      }),
    })
    setSending(false)
    if (res.ok) alert('Statement emailed successfully')
    else alert('Failed to send email')
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Statement of Account</h1>

        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                value={customerId}
                onChange={e => { setCustomerId(e.target.value); setStatement(null) }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-2 rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Statement'}
          </button>
        </div>

        {statement && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-slate-500">Opening Balance</div>
                <div className="text-xl font-bold">SGD {Number(statement.openingBalance).toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-slate-500">Total Invoiced</div>
                <div className="text-xl font-bold text-red-600">SGD {Number(statement.summary.totalInvoiced).toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-slate-500">Total Paid</div>
                <div className="text-xl font-bold text-green-600">SGD {Number(statement.summary.totalPaid).toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow border-2 border-slate-900">
                <div className="text-sm text-slate-500">Closing Balance</div>
                <div className="text-xl font-bold">SGD {Number(statement.closingBalance).toFixed(2)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={downloadPdf} className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600">Download PDF</button>
              <button onClick={sendEmail} disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50">
                {sending ? 'Sending...' : 'Email to Customer'}
              </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Document</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t bg-slate-50">
                    <td className="px-4 py-2">{new Date(statement.periodStart).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2 font-medium">Opening Balance</td>
                    <td className="px-4 py-2 text-right">{statement.openingBalance >= 0 ? `SGD ${Number(statement.openingBalance).toFixed(2)}` : ''}</td>
                    <td className="px-4 py-2 text-right">{statement.openingBalance < 0 ? `SGD ${Math.abs(Number(statement.openingBalance)).toFixed(2)}` : ''}</td>
                    <td className="px-4 py-2 text-right font-medium"></td>
                  </tr>
                  {statement.transactions.map((tx: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          tx.type === 'invoice' ? 'bg-red-100 text-red-700' :
                          tx.type === 'payment' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium">{tx.docNo}</td>
                      <td className="px-4 py-2">{tx.description}</td>
                      <td className="px-4 py-2 text-right text-red-600">{tx.debit > 0 ? `SGD ${Number(tx.debit).toFixed(2)}` : ''}</td>
                      <td className="px-4 py-2 text-right text-green-600">{tx.credit > 0 ? `SGD ${Number(tx.credit).toFixed(2)}` : ''}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {tx.balance > 0 ? `SGD ${Number(tx.balance).toFixed(2)} Dr` : tx.balance < 0 ? `SGD ${Math.abs(Number(tx.balance)).toFixed(2)} Cr` : 'SGD 0.00'}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-900 bg-slate-50">
                    <td className="px-4 py-2">{new Date(statement.periodEnd).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2">—</td>
                    <td className="px-4 py-2 font-bold">Closing Balance</td>
                    <td className="px-4 py-2 text-right font-bold">{statement.closingBalance > 0 ? `SGD ${Number(statement.closingBalance).toFixed(2)}` : ''}</td>
                    <td className="px-4 py-2 text-right font-bold">{statement.closingBalance <= 0 ? `SGD ${Math.abs(Number(statement.closingBalance)).toFixed(2)}` : ''}</td>
                    <td className="px-4 py-2 text-right font-bold">
                      {statement.closingBalance > 0 ? `SGD ${Number(statement.closingBalance).toFixed(2)} Dr` : statement.closingBalance < 0 ? `SGD ${Math.abs(Number(statement.closingBalance)).toFixed(2)} Cr` : 'SGD 0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
