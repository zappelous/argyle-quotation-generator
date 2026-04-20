import { Nav } from './Nav'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Quotation Generator</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card href="/quotations/new" title="New Quotation" desc="Create a new quotation by selecting SKUs and customer." />
          <Card href="/quotations" title="View Quotations" desc="View, edit, download PDF, or email saved quotations." />
          <Card href="/templates" title="Templates" desc="Create and manage quotation templates for different companies." />
          <Card href="/skus" title="Manage SKUs" desc="Add and edit your product catalogue with prices." />
          <Card href="/customers" title="Customers" desc="Manage your customer database." />
        </div>
      </main>
    </>
  )
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-slate-600 text-sm">{desc}</p>
    </Link>
  )
}
