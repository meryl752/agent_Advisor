'use client'

import { useEffect, useState, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import CoverageRing from '@/app/components/blueprint/CoverageRing'
import BlueprintTaskCard from '@/app/components/blueprint/BlueprintTaskCard'
import type { BlueprintApiResponse, BlueprintTaskWithAgents } from '@/app/api/blueprint/[sector]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCategory(tasks: BlueprintTaskWithAgents[]): Record<string, BlueprintTaskWithAgents[]> {
  return tasks.reduce<Record<string, BlueprintTaskWithAgents[]>>((acc, task) => {
    const cat = task.task_category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(task)
    return acc
  }, {})
}

function computeCoverageScore(tasks: BlueprintTaskWithAgents[], selectedIds: Set<string>) {
  const selected = tasks.filter(t => selectedIds.has(t.id))
  if (selected.length === 0) {
    const covered = tasks.filter(t => t.agents.length > 0).length
    return { covered, total: tasks.length, score: tasks.length > 0 ? Math.round((covered / tasks.length) * 100) : 0 }
  }
  const covered = selected.filter(t => t.agents.length > 0).length
  return { covered, total: selected.length, score: selected.length > 0 ? Math.round((covered / selected.length) * 100) : 0 }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlueprintSectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector: sectorSlug } = use(params)
  const router = useRouter()

  const [data, setData] = useState<BlueprintApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [stackAgentIds, setStackAgentIds] = useState<string[]>([])
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'agency'>('free')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Fetch real user plan
  useEffect(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then(d => { if (d.plan) setUserPlan(d.plan) })
      .catch(() => {}) // keep 'free' as safe default
  }, [])

  // Fetch blueprint data
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/blueprint/${sectorSlug}`)
      .then(async res => {
        if (res.status === 404) {
          setError('Secteur introuvable')
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Erreur serveur')
        return res.json()
      })
      .then(json => {
        if (json) {
          setData(json)
          // Remember last viewed sector
          localStorage.setItem('blueprint_last_sector', sectorSlug)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [sectorSlug])

  const grouped = useMemo(() => {
    if (!data) return {}
    return groupByCategory(data.tasks)
  }, [data])

  const coverage = useMemo(() => {
    if (!data) return { covered: 0, total: 0, score: 0 }
    return computeCoverageScore(data.tasks, selectedIds)
  }, [data, selectedIds])

  const toggleTask = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddAgentToStack = (agentId: string) => {
    if (userPlan === 'free' && stackAgentIds.length >= 3) {
      setShowUpgradePrompt(true)
      return
    }
    setStackAgentIds(prev => prev.includes(agentId) ? prev : [...prev, agentId])
  }

  const handleGenerateStack = () => {
    if (selectedIds.size === 0) return
    if (!data) return

    // Collect all agents from selected tasks (deduplicated)
    const agentMap = new Map()
    data.tasks
      .filter(t => selectedIds.has(t.id))
      .forEach(t => t.agents.forEach(a => agentMap.set(a.id, a)))

    const agents = Array.from(agentMap.values())

    if (userPlan === 'free' && agents.length > 3) {
      setShowUpgradePrompt(true)
      return
    }

    // Navigate to recommend page with context (or handle stack generation)
    router.push('/dashboard/recommend')
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="h-10 w-64 bg-zinc-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <p className="font-syne font-black text-white text-2xl">Erreur de chargement</p>
        <p className="font-dm-sans text-sm text-zinc-500">{error ?? 'Données introuvables'}</p>
        <button
          onClick={() => window.location.reload()}
          className="font-dm-mono text-xs border border-zinc-700 text-zinc-400 px-4 py-2 rounded-lg hover:border-zinc-500 transition-colors"
        >
          ↺ Réessayer
        </button>
      </div>
    )
  }

  const categories = Object.keys(grouped)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-dm-mono text-[10px] text-zinc-600">
        <Link href="/dashboard/blueprint" className="hover:text-zinc-400 transition-colors">
          Business Blueprint
        </Link>
        <span>/</span>
        <span className="text-zinc-400">{data.sector.label}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 mb-10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{data.sector.icon}</span>
            <h1 className="font-syne font-black text-4xl text-white tracking-tighter">
              {data.sector.label}
            </h1>
          </div>
          <p className="font-dm-sans text-sm text-zinc-500 leading-relaxed max-w-xl mb-4">
            {data.sector.description}
          </p>
          <div className="flex items-center gap-4">
            <span className="font-dm-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              {data.tasks.length} tâches · {categories.length} catégories
            </span>
            {selectedIds.size > 0 && (
              <span className="font-dm-mono text-[10px] text-[#CAFF32]">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Coverage ring */}
        <div className="flex-shrink-0">
          <CoverageRing
            covered={coverage.covered}
            total={coverage.total}
            score={coverage.score}
          />
        </div>
      </div>

      {/* Upgrade prompt */}
      {showUpgradePrompt && (
        <div className="mb-6 flex items-center justify-between bg-zinc-900 border border-[#CAFF32]/20 rounded-xl px-5 py-4">
          <div>
            <p className="font-syne font-bold text-sm text-white mb-0.5">Plan gratuit limité à 3 agents</p>
            <p className="font-dm-sans text-xs text-zinc-500">Passe en Pro pour générer des stacks illimités.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="font-dm-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Fermer
            </button>
            <Link
              href="/dashboard/billing"
              className="font-syne font-bold text-xs bg-[#CAFF32] text-zinc-900 px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors"
            >
              Passer en Pro →
            </Link>
          </div>
        </div>
      )}

      {/* Task categories */}
      <div className="flex flex-col gap-8">
        {categories.map(category => (
          <div key={category}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                {category}
              </span>
              <div className="flex-1 h-[1px] bg-zinc-800" />
              <span className="font-dm-mono text-[10px] text-zinc-700">
                {grouped[category].length} tâche{grouped[category].length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex flex-col gap-2">
              {grouped[category].map(task => (
                <BlueprintTaskCard
                  key={task.id}
                  task={task}
                  agents={task.agents}
                  selected={selectedIds.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  onAddAgentToStack={handleAddAgentToStack}
                  userStackAgentIds={stackAgentIds}
                  userPlan={userPlan}
                  stackAgentCount={stackAgentIds.length}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky CTA */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 shadow-2xl shadow-black/50">
            <div>
              <p className="font-syne font-black text-sm text-white">
                {selectedIds.size} tâche{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </p>
              <p className="font-dm-mono text-[10px] text-zinc-500">
                {coverage.covered} outil{coverage.covered > 1 ? 's' : ''} disponible{coverage.covered > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleGenerateStack}
              className={cn(
                'font-syne font-black text-sm px-6 py-3 rounded-xl transition-all',
                'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50]'
              )}
            >
              Générer mon stack →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
