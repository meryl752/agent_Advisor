'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { Stack } from '@/lib/supabase/types'

export default function StacksClient({ initialStacks }: { initialStacks: Stack[] }) {
  const t = useTranslations('dashboard.stack')
  const tCommon = useTranslations('common')
  const [stacks, setStacks] = useState<Stack[]>(initialStacks)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRename(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/stacks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) throw new Error('UPDATE_FAILED')
      setStacks(prev => prev.map(s => s.id === id ? { ...s, name: editName.trim() } : s))
      setEditingId(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/stacks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('DELETE_FAILED')
      setStacks(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (stacks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center">
        <p className="font-semibold text-zinc-900 dark:text-white text-lg mb-2">{t('empty')}</p>
        <p className="text-zinc-500 text-sm mb-6">{t('objective')}</p>
        <Link href="/dashboard/recommend"
          className="inline-block bg-[#CAFF32] text-zinc-900 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#d4ff50] transition-colors">
          {t('viewStack')} →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>
      )}

      <AnimatePresence>
        {stacks.map((stack) => {
          const date = new Date(stack.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
          const isEditing = editingId === stack.id
          const isDeleting = deletingId === stack.id

          return (
            <motion.div key={stack.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(stack.id); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#CAFF32] transition-colors"
                      />
                      <button onClick={() => handleRename(stack.id)} disabled={saving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#CAFF32] text-zinc-900 font-medium hover:bg-[#d4ff50] transition-colors disabled:opacity-50">
                        {saving ? '…' : 'OK'}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        {tCommon('cancel')}
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-base truncate">{stack.name}</h3>
                  )}
                  <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{stack.objective}</p>
                </div>
                <span className="text-xs text-zinc-400 flex-shrink-0 mt-0.5">{date}</span>
              </div>

              <div className="flex items-center gap-5 py-3 border-t border-b border-zinc-100 dark:border-zinc-800/60 mb-3">
                {[
                  { label: t('cost'), value: `${stack.total_cost}€${t('perMonth')}` },
                  { label: t('roi'), value: `+${stack.roi_estimate}%`, accent: true },
                  { label: t('score'), value: `${stack.score}/100` },
                  { label: t('agents'), value: String(stack.agent_ids?.length ?? 0) },
                ].map((m, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                    <p className={`text-sm font-semibold ${m.accent ? 'text-[#CAFF32]' : 'text-zinc-900 dark:text-white'}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingId(stack.id); setEditName(stack.name) }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
                >
                  ✎ Renommer
                </button>
                <button
                  onClick={() => handleDelete(stack.id)}
                  disabled={isDeleting}
                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-40"
                >
                  {isDeleting ? '…' : `✕ ${t('deleteStack')}`}
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
