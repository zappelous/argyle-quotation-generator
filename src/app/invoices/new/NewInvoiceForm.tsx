'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../../Nav'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NewInvoiceForm() {
  const router = useRouter()
  const search = useSearchParams()
  const fromQuotationId = search.get('quotationId')
  const mode = search.get('mode')

  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [templateSkus, setTemplateSkus] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [quotationId, setQuotationId] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [taxName, setTaxName] = useState('GST')
  const [currency, setCurrency] = useState('SGD')
  const [deliveryTerms, setDeliveryTerms] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [warranty, setWarranty] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [quotations, setQuotations] = useState<any[]>([])
  const [selectedQuotation, setSelectedQuotation] = useState('')
  const [originalRows, setOriginalRows] = useState<any[]>([])
  const [percentage, setPercentage] = useState(100)
  const [invoicedPct, setInvoicedPct] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/templates').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/skus').then(r => r.json()),
    ]).then(([tmplts, custs, skuList]) => {
      setTemplates(tmplts)
      setCustomers(custs)
      setSkus(skuList)
      const def = tmplts.find((t: any) => t.isDefault)
      if (def) {
        setSelectedTemplate(def.id)
        loadTemplateDefaults(def)
      }
    })

    if (mode === 'quotation' || !fromQuotationId) {
      fetch('/api/quotations').then(r => r.json()).then((qs) => {
        const available = qs.filter((q: any) =>
          (q.status === 'sent' || q.status === 'accepted')
        )
        setQuotations(available)
      })
    }
  }, [mode, fromQuotationId])

  useEffect(() => {
    if (!fromQuotationId) return
    loadQuotationData(fromQuotationId)
  }, [fromQuotationId, templates])

  const loadQuotationData = (qid: string) => {
    Promise.all([
      fetch(`/api/quotations?id=${qid}`).then(r => r.json()),
      fetch(`/api/invoices?quotationId=${qid}`).then(r => r.json()),
    ]).then(([q, invs]) => {
      setQuotationId(q.id)
      setSelectedTemplate(q.templateId)
      setCustomerId(q.customerId)
      setTaxRate(Number(q.taxRate))
      setTaxName(q.template?.taxName || 'GST')
      setCurrency(q.template?.currency || 'SGD')
      setDeliveryTerms(q.deliveryTerms || '')
      setPaymentTerms(q.paymentTerms || '')
      setWarranty(q.warranty || '')

      const orig = q.items.map((it: any) => ({
        skuId: it.skuId,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        displayName: it.displayName,
        description: it.description || '',
      }))
      setOriginalRows(orig)

      // Calculate already-invoiced percentage
      const totalInvoiced = invs.reduce((sum: number, inv: any) => sum + Number(inv.total), 0)
      const pct = q.total > 0 ? Math.round((totalInvoiced / Number(q.total)) * 100) : 0
      setInvoicedPct(pct)

      // Default to remaining percentage
      const remaining = Math.max(0, 100 - pct)
      setPercentage(remaining)
      applyPercentage(orig, remaining)
    })
  }

  const applyPercentage = (orig: any[], pct: number) => {
    const factor = pct / 100
    setRows(orig.map(r => ({
      ...r,
      unitPrice: Number((r.unitPrice * factor).toFixed(2)),
    })))
  }

  useEffect(() => {
    if (originalRows.length === 0) return
    applyPercentage(originalRows, percentage)
  }, [percentage])

  const loadTemplateDefaults = (template: any) => {
    setTaxRate(Number(template.taxRate || 0))
    setTaxName(template.taxName || 'GST')
    setCurrency(template.currency || 'SGD')
    setDeliveryTerms(template.defaultDeliveryTerms || '')
    setPaymentTerms(template.defaultPaymentTerms || '')
    setWarranty(template.defaultWarranty || '')
    setTemplateSkus(template.skus || [])
  }

  const handleQuotationSelect = (qid: string) => {
    setSelectedQuotation(qid)
    if (qid) {
      loadQuotationData(qid)
    } else {
      setQuotationId('')
      setRows([])
    }
  }

  const getSkuPrice = (skuId: string) => {
    const templateSku = templateSkus.find((ts: any) => ts.skuId === skuId)
    if (templateSku?.customPrice) return Number(templateSku.customPrice)
    const sku = skus.find(s => s.id === skuId)
    return sku ? Number(sku.unitPrice) : 0
  }

  const getSkuName = (skuId: string) => {
    const templateSku = templateSkus.find((ts: any) => ts.skuId === skuId)
    if (templateSku?.customName) return templateSku.customName
    const sku = skus.find(s => s.id === skuId)
    return sku ? sku.name : ''
  }

  const addRow = () => {
    setRows([...rows, { skuId: '', quantity: 1, unitPrice: 0, displayName: '', description: '' }])
  }

  const updateRow = (idx: number, patch: any) => {
    const next = [...rows]
    next[idx] = { ...next[idx], ...patch }
    if (patch.skuId) {
      next[idx].unitPrice = getSkuPrice(patch.skuId)
      next[idx].displayName = getSkuName(patch.skuId)
      const sku = skus.find(s => s.id === patch.skuId)
      next[idx].description = sku?.description || ''
    }
    setRows(next)
  }

  const removeRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx))
  }

  const subtotal = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return alert('Select a template')
    if (!customerId) return alert('Select a customer')
    if (rows.length === 0) return alert('Add at least one SKU')

    setLoading(true)
    const payload = {
      templateId: selectedTemplate,
      customerId,
      quotationId: quotationId || undefined,
      items: rows.map(r => ({
        skuId: r.skuId,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
        amount: Number(r.quantity) * Number(r.unitPrice),
        displayName: r.displayName,
        description: r.description,
      })),
      taxRate,
      deliveryTerms,
      paymentTerms,
      warranty,
      dueDate,
      notes,
    }

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/invoices')
    } else {
      alert('Error saving invoice')
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{fromQuotationId ? 'Create Invoice from Quotation' : 'New Invoice'}</h1>

        {(mode === 'quotation' || !fromQuotationId) && quotations.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow mb-6">
            <label className="block text-sm font-medium mb-1">Convert from Quotation (optional)</label>
            <select
              value={selectedQuotation}
              onChange={e => handleQuotationSelect(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">— Start fresh (no quotation) —</option>
              {quotations.map((q: any) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNo} — {q.customer?.name} — {q.template?.currency || 'SGD'} {Number(q.total).toFixed(2)} — {new Date(q.issueDate).toLocaleDateString('en-GB')}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <select required value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); const t = templates.find(tm => tm.id === e.target.value); if (t) loadTemplateDefaults(t) }} className="w-full border rounded px-3 py-2">
                <option value="">Select template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
          </div>

          {quotationId && (
            <div className="bg-blue-50 p-4 rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-700 text-sm font-medium">Quotation Invoicing Progress</span>
                <span className="text-blue-700 text-sm font-bold">{invoicedPct}% already invoiced</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${invoicedPct}%` }}></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Invoice Percentage (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100 - invoicedPct}
                    value={percentage}
                    onChange={e => setPercentage(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-blue-600 mt-1">Max: {100 - invoicedPct}% remaining</p>
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-blue-700">
                    <div>This invoice: <span className="font-bold">{percentage}%</span></div>
                    <div>After this: <span className="font-bold">{invoicedPct + percentage}%</span> total invoiced</div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    <select required value={row.skuId} onChange={e => updateRow(idx, { skuId: e.target.value })} className="w-full border rounded px-2 py-1 text-sm">
                      <option value="">Select...</option>
                      {skus.map(s => <option key={s.id} value={s.id}>{s.code} — {getSkuName(s.id)}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">Qty</label>
                    <input type="number" min={1} value={row.quantity} onChange={e => updateRow(idx, { quantity: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500">Unit Price</label>
                    <input type="number" step="0.01" value={row.unitPrice} onChange={e => updateRow(idx, { unitPrice: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-slate-500">Amount</label>
                    <div className="text-sm py-1">{currency} {(row.quantity * row.unitPrice).toFixed(2)}</div>
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
              <label className="block text-sm font-medium mb-1">{taxName} Rate (%)</label>
              <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border rounded px-3 py-2" />
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

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" placeholder="Internal notes (not shown on PDF)" />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-lg">
              <div className="text-slate-600">Subtotal: <span className="font-medium">{currency} {subtotal.toFixed(2)}</span></div>
              <div className="text-slate-600">{taxName}: <span className="font-medium">{currency} {taxAmount.toFixed(2)}</span></div>
              <div className="text-xl font-bold mt-1">Total: {currency} {total.toFixed(2)}</div>
            </div>
            <button disabled={loading} className="bg-slate-900 text-white px-6 py-3 rounded hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
