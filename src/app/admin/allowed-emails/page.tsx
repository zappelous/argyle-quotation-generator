'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../../Nav'

export default function AllowedEmailsPage() {
  const [emails, setEmails] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = () => {
    fetch('/api/auth/allowed-emails').then(r => r.json()).then(setEmails)
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/allowed-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })
    if (res.ok) {
      setNewEmail('')
      load()
    } else {
      alert('Failed to add email')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this email?')) return
    await fetch(`/api/auth/allowed-emails?id=${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Allowed Emails</h1>

        <form onSubmit={add} className="bg-white p-4 rounded-xl shadow mb-6 flex gap-2">
          <input
            type="email"
            required
            placeholder="Add authorized email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button className="bg-slate-900 text-white rounded px-4 py-2 hover:bg-slate-800">Add</button>
        </form>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Added</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {emails.map(e => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-2">{e.email}</td>
                  <td className="px-4 py-2">{new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => remove(e.id)} className="text-red-600 hover:underline">Remove</button>
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
