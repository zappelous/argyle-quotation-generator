'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import Link from 'next/link'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string
  uen: string | null
  _count?: { quotations: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', uen: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', uen: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      setForm({ name: '', email: '', phone: '', address: '', uen: '' })
      loadCustomers()
    }
  }

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id)
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address,
      uen: customer.uen || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', email: '', phone: '', address: '', uen: '' })
  }

  const saveEdit = async (id: string) => {
    setLoading(true)
    const res = await fetch('/api/customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, id }),
    })
    setLoading(false)
    if (res.ok) {
      setEditingId(null)
      loadCustomers()
    }
  }

  const archiveCustomer = async (id: string) => {
    if (!confirm('Archive this customer? They will be hidden from normal views but can be restored by an admin.')) return
    setLoading(true)
    await fetch('/api/customers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(false)
    loadCustomers()
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Customers</h1>
          <Link href="/archive?type=customers" className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2">View Archive</Link>
        </div>
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Customer Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="UEN / NIPC" value={form.uen} onChange={e => setForm({ ...form, uen: e.target.value })} className="border rounded px-3 py-2" />
          <input required placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" />
          <button disabled={loading} className="bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800 disabled:opacity-50 md:col-span-2">{loading ? 'Adding...' : 'Add Customer'}</button>
        </form>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-left">Quotations</th>
                <th className="px-4 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t">
                  {editingId === c.id ? (
                    <>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></td>
                      <td className="px-2 py-2"><input className="border rounded px-2 py-1 w-full text-sm" value={editForm.uen} onChange={e => setEditForm({ ...editForm, uen: e.target.value })} /></td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => saveEdit(c.id)} disabled={loading} className="p-1 rounded hover:bg-green-100 text-green-600" title="Save"><Check size={16} /></button>
                          <button onClick={cancelEdit} className="p-1 rounded hover:bg-red-100 text-red-600" title="Cancel"><X size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2">{c.email}</td>
                      <td className="px-4 py-2">{c.phone}</td>
                      <td className="px-4 py-2">{c.address}</td>
                      <td className="px-4 py-2">{c._count?.quotations || 0}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => startEdit(c)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit"><Pencil size={16} /></button>
                          <button onClick={() => archiveCustomer(c.id)} className="p-1 rounded hover:bg-red-100 text-red-600" title="Archive"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers yet. Add your first one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
