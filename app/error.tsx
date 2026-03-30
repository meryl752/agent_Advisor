'use client'

import { useEffect } from 'react'
import { captureError } from '@/lib/monitoring/sentry'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureError(error, { action: 'global_error_boundary' })
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8">
      <div className="max-w-md text-center">
        <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4">
          Erreur système
        </p>
        <h1 className="font-syne font-black text-4xl mb-4 text-white">
          Quelque chose s'est mal passé
        </h1>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          Une erreur inattendue s'est produite. Notre équipe a été notifiée automatiquement.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#CAFF32] text-zinc-900 font-bold px-6 py-3 text-sm hover:bg-[#d4ff50] transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="border border-zinc-700 text-zinc-300 font-bold px-6 py-3 text-sm hover:border-zinc-500 transition-colors"
          >
            Accueil
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 font-dm-mono text-[10px] text-zinc-700">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
