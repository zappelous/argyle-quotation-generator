'use client'

import { useEffect, useState, Suspense } from 'react'
import { Nav } from '../Nav'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

const tabs = [
  { key: 'quotations', label: 'Quotations', api: '/api/quotations?archived=true' },
  { key: 'invoices', label: 'Invoices', api: '/api/invoices?archived=true' },
  { key: 'customers', label: 'Customers', api: '/api/customers?archived=true' },
  { key: 'skus', label: 'SKUs', api: '/api/skus?archived=true' },
  { key: 'templates', label: 'Templates', api: '/api/templates?archived=true' },
]

function ArchiveContent() {
  const { data: session } = useSession()
  const search = useSearchParams()
  const defaultTab = search.get('type') || 'quotations'
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const isAdmin = (session?.user as any)?.role === 'admin'

  useEffect(() => {
    if (!isAdmin) return
    loadTab(activeTab)
  }, [activeTab, isAdmin])

  const loadTab = async (tab: string) => {
    setLoading(true)
    const t = tabs.find(t => t.key === tab)
    if (!t) return
    const res = await fetch(t.api)
    if (res.ok) {
      const data = await res.json()
      setItems(data)
    } else {
      setItems([])
    }
    setLoading(false)
  }

  const restore = async (tab: string, id: string) => {
    if (!confirm('Restore this item? It will be visible again in normal views.')) return

    const tabConfig = tabs.find(t => t.key === tab)
    if (!tabConfig) return

    let url: string
    let method: string
    let body: any = undefined

    if (tab === 'customers' || tab === 'skus') {
      url = tabConfig.api.replace('?archived=true', '')
      method = 'PATCH'
      body = JSON.stringify({ id, action: 'restore' })
    } else {
      url = `${tabConfig.api.replace('?archived=true', '')}?id=${id}&action=restore`
      method = 'PATCH'
    }

    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body,
    })

    if (res.ok) {
      loadTab(activeTab)
    } else {
      alert('Failed to restore')
    }
  }

  if (!isAdmin) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center">
          <h1 className="text-xl font-bold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700">Only administrators can access the archive.</p>
        </div>
      </main>
    )
  }

  const renderTable = () => {
    switch (activeTab) {
      case 'quotations':
        return (
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr>
              <th className="px-4 py-2 text-left">Quotation No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((q: any) => (
                <tr key={q.id} className="border-t">
                  <td className="px-4 py-2">{q.quotationNo}</td>
                  <td className="px-4 py-2">{q.customer?.name}</td>
                  <td className="px-4 py-2">{new Date(q.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">{q.template?.currency || 'SGD'} {Number(q.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-200">{q.status}</span></td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => restore('quotations', q.id)} className="text-green-600 hover:underline text-xs">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'invoices':
        return (
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr>
              <th className="px-4 py-2 text-left">Invoice No</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((inv: any) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-4 py-2">{inv.invoiceNo}</td>
                  <td className="px-4 py-2">{inv.customer?.name}</td>
                  <td className="px-4 py-2">{new Date(inv.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right">{inv.template?.currency || 'SGD'} {Number(inv.total).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-200">{inv.status}</span></td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => restore('invoices', inv.id)} className="text-green-600 hover:underline text-xs">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'customers':
        return (
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.phone}</td>
                  <td className="px-4 py-2">{c.address}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => restore('customers', c.id)} className="text-green-600 hover:underline text-xs">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'skus':
        return (
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2">{s.code}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.model}</td>
                  <td className="px-4 py-2 text-right">SGD {Number(s.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => restore('skus', s.id)} className="text-green-600 hover:underline text-xs">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      case 'templates':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((t: any) => (
              <div key={t.id} className="bg-white p-4 rounded-xl shadow opacity-70">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-sm text-slate-600">{t.companyName}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  <p>{t.currency} · {t.taxName} {t.taxRate}%</p>
                </div>
                <div className="mt-4">
                  <button onClick={() => restore('templates', t.id)} className="text-green-600 bg-green-50 px-3 py-1 rounded hover:bg-green-100 text-sm">Restore</button>
                </div>
              </div>
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Archive</h1>
      <p className="text-sm text-slate-500 mb-4">
        Archived items are hidden from normal views. Only administrators can see and restore them.
      </p>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === t.key
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No archived {activeTab}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {renderTable()}
        </div>
      )}
    </main>
  )
}

export default function ArchivePage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<main className="max-w-6xl mx-auto px-4 py-8"><div className="text-center">Loading...</div></main>}>
        <ArchiveContent />
      </Suspense>
    </>
  )
}
