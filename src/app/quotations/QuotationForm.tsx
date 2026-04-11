'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import { useRouter, useSearchParams } from 'next/navigation'

export default function QuotationFormPage() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search.get('id')

  const [company, setCompany] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [gstRate, setGstRate] = useState(0)
  const [deliveryTerms, setDeliveryTerms] = useState('DDP')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [warranty, setWarranty] = useState('')
  const [dispatchDate, setDispatchDate] = useState('15-30days')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/company').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/skus').then(r => r.json()),
    ]).then(([comp, custs, skuList]) => {
      setCompany(comp)
      setCustomers(custs)
      setSkus(skuList)
    })
  }, [])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/quotations?id=${editId}`)
      .then(r => r.json())
      .then((q) => {
        setCustomerId(q.customerId)
        setGstRate(Number(q.gstRate))
        setDeliveryTerms(q.deliveryTerms || 'DDP')
        setPaymentTerms(q.paymentTerms || '')
        setWarranty(q.warranty || '')
        setDispatchDate(q.dispatchDate || '15-30days')
        setRows(q.items.map((it: any) => ({
          id: it.id,
          skuId: it.skuId,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          displayName: it.displayName,
          description: it.description || '',
        })))
      })
  }, [editId])

  const addRow = () => {
    setRows([...rows, { skuId: '', quantity: 1, unitPrice: 0, displayName: '', description: '' }])
  }

  const updateRow = (idx: number, patch: any) => {
    const next = [...rows]
    next[idx] = { ...next[idx], ...patch }
    if (patch.skuId) {
      const sku = skus.find(s => s.id === patch.skuId)
      if (sku) {
        next[idx].unitPrice = Number(sku.unitPrice)
        next[idx].displayName = sku.name
        next[idx].description = sku.description || ''
      }
    }
    setRows(next)
  }

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx))
  }

  const subtotal = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0)
  const gstAmount = subtotal * (gstRate / 100)
  const total = subtotal + gstAmount

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) return alert('Select a customer')
    if (!company) return alert('Set up company details first')
    if (rows.length === 0) return alert('Add at least one SKU')

    setLoading(true)
    const payload = {
      companyId: company.id,
      customerId,
      items: rows.map(r => ({
        skuId: r.skuId,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
        amount: Number(r.quantity) * Number(r.unitPrice),
        displayName: r.displayName,
        description: r.description,
      })),
      gstRate,
      deliveryTerms,
      paymentTerms,
      warranty,
      dispatchDate,
    }

    const url = editId ? `/api/quotations?id=${editId}` : '/api/quotations'
    const method = editId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/quotations')
    } else {
      alert('Error saving quotation')
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit Quotation' : 'New Quotation'}</h1>

        {!company && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
            Please <a href="/company" className="underline">set up your company details</a> first.
          </div>
        )}

        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              required
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Line Items</label>
              <button type="button" onClick={addRow} className="text-sm bg-slate-100 px-3 py-1 rounded hover:bg-slate-200">+ Add SKU</button>
            </div>
            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-3 rounded">
                  <div className="col-span-4">
                    <label className="text-xs text-slate-500">SKU</label>
                    <select
                      required
                      value={row.skuId}
                      onChange={e => updateRow(idx, { skuId: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    >
                      <option value="">Select...</option>
                      {skus.map(s => (
                        <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={e => updateRow(idx, { quantity: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={e => updateRow(idx, { unitPrice: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-slate-500">Amount</label>
                    <div className="text-sm py-1">SGD {(row.quantity * row.unitPrice).toFixed(2)}</div>
                  </div>
                  <div className="col-span-1">
                    <button type="button" onClick={() => removeRow(idx)} className="text-red-600 text-sm">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Delivery Terms</label>
              <input value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
              <input type="number" value={gstRate} onChange={e => setGstRate(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dispatch Date</label>
              <input value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Terms</label>
            <textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} rows={3} className="w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Warranty</label>
            <textarea value={warranty} onChange={e => setWarranty(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-lg">
              <div className="text-slate-600">Subtotal: <span className="font-medium">SGD {subtotal.toFixed(2)}</span></div>
              <div className="text-slate-600">GST: <span className="font-medium">SGD {gstAmount.toFixed(2)}</span></div>
              <div className="text-xl font-bold mt-1">Total: SGD {total.toFixed(2)}</div>
            </div>
            <button disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Saving...' : (editId ? 'Update Quotation' : 'Save Quotation')}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
