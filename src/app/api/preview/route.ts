import { NextResponse } from 'next/server'
import React from 'react'
import { QuotationPDF } from '@/lib/pdf'
import { renderToBuffer } from '@react-pdf/renderer'

// Generate a sample preview PDF for a template
export async function POST(req: Request) {
  const body = await req.json()
  const { template } = body
  
  if (!template) {
    return NextResponse.json({ error: 'Template data required' }, { status: 400 })
  }

  // Create sample data for preview
  const sampleCustomer = {
    id: 'preview-cust',
    name: 'Sample Customer Ltd',
    email: 'contact@sample.com',
    phone: '+65 9123 4567',
    address: '123 Sample Street, Singapore 123456',
    uen: '201912345K',
  }

  const sampleQuotation = {
    quotationNo: 'PREVIEW-001',
    issueDate: new Date().toISOString(),
    subtotal: 6280.00,
    taxRate: Number(template.taxRate || 0),
    taxAmount: 6280.00 * (Number(template.taxRate || 0) / 100),
    total: 6280.00 + (6280.00 * (Number(template.taxRate || 0) / 100)),
    deliveryTerms: template.defaultDeliveryTerms || 'DDP — Delivered Duty Paid',
    paymentTerms: template.defaultPaymentTerms || 'Net 30 days from invoice date',
    warranty: template.defaultWarranty || '12 months standard warranty',
    dispatchDate: '15-20 business days',
    notes: '',
  }

  const sampleItems = [
    {
      id: 'preview-1',
      quantity: 10,
      unitPrice: 209.00,
      amount: 2090.00,
      displayName: 'Professional Solar Panel 490W',
      description: 'High-efficiency monocrystalline panel',
      lineNo: 1,
      sku: {
        model: 'SP-490W',
        code: 'SOLAR-001',
        performance: '490W, 21.2% efficiency',
      },
    },
    {
      id: 'preview-2',
      quantity: 1,
      unitPrice: 4230.00,
      amount: 4230.00,
      displayName: 'Smart Inverter Controller 12kW',
      description: 'Grid-tied inverter with monitoring',
      lineNo: 2,
      sku: {
        model: 'INV-12K',
        code: 'INVERTER-001',
        performance: '12kW, 98.6% efficiency',
      },
    },
  ]

  try {
    const buffer = await renderToBuffer(
      React.createElement(QuotationPDF, {
        template,
        customer: sampleCustomer,
        quotation: sampleQuotation,
        items: sampleItems,
      }) as any
    )

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="template-preview.pdf"',
      },
    })
  } catch (err: any) {
    console.error('Preview generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate preview' }, { status: 500 })
  }
}
