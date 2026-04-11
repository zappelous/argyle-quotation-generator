'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', uen: '' })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: '', email: '', phone: '', address: '', uen: '' })
      fetch('/api/customers').then(r => r.json()).then(setCustomers)
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Customers</h1>
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Customer Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="UEN / NIPC" value={form.uen} onChange={e => setForm({ ...form, uen: e.target.value })} className="border rounded px-3 py-2" />
          <input required placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" />
          <button className="bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800 md:col-span-2">Add Customer</button>
        </form>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-left">Quotations</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">{c._count?.quotations || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
