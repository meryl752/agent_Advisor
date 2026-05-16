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
 * Root-level errors (including Clerk script load failures outside the layout).
 * Must define html and body tags (Next.js contract).
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
        '[Clerk] Script failed to load. Check network / blockers / NEXT_PUBLIC_CLERK_PRECONNECT_ORIGIN in .env.local'
      )
    }
  }, [clerk])

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 antialiased">
        <div className="max-w-lg text-center space-y-4">
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
            {clerk ? 'Authentication' : 'Error'}
          </p>
          <h1 className="text-2xl font-bold text-white">
            {clerk ? 'Clerk sign-in unavailable' : 'Something went wrong'}
          </h1>
          {clerk ? (
            <div className="text-left text-sm text-zinc-400 space-y-3 leading-relaxed">
              <p>
                Your browser could not load the Clerk script (network, firewall, VPN, or ad
                blocker).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Disable uBlock / Privacy Badger / Brave Shields on this site</li>
                <li>Try again without VPN or on another network</li>
                <li>
                  Add your Frontend API origin to <code className="text-zinc-300">.env.local</code>
                  :{' '}
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
              Retry
            </button>
            <a
              href="/"
              className="border border-zinc-600 text-zinc-200 font-semibold px-6 py-3 text-sm rounded-md hover:border-zinc-400"
            >
              Home
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
