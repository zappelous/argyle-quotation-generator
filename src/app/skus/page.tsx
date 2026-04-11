'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'

export default function SKUsPage() {
  const [skus, setSkus] = useState<any[]>([])
  const [form, setForm] = useState({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })

  useEffect(() => {
    fetch('/api/skus').then(r => r.json()).then(setSkus)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/skus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice) }),
    })
    if (res.ok) {
      setForm({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })
      fetch('/api/skus').then(r => r.json()).then(setSkus)
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">SKUs</h1>
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="SKU Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="border rounded px-3 py-2" />
          <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Performance" value={form.performance} onChange={e => setForm({ ...form, performance: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="number" step="0.01" placeholder="Unit Price (SGD)" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" />
          <button className="bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800">Add SKU</button>
        </form>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Model</th>
                <th className="px-4 py-2 text-left">Performance</th>
                <th className="px-4 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {skus.map(s => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.code}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.model}</td>
                  <td className="px-4 py-2">{s.performance}</td>
                  <td className="px-4 py-2 text-right">SGD {Number(s.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
