import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <div className="max-w-md text-center">
        <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4">
          404
        </p>
        <h1 className="font-syne font-black text-5xl mb-4 text-white">
          Page introuvable
        </h1>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#CAFF32] text-zinc-900 font-bold px-8 py-3 text-sm hover:bg-[#d4ff50] transition-colors"
        >
          Retour à l'accueil →
        </Link>
      </div>
    </div>
  )
}
