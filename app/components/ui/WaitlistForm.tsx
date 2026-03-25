'use client'

import { useState } from 'react'
import { validateEmail } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface WaitlistFormProps {
  id?: string
  centered?: boolean
}

export default function WaitlistForm({ id, centered = false }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle')

  const handleSubmit = () => {
    if (!validateEmail(email)) {
      setStatus('error')
      return
    }
    // TODO: POST to /api/waitlist when Supabase is connected
    setStatus('success')
    setEmail('')
  }

  return (
    <div className={cn(centered && 'flex flex-col items-center')}>
      <div className="flex max-w-[460px] w-full">
        <input
          id={id}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="ton@email.com"
          autoComplete="email"
          className={cn(
            'flex-1 bg-bg-2 border border-border-2 border-r-0 text-cream px-5 py-4',
            'font-dm-sans text-sm outline-none transition-colors duration-200',
            'placeholder:text-muted focus:border-accent',
            status === 'error' && 'border-red-500'
          )}
        />
        <button
          onClick={handleSubmit}
          className="bg-accent text-bg font-syne font-bold text-sm px-7 py-4
                     whitespace-nowrap transition-opacity duration-150 hover:opacity-85"
        >
          Rejoindre →
        </button>
      </div>

      {status === 'success' ? (
        <p className={cn(
          'font-dm-mono text-xs text-accent mt-3 flex items-center gap-2',
          centered && 'justify-center'
        )}>
          <span className="text-base">✓</span> Tu es sur la liste. À très vite.
        </p>
      ) : (
        <p className={cn(
          'font-dm-mono text-[0.66rem] text-muted mt-3',
          centered && 'text-center'
        )}>
          ✦ Bêta privée · Places limitées · Aucun spam
        </p>
      )}
    </div>
  )
}
