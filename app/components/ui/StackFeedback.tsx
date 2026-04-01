'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent } from '@/lib/agents/types'

interface AgentRating {
  agent_name: string
  rating: number
  comment: string
}

interface Props {
  stackId: string
  agents: StackAgent[]
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-lg leading-none transition-all"
          style={{ color: n <= (hovered || value) ? '#CAFF32' : '#3f3f46' }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function StackFeedback({ stackId, agents }: Props) {
  const [open, setOpen] = useState(false)
  const [stackRating, setStackRating] = useState(0)
  const [stackComment, setStackComment] = useState('')
  const [agentRatings, setAgentRatings] = useState<AgentRating[]>(
    agents.map(a => ({ agent_name: a.name, rating: 0, comment: '' }))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load existing feedback
  useEffect(() => {
    if (!stackId || loaded) return
    fetch(`/api/stacks/${stackId}/feedback`)
      .then(r => r.json())
      .then(({ feedback }) => {
        if (feedback) {
          setStackRating(feedback.stack_rating ?? 0)
          setStackComment(feedback.stack_comment ?? '')
          if (Array.isArray(feedback.agent_ratings)) {
            setAgentRatings(agents.map(a => {
              const existing = feedback.agent_ratings.find((r: AgentRating) => r.agent_name === a.name)
              return existing ?? { agent_name: a.name, rating: 0, comment: '' }
            }))
          }
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [stackId, loaded, agents])

  function updateAgentRating(idx: number, field: 'rating' | 'comment', value: number | string) {
    setAgentRatings(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await fetch(`/api/stacks/${stackId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stack_rating: stackRating || null,
          stack_comment: stackComment || null,
          agent_ratings: agentRatings.filter(r => r.rating > 0 || r.comment),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-300">Évaluer cette recommandation</span>
          {stackRating > 0 && (
            <span className="text-xs text-[#CAFF32]">{'★'.repeat(stackRating)}</span>
          )}
        </div>
        <span className="text-zinc-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-6 border-t border-zinc-800">

              {/* Global stack rating */}
              <div className="pt-4">
                <p className="text-xs text-zinc-400 mb-2">Note globale de la recommandation</p>
                <StarRating value={stackRating} onChange={setStackRating} />
                <textarea
                  value={stackComment}
                  onChange={e => setStackComment(e.target.value)}
                  placeholder="Un commentaire sur la pertinence de ce stack ? (optionnel)"
                  rows={2}
                  className="mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none resize-none focus:border-zinc-600 transition-colors"
                />
              </div>

              {/* Per-agent ratings */}
              <div>
                <p className="text-xs text-zinc-400 mb-3">Note par outil</p>
                <div className="flex flex-col gap-4">
                  {agents.map((agent, i) => (
                    <div key={agent.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-zinc-300">{agent.name}</p>
                        <StarRating
                          value={agentRatings[i]?.rating ?? 0}
                          onChange={v => updateAgentRating(i, 'rating', v)}
                        />
                      </div>
                      <input
                        type="text"
                        value={agentRatings[i]?.comment ?? ''}
                        onChange={e => updateAgentRating(i, 'comment', e.target.value)}
                        placeholder={`Commentaire sur ${agent.name}… (optionnel)`}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving || stackRating === 0}
                className="self-start px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: saved ? '#34D399' : '#CAFF32', color: '#0a0a0a' }}
              >
                {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Envoyer l\'évaluation'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
