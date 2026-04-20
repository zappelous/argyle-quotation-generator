'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/quotations/new', label: 'New Quotation' },
  { href: '/templates', label: 'Templates' },
  { href: '/skus', label: 'SKUs' },
  { href: '/customers', label: 'Customers' },
  { href: '/admin/allowed-emails', label: 'Admin' },
]

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAuthPage = pathname === '/login' || pathname === '/register'

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6 overflow-x-auto">
            <span className="font-bold text-lg whitespace-nowrap">QuoteFlow</span>
            {!isAuthPage && links.map((l) => (
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
          {!isAuthPage && session?.user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-300 hidden sm:inline">{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-white hover:text-slate-300"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
