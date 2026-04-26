import { Suspense } from 'react'
import InvoiceEditForm from './InvoiceEditForm'

export default function EditInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading form...</div>}>
      <InvoiceEditForm />
    </Suspense>
  )
}
