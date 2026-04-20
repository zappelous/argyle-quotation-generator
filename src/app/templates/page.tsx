'use client'

import { useEffect, useState } from 'react'
import { Nav } from '../Nav'
import { useRouter } from 'next/navigation'

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [skus, setSkus] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [previewing, setPreviewing] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
    fetch('/api/skus').then(r => r.json()).then(setSkus)
  }, [])

  const loadTemplates = () => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(setTemplates)
  }

  const previewTemplate = async (template: any) => {
    setPreviewing(template.id)
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        setPreviewUrl(url)
      } else {
        alert('Failed to generate preview')
      }
    } catch (err) {
      alert('Preview error')
    }
    setPreviewing(null)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setLogoPreview(result)
      formSetter(result)
    }
    reader.readAsDataURL(file)
  }

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const data: any = {
      name: formData.get('name'),
      companyName: formData.get('companyName'),
      companyUen: formData.get('companyUen'),
      companyAddress: formData.get('companyAddress'),
      companyPhone: formData.get('companyPhone'),
      companyEmail: formData.get('companyEmail'),
      companyLogo: logoPreview || editing?.companyLogo || null,
      contactPerson: formData.get('contactPerson'),
      bankName: formData.get('bankName'),
      bankAccount: formData.get('bankAccount'),
      bankAddress: formData.get('bankAddress'),
      swiftCode: formData.get('swiftCode'),
      bankCurrency: formData.get('bankCurrency') || 'SGD',
      primaryColor: formData.get('primaryColor') || '#1e293b',
      secondaryColor: formData.get('secondaryColor') || '#64748b',
      accentColor: formData.get('accentColor') || '#0f172a',
      fontFamily: formData.get('fontFamily') || 'Helvetica',
      showLogo: formData.get('showLogo') === 'on',
      showUen: formData.get('showUen') === 'on',
      showBankDetails: formData.get('showBankDetails') === 'on',
      showSignatures: formData.get('showSignatures') === 'on',
      headerStyle: formData.get('headerStyle') || 'standard',
      tableStyle: formData.get('tableStyle') || 'bordered',
      currency: formData.get('currency') || 'SGD',
      taxRate: parseFloat(formData.get('taxRate') as string) || 0,
      taxName: formData.get('taxName') || 'GST',
      defaultDeliveryTerms: formData.get('defaultDeliveryTerms'),
      defaultPaymentTerms: formData.get('defaultPaymentTerms'),
      defaultWarranty: formData.get('defaultWarranty'),
      isDefault: formData.get('isDefault') === 'on',
    }

    const url = editing ? `/api/templates?id=${editing.id}` : '/api/templates'
    const method = editing ? 'PUT' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setShowForm(false)
      setEditing(null)
      setLogoPreview(null)
      loadTemplates()
    } else {
      alert('Error saving template')
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' })
    if (res.ok) loadTemplates()
  }

  const editTemplate = (t: any) => {
    setEditing(t)
    setLogoPreview(t.companyLogo)
    setShowForm(true)
  }

  const duplicateTemplate = (t: any) => {
    const dup = { ...t, id: undefined, name: `${t.name} (Copy)`, isDefault: false }
    setEditing(null)
    setLogoPreview(t.companyLogo)
    setShowForm(true)
    // Pre-fill will happen via the form default values
  }

  const assignSKUs = async (templateId: string, skuId: string, customPrice?: number, customName?: string) => {
    await fetch('/api/templates/skus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, skuId, customPrice, customName }),
    })
    loadTemplates()
  }

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Templates</h1>
          <button
            onClick={() => { setShowForm(true); setEditing(null); setLogoPreview(null) }}
            className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800"
          >
            + New Template
          </button>
        </div>

        {showForm && (
          <form onSubmit={saveTemplate} className="bg-white p-6 rounded-xl shadow mb-6 space-y-4">
            <h2 className="text-xl font-semibold">{editing ? 'Edit Template' : 'New Template'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="name" defaultValue={editing?.name} placeholder="Template Name" required className="border rounded px-3 py-2" />
              <input name="companyName" defaultValue={editing?.companyName} placeholder="Company Name" required className="border rounded px-3 py-2" />
              <input name="companyUen" defaultValue={editing?.companyUen} placeholder="UEN / Registration No" className="border rounded px-3 py-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="companyAddress" defaultValue={editing?.companyAddress} placeholder="Company Address" required className="border rounded px-3 py-2" />
              <input name="companyPhone" defaultValue={editing?.companyPhone} placeholder="Phone" className="border rounded px-3 py-2" />
              <input name="companyEmail" defaultValue={editing?.companyEmail} placeholder="Email" type="email" required className="border rounded px-3 py-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="contactPerson" defaultValue={editing?.contactPerson} placeholder="Contact Person" className="border rounded px-3 py-2" />
              <div>
                <label className="block text-sm text-slate-600 mb-1">Company Logo</label>
                <input type="file" accept="image/*" onChange={e => handleLogoChange(e, (val) => {})} className="block" />
                {logoPreview && <img src={logoPreview} alt="Logo" className="mt-2 h-16 object-contain" />}
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault} />
                  <span className="text-sm">Set as Default</span>
                </label>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input name="bankName" defaultValue={editing?.bankName} placeholder="Bank Name" className="border rounded px-3 py-2" />
              <input name="bankAccount" defaultValue={editing?.bankAccount} placeholder="Account Number" className="border rounded px-3 py-2" />
              <input name="bankAddress" defaultValue={editing?.bankAddress} placeholder="Bank Address" className="border rounded px-3 py-2" />
              <input name="swiftCode" defaultValue={editing?.swiftCode} placeholder="SWIFT Code" className="border rounded px-3 py-2" />
            </div>

            <h3 className="text-lg font-semibold mt-4">Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Primary Color</label>
                <input name="primaryColor" type="color" defaultValue={editing?.primaryColor || '#1e293b'} className="w-full h-10" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Secondary Color</label>
                <input name="secondaryColor" type="color" defaultValue={editing?.secondaryColor || '#64748b'} className="w-full h-10" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Accent Color</label>
                <input name="accentColor" type="color" defaultValue={editing?.accentColor || '#0f172a'} className="w-full h-10" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Font Family</label>
                <select name="fontFamily" defaultValue={editing?.fontFamily || 'Helvetica'} className="w-full border rounded px-3 py-2">
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Courier">Courier</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Header Style</label>
                <select name="headerStyle" defaultValue={editing?.headerStyle || 'standard'} className="w-full border rounded px-3 py-2">
                  <option value="standard">Standard</option>
                  <option value="minimal">Minimal</option>
                  <option value="banner">Banner</option>
                  <option value="modern">Modern</option>
                  <option value="centered">Centered</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Table Style</label>
                <select name="tableStyle" defaultValue={editing?.tableStyle || 'bordered'} className="w-full border rounded px-3 py-2">
                  <option value="bordered">Bordered</option>
                  <option value="minimal">Minimal</option>
                  <option value="striped">Striped</option>
                  <option value="clean">Clean</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Currency</label>
                <input name="currency" defaultValue={editing?.currency || 'SGD'} placeholder="SGD" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tax Name</label>
                <input name="taxName" defaultValue={editing?.taxName || 'GST'} placeholder="GST" className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" name="showLogo" defaultChecked={editing?.showLogo !== false} />
                <span className="text-sm">Show Logo</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="showUen" defaultChecked={editing?.showUen !== false} />
                <span className="text-sm">Show UEN</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="showBankDetails" defaultChecked={editing?.showBankDetails !== false} />
                <span className="text-sm">Show Bank Details</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="showSignatures" defaultChecked={editing?.showSignatures !== false} />
                <span className="text-sm">Show Signatures</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-4">Default Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="defaultDeliveryTerms" defaultValue={editing?.defaultDeliveryTerms} placeholder="Delivery Terms" className="border rounded px-3 py-2" />
              <input name="defaultPaymentTerms" defaultValue={editing?.defaultPaymentTerms} placeholder="Payment Terms" className="border rounded px-3 py-2" />
              <input name="defaultWarranty" defaultValue={editing?.defaultWarranty} placeholder="Warranty" className="border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Tax Rate (%)</label>
              <input name="taxRate" type="number" step="0.01" defaultValue={editing?.taxRate || 0} className="w-32 border rounded px-3 py-2" />
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800">
                {editing ? 'Update Template' : 'Create Template'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setLogoPreview(null) }} className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`bg-white p-4 rounded-xl shadow ${t.isDefault ? 'ring-2 ring-slate-900' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-sm text-slate-600">{t.companyName}</p>
                  {t.isDefault && <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded mt-1 inline-block">Default</span>}
                </div>
                {t.companyLogo && <img src={t.companyLogo} alt="" className="h-10 object-contain" />}
              </div>
              <div className="mt-3 text-sm text-slate-600 space-y-1">
                <p>{t.currency} · {t.taxName} {t.taxRate}%</p>
                <p>{t.headerStyle} header · {t.tableStyle} table</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => previewTemplate(t)} className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">Preview PDF</button>
                <button onClick={() => editTemplate(t)} className="text-sm text-slate-700 bg-slate-100 px-3 py-1 rounded hover:bg-slate-200">Edit</button>
                <button onClick={() => duplicateTemplate(t)} className="text-sm text-slate-700 bg-slate-100 px-3 py-1 rounded hover:bg-slate-200">Duplicate</button>
                <button onClick={() => deleteTemplate(t.id)} className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Template Preview</h3>
                <button onClick={() => { setPreviewUrl(null); window.URL.revokeObjectURL(previewUrl) }} className="text-slate-500 hover:text-slate-700 text-xl">×</button>
              </div>
              <iframe src={previewUrl} className="flex-1 w-full rounded-b-xl" />
            </div>
          </div>
        )}

        {templates.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            No templates yet. Create your first template to get started.
          </div>
        )}
      </main>
    </>
  )
}
