'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'

export default function CompanyPage() {
  const [company, setCompany] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/company')
      .then(r => r.json())
      .then(data => {
        setCompany(data)
        setForm(data || {})
        setLogoPreview(data?.logo || null)
      })
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setLogoPreview(result)
      setForm((prev: any) => ({ ...prev, logo: result }))
    }
    reader.readAsDataURL(file)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      alert('Company saved')
      const data = await res.json()
      setCompany(data)
    }
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Company Settings</h1>
        <form onSubmit={submit} className="bg-white p-6 rounded-xl shadow grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Company Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="UEN" value={form.uen || ''} onChange={e => setForm({ ...form, uen: e.target.value })} className="border rounded px-3 py-2" />
          <input required placeholder="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" />
          <input placeholder="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="border rounded px-3 py-2" />
          <input required type="email" placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Contact Person" value={form.contactPerson || ''} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="border rounded px-3 py-2" />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Company Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="block" />
            {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-20 object-contain border rounded" />}
          </div>

          <h3 className="md:col-span-2 text-lg font-semibold mt-2">Bank Details</h3>
          <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({ ...form, bankName: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Bank Account Number" value={form.bankAccount || ''} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="Bank Address" value={form.bankAddress || ''} onChange={e => setForm({ ...form, bankAddress: e.target.value })} className="border rounded px-3 py-2" />
          <input placeholder="SWIFT Code" value={form.swiftCode || ''} onChange={e => setForm({ ...form, swiftCode: e.target.value })} className="border rounded px-3 py-2" />

          <button className="md:col-span-2 bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800">Save Company</button>
        </form>
      </main>
    </>
  )
}
