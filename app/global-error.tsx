'use client'

import { useEffect } from 'react'

function isClerkScriptLoadError(message: string | undefined): boolean {
  if (!message) return false
  return (
    message.includes('failed_to_load_clerk_js') ||
    message.includes('Failed to load Clerk JS') ||
    message.includes('Clerk: Failed to load Clerk JS')
  )
}

/**
 * Erreurs au niveau racine (dont échec de chargement du script Clerk hors du layout).
 * Doit définir les balises html et body (contrat Next.js).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const clerk = isClerkScriptLoadError(error.message)

  useEffect(() => {
    if (clerk) {
      console.info(
        '[Clerk] Échec de chargement du script. Vérifier réseau / bloqueurs / NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN dans .env.local'
      )
    }
  }, [clerk])

  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 antialiased">
        <div className="max-w-lg text-center space-y-4">
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
            {clerk ? 'Authentification' : 'Erreur'}
          </p>
          <h1 className="text-2xl font-bold text-white">
            {clerk
              ? 'Connexion Clerk indisponible'
              : 'Une erreur est survenue'}
          </h1>
          {clerk ? (
            <div className="text-left text-sm text-zinc-400 space-y-3 leading-relaxed">
              <p>
                Le navigateur n’a pas pu charger le script Clerk (réseau, pare-feu, VPN ou
                bloqueur de publicité).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Désactiver uBlock / Privacy Badger / Brave Shields sur ce site</li>
                <li>Réessayer sans VPN ou sur un autre réseau</li>
                <li>
                  Ajouter dans <code className="text-zinc-300">.env.local</code> l’origine du
                  Frontend API :{' '}
                  <code className="text-zinc-300 break-all">
                    NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN=https://…clerk.accounts.dev
                  </code>
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{error.message}</p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-[#CAFF32] text-zinc-900 font-semibold px-6 py-3 text-sm rounded-md hover:bg-[#d4ff50]"
            >
              Réessayer
            </button>
            <a
              href="/"
              className="border border-zinc-600 text-zinc-200 font-semibold px-6 py-3 text-sm rounded-md hover:border-zinc-400"
            >
              Accueil
            </a>
          </div>
          {error.digest && (
            <p className="font-mono text-[10px] text-zinc-600 pt-4">Ref: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
