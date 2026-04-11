import { Suspense } from 'react'
import QuotationForm from '../QuotationForm'

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading form...</div>}>
      <QuotationForm />
    </Suspense>
  )
}
