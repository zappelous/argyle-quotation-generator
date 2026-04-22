'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface SKU {
  id: string
  code: string
  name: string
  description: string | null
  model: string | null
  performance: string | null
  unitPrice: number
}

export default function SKUsPage() {
  const [skus, setSkus] = useState<SKU[]>([])
  const [form, setForm] = useState({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSKUs()
  }, [])

  const loadSKUs = () => {
    fetch('/api/skus').then(r => r.json()).then(setSkus)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/skus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unitPrice: Number(form.unitPrice) }),
    })
    setLoading(false)
    if (res.ok) {
      setForm({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })
      loadSKUs()
    }
  }

  const startEdit = (sku: SKU) => {
    setEditingId(sku.id)
    setEditForm({
      code: sku.code,
      name: sku.name,
      description: sku.description || '',
      model: sku.model || '',
      performance: sku.performance || '',
      unitPrice: String(sku.unitPrice),
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ code: '', name: '', description: '', model: '', performance: '', unitPrice: '' })
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    const res = await fetch('/api/skus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, id, unitPrice: Number(editForm.unitPrice) }),
    })
    setLoading(false)
    if (res.ok) {
      setEditingId(null)
      loadSKUs()
    }
  }

  const deleteSKU = async (id: string) => {
    if (!confirm('Delete this SKU? This cannot be undone.')) return
    setLoading(true)
    await fetch('/api/skus', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(false)
    loadSKUs()
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
          <button disabled={loading} className="bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800 disabled:opacity-50">{loading ? 'Adding...' : 'Add SKU'}</button>
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
                <th className="px-4 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skus.map(s => (
                <tr key={s.id} className="border-t">
                  {editingId === s.id ? (
                    <>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.model} onChange={e => setEditForm({ ...editForm, model: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.performance} onChange={e => setEditForm({ ...editForm, performance: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm text-right" type="number" step="0.01" value={editForm.unitPrice} onChange={e => setEditForm({ ...editForm, unitPrice: e.target.value })} /></td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => saveEdit(s.id)} disabled={loading} className="p-1 rounded hover:bg-green-100 text-green-600" title="Save"><Check size={16} /></button>
                          <button onClick={cancelEdit} className="p-1 rounded hover:bg-red-100 text-red-600" title="Cancel"><X size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{s.code}</td>
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2">{s.model}</td>
                      <td className="px-4 py-2">{s.performance}</td>
                      <td className="px-4 py-2 text-right">SGD {Number(s.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => startEdit(s)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => deleteSKU(s.id)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {skus.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No SKUs yet. Add your first one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
