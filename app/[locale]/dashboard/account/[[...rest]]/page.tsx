'use client'

import { UserProfile } from '@clerk/nextjs'

export default function AccountPage() {
  return (
    <div className="w-full flex justify-center py-4">
      <style jsx global>{`
        .cl-footer,
        .cl-footerAction,
        .cl-footerActionLink,
        .cl-footerActionText,
        .cl-internal-b3fm6y {
          display: none !important;
        }
      `}</style>
      <UserProfile
        routing="hash"
        appearance={{
          variables: {
            colorBackground: 'var(--bg)',
            colorInputBackground: 'var(--bg2)',
            colorText: 'var(--text)',
            colorTextSecondary: '#71717a',
            colorInputText: 'var(--text)',
            colorPrimary: '#CAFF32',
            colorNeutral: '#71717a',
          },
          elements: {
            rootBox: 'w-full max-w-2xl',
            card: 'shadow-none rounded-xl border border-zinc-200 dark:border-zinc-800',
            navbar: 'border-r border-zinc-200 dark:border-zinc-800',
            formButtonPrimary: 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50]',
            headerTitle: 'font-syne',
            footer: 'hidden',
            footerAction: 'hidden',
          },
        }}
      />
    </div>
  )
}
