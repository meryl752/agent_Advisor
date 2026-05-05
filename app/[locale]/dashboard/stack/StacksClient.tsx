'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { getLogoUrl } from '@/lib/utils/logo'
import type { Stack } from '@/lib/supabase/types'

const COLORS = ['#FF6B35', '#6B4FFF', '#20B8CD', '#CAFF32', '#FF7A59', '#10A37F', '#5E6AD2', '#FFE01B']

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

function ToolAvatar({ agentId, agentData, index }: {
  agentId: string
  agentData?: { name: string; url: string }
  index: number
}) {
  const [imgErr, setImgErr] = useState(false)
  const domain = agentData?.url ? getDomain(agentData.url) : ''
  const color = COLORS[index % COLORS.length]
  const initials = agentData?.name?.slice(0, 2).toUpperCase() ?? agentId.slice(0, 2).toUpperCase()

  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden flex items-center justify-center"
      style={{
        marginLeft: index === 0 ? 0 : -10,
        zIndex: 10 - index,
        position: 'relative',
        background: color,
      }}
    >
      {domain && !imgErr ? (
        <img
          src={getLogoUrl(domain)}
          alt={agentData?.name ?? agentId}
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <span className="text-[10px] font-black text-white">{initials}</span>
      )}
    </div>
  )
}

function ToolAvatars({ agentIds, agentsMap }: {
  agentIds: string[]
  agentsMap: Record<string, { name: string; url: string }>
}) {
  const max = 5
  const shown = agentIds.slice(0, max)
  const extra = agentIds.length - max

  return (
    <div className="flex items-center">
      {shown.map((id, i) => (
        <ToolAvatar key={id} agentId={id} agentData={agentsMap[id]} index={i} />
      ))}
      {extra > 0 && (
        <div
          className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
          style={{ marginLeft: -10, position: 'relative', zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

export default function StacksClient({
  initialStacks,
  agentsMap,
  stackSessionMap,
}: {
  initialStacks: Stack[]
  agentsMap: Record<string, { name: string; url: string }>
  stackSessionMap: Record<string, string>
}) {
  const t = useTranslations('dashboard.stack')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [stacks, setStacks] = useState<Stack[]>(initialStacks)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter stacks by search query
  const filteredStacks = search.trim()
    ? stacks.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.objective?.toLowerCase().includes(search.toLowerCase())
      )
    : stacks

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
      setConfirmDeleteId(null)
    }
  }

  if (stacks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center">
        <p className="font-semibold text-zinc-900 dark:text-white text-lg mb-2">{t('empty')}</p>
        <Link href="/dashboard/recommend"
          className="inline-block bg-[#CAFF32] text-zinc-900 font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-[#d4ff50] transition-colors mt-4">
          {t('viewStack')} →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <img
          src="/assets/icons svg/search-01-stroke-rounded.svg"
          alt="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 dark:invert"
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un stack..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>
      )}

      {filteredStacks.length === 0 && search && (
        <div className="text-center py-12 text-zinc-400 text-sm">
          Aucun stack trouvé pour "<span className="font-medium text-zinc-600 dark:text-zinc-300">{search}</span>"
        </div>
      )}

      <AnimatePresence>
        {filteredStacks.map((stack) => {
          const date = new Date(stack.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
          const isEditing = editingId === stack.id
          const isDeleting = deletingId === stack.id
          const isConfirmingDelete = confirmDeleteId === stack.id

          return (
            <motion.div key={stack.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ duration: 0.25 }}
              className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 transition-all ${stackSessionMap[stack.id] ? 'hover:border-zinc-300 dark:hover:border-zinc-600 cursor-pointer' : 'hover:border-zinc-300 dark:hover:border-zinc-700'}`}
              onClick={() => {
                if (stackSessionMap[stack.id] && !isEditing && !isConfirmingDelete) {
                  router.push(`/dashboard/recommend/${stackSessionMap[stack.id]}`)
                }
              }}
            >
              {/* Top row — name + date + actions */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
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

                {/* Action icons + date */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-zinc-400 mr-2">{date}</span>

                  {/* Rename icon */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(stack.id); setEditName(stack.name) }}
                    title="Renommer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                  >
                    <img src="/assets/icons svg/pencil-edit-02-stroke-rounded.svg" alt="edit" className="w-4 h-4 opacity-60 dark:invert" />
                  </button>

                  {/* Delete icon / confirm */}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(stack.id)}
                        disabled={isDeleting}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? '…' : 'Confirmer'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        {tCommon('cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(stack.id) }}
                      title="Supprimer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <img src="/assets/icons svg/delete-04-stroke-rounded.svg" alt="delete" className="w-4 h-4 opacity-60 dark:invert" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tool avatars + metrics */}
              <div className="flex items-center justify-between">
                {/* Tool logos as overlapping circles */}
                <ToolAvatars agentIds={stack.agent_ids ?? []} agentsMap={agentsMap} />

                {/* Metrics */}
                <div className="flex items-center gap-5">
                  {[
                    { label: t('cost'), value: `${stack.total_cost}€${t('perMonth')}` },
                    { label: t('roi'), value: `+${stack.roi_estimate}%`, accent: true },
                    { label: t('score'), value: `${stack.score}/100` },
                  ].map((m, i) => (
                    <div key={i} className="text-right">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                      <p className={`text-sm font-semibold ${m.accent ? 'text-[#CAFF32]' : 'text-zinc-900 dark:text-white'}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* View conversation link */}
              {stackSessionMap[stack.id] && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Link
                    href={`/dashboard/recommend/${stackSessionMap[stack.id]}`}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Voir la conversation
                  </Link>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

