'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { IconChevronLeft, IconChevronRight, IconX, IconPencil, IconTrash, IconCheck } from '@tabler/icons-react'

interface ConversationItem {
  session_id: string
  title: string
  stack_generated: boolean
  updated_at: string
}

function RecentConversations() {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showShimmer, setShowShimmer] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const shimmerTimer = setTimeout(() => setShowShimmer(true), 200)
    fetch('/api/conversations')
      .then(r => r.json())
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => { clearTimeout(shimmerTimer); setLoading(false); setShowShimmer(false) })
  }, [])

  const handleDelete = async (sessionId: string) => {
    await fetch(`/api/conversations/${sessionId}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.session_id !== sessionId))
  }

  const handleRename = async (sessionId: string, title: string) => {
    await fetch(`/api/conversations/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setConversations(prev => prev.map(c => c.session_id === sessionId ? { ...c, title } : c))
    setEditingId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
      {loading && showShimmer ? (
        <div className="flex flex-col gap-1 px-3 pt-1">
          {['70%', '55%', '80%', '60%'].map((w, i) => (
            <div key={i} className="py-2.5 px-1 flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full relative overflow-hidden" style={{ background: 'rgba(63,63,70,0.5)', width: w }}>
                <div className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
              </div>
              <div className="h-2 rounded-full relative overflow-hidden" style={{ background: 'rgba(63,63,70,0.5)', width: '40%' }}>
                <div className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)', backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }} />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex items-center justify-center h-32 px-4">
          <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
            Tes conversations<br />apparaîtront ici
          </p>
        </div>
      ) : (
        conversations.slice(0, 20).map(conv => (
          <div key={conv.session_id}
            className="group relative flex items-start px-4 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
            {conv.stack_generated && (
              <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#CAFF32] mr-2" />
            )}
            {editingId === conv.session_id ? (
              <div className="flex-1 flex items-center gap-1">
                <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(conv.session_id, draft); if (e.key === 'Escape') setEditingId(null) }}
                  className="flex-1 text-[11px] bg-transparent outline-none border-b border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white" />
                <button onClick={() => handleRename(conv.session_id, draft)} className="text-[#CAFF32]"><IconCheck size={11} /></button>
                <button onClick={() => setEditingId(null)} className="text-zinc-500"><IconX size={11} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => router.push(`/dashboard/recommend/${conv.session_id}`)} className="flex-1 text-left min-w-0">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 leading-relaxed line-clamp-2 transition-colors">
                    {conv.title}
                  </p>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                  <button onClick={() => { setDraft(conv.title); setEditingId(conv.session_id) }}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                    <IconPencil size={11} />
                  </button>
                  <button onClick={() => handleDelete(conv.session_id)}
                    className="text-zinc-400 hover:text-red-500 transition-colors">
                    <IconTrash size={11} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default function RecentConversationsSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-5 h-10 rounded-l-md transition-all duration-[250ms]"
        style={{
          right: open ? 240 : 0,
          background: open ? 'var(--bg2)' : '#CAFF32',
          borderTopWidth: '1px',
          borderBottomWidth: '1px',
          borderLeftWidth: '1px',
          borderRightWidth: '0px',
          borderStyle: 'solid',
          borderColor: open ? 'var(--border)' : '#CAFF32',
        }}
      >
        {open
          ? <IconChevronRight size={14} className="text-zinc-500" />
          : <IconChevronLeft size={14} className="text-zinc-900" />}
      </button>

      {/* Sidebar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: open ? 240 : 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="flex-shrink-0 flex flex-col h-full overflow-hidden z-10"
        style={{ background: 'var(--bg)', borderLeft: open ? '1px solid var(--border)' : 'none' }}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 w-60"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Récents</p>
          <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <IconX size={13} />
          </button>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden w-60">
          <RecentConversations />
        </div>
      </motion.div>
    </>
  )
}
