'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/quotations/new', label: 'New Quotation' },
  { href: '/skus', label: 'SKUs' },
  { href: '/customers', label: 'Customers' },
  { href: '/company', label: 'Company' },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-6 h-14 overflow-x-auto">
          <span className="font-bold text-lg whitespace-nowrap">QuoteGen</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm whitespace-nowrap hover:text-slate-300 ${
                pathname === l.href ? 'text-white font-medium' : 'text-slate-400'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
