'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { IconChevronLeft, IconTrash, IconPencil, IconCheck, IconX } from '@tabler/icons-react'
import type { ConversationItem } from './types'

function ShimmerItem({ width }: { width: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="rounded-lg overflow-hidden relative h-2.5 mb-1.5"
        style={{ background: 'var(--border)', width }}>
        <div className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
      </div>
      <div className="rounded-lg overflow-hidden relative h-2"
        style={{ background: 'var(--border)', width: '55%' }}>
        <div className="absolute inset-0 animate-shimmer"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%', animationDelay: '0.15s' }} />
      </div>
    </div>
  )
}

function ConversationRow({
  conv,
  isActive,
  onNavigate,
  onDelete,
  onRename,
}: {
  conv: ConversationItem
  isActive: boolean
  onNavigate: () => void
  onDelete: () => void
  onRename: (title: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(conv.title)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commitRename = () => {
    if (draft.trim() && draft.trim() !== conv.title) onRename(draft.trim())
    setEditing(false)
  }

  return (
    <div
      className={`relative flex items-center group px-3 py-2 transition-colors ${isActive ? 'bg-zinc-100 dark:bg-white/5' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {conv.stack_generated && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#CAFF32] mr-2 mt-0.5" />
      )}

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 text-[11px] bg-transparent outline-none border-b border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white"
          />
          <button onClick={commitRename} className="text-[#CAFF32] hover:opacity-80"><IconCheck size={11} /></button>
          <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-zinc-300"><IconX size={11} /></button>
        </div>
      ) : (
        <>
          <button onClick={onNavigate} className="flex-1 text-left min-w-0">
            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`}>
              {conv.title}
            </p>
          </button>
          {hovered && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              <button onClick={() => { setDraft(conv.title); setEditing(true) }}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                <IconPencil size={11} />
              </button>
              <button onClick={onDelete}
                className="text-zinc-400 hover:text-red-500 transition-colors">
                <IconTrash size={11} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ConversationSidebar({ onNew }: { onNew: () => void }) {
  const router = useRouter()
  const params = useParams()
  const currentSessionId = params?.sessionId as string | undefined
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showShimmer, setShowShimmer] = useState(false)

  const load = () => {
    // Only show shimmer after 200ms to avoid flash on fast connections
    const shimmerTimer = setTimeout(() => setShowShimmer(true), 200)
    fetch('/api/conversations')
      .then(r => r.json())
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => { clearTimeout(shimmerTimer); setLoading(false); setShowShimmer(false) })
  }

  useEffect(() => { load() }, [currentSessionId])

  const handleDelete = async (sessionId: string) => {
    await fetch(`/api/conversations/${sessionId}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.session_id !== sessionId))
    if (sessionId === currentSessionId) router.push('/dashboard/recommend')
  }

  const handleRename = async (sessionId: string, title: string) => {
    await fetch(`/api/conversations/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setConversations(prev => prev.map(c => c.session_id === sessionId ? { ...c, title } : c))
  }

  return (
    <div className="flex-shrink-0 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-700/40 overflow-hidden"
      style={{ width: 220, background: 'var(--bg2)' }}>

      <div className="flex-shrink-0 flex items-center justify-between px-3 py-3 border-b border-zinc-200 dark:border-zinc-700/40">
        <button onClick={onNew} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
          <IconChevronLeft size={16} />
        </button>
        <button onClick={onNew} className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
          + Nouveau
        </button>
      </div>

      {loading && showShimmer ? (
        <div className="flex-1 overflow-y-auto py-1">
          {['75%', '60%', '80%', '50%'].map((w, i) => <ShimmerItem key={i} width={w} />)}
        </div>
      ) : loading ? (
        <div className="flex-1" />
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[11px] text-zinc-500 text-center leading-relaxed">Tes conversations apparaîtront ici</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
          {conversations.map(conv => (
            <ConversationRow
              key={conv.session_id}
              conv={conv}
              isActive={conv.session_id === currentSessionId}
              onNavigate={() => router.push(`/dashboard/recommend/${conv.session_id}`)}
              onDelete={() => handleDelete(conv.session_id)}
              onRename={(title) => handleRename(conv.session_id, title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
