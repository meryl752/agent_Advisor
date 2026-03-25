import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row
                      items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-black text-zinc-400 text-sm">Raspquery</span>
        </Link>

        <div className="flex gap-6">
          {['Features', 'Pricing', 'Dashboard', 'Contact'].map(item => (
            <a key={item} href="#"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-medium transition-colors">
              {item}
            </a>
          ))}
        </div>

        <p className="text-zinc-700 text-xs">© 2025 Raspquery · Tous droits réservés</p>
      </div>
    </footer>
  )
}