import { Suspense } from 'react'
import NewInvoiceForm from './NewInvoiceForm'

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading form...</div>}>
      <NewInvoiceForm />
    </Suspense>
  )
}
