'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
  streamedCount?: number
}

// ─── Layout constants — bigger nodes ─────────────────────────────────────────

const NODE_W = 172
const NODE_H = 80
const ROOT_W = 240
const ROOT_H = 60
const H_GAP = 32
const V_GAP = 110

const CATEGORY_COLOR: Record<string, string> = {
  copywriting:      '#A78BFA',
  automation:       '#38bdf8',
  analytics:        '#FBBF24',
  customer_service: '#34D399',
  seo:              '#FB923C',
  prospecting:      '#F87171',
  coding:           '#22D3EE',
  research:         '#818CF8',
  image:            '#F472B6',
  video:            '#E879F9',
}
const catColor = (cat: string) => CATEGORY_COLOR[cat] ?? '#CAFF32'

function computeLayout(agents: StackAgent[], canvasW: number) {
  const n = agents.length
  const totalW = n * NODE_W + (n - 1) * H_GAP
  const startX = canvasW / 2 - totalW / 2
  const rootX = canvasW / 2 - ROOT_W / 2
  const rootY = 20
  const agentY = rootY + ROOT_H + V_GAP

  const nodes = agents.map((a, i) => ({
    agent: a,
    x: startX + i * (NODE_W + H_GAP),
    y: agentY,
    cx: startX + i * (NODE_W + H_GAP) + NODE_W / 2,
    cy: agentY + NODE_H / 2,
  }))

  return {
    canvasH: agentY + NODE_H + 28,
    rootX, rootY,
    rootCX: canvasW / 2,
    rootBottomY: rootY + ROOT_H,
    nodes,
  }
}

// ─── Connector ────────────────────────────────────────────────────────────────

function Connector({ x1, y1, x2, y2, color, delay }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay: number
}) {
  const midY = (y1 + y2) / 2
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  return (
    <motion.path d={d} fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray="6 4"
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 0.5, pathLength: 1 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    />
  )
}

// ─── Agent node ───────────────────────────────────────────────────────────────

function AgentNodeSVG({ node, isActive, onClick, delay }: {
  node: ReturnType<typeof computeLayout>['nodes'][0]
  isActive: boolean
  onClick: () => void
  delay: number
}) {
  const { agent, x, y } = node
  const color = catColor(agent.category)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.g
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {isActive && (
        <rect x={x - 4} y={y - 4} width={NODE_W + 8} height={NODE_H + 8}
          rx={15} fill={color} opacity={0.08} />
      )}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={12}
        fill={isActive ? '#1e1e22' : '#131316'}
        stroke={isActive ? color : 'rgba(255,255,255,0.08)'}
        strokeWidth={isActive ? 1.5 : 1}
      />

      {/* Logo — bare, no background */}
      <foreignObject x={x + 14} y={y + NODE_H / 2 - 16} width={32} height={32}>
        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {agent.website_domain && !imgError ? (
            <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={() => setImgError(true)} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#a1a1aa' }}>{agent.name[0]}</span>
          )}
        </div>
      </foreignObject>

      {/* Name */}
      <text x={x + 54} y={y + NODE_H / 2 - 6} fontSize={12} fontWeight="600" fill="#f4f4f5"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.name.length > 12 ? agent.name.slice(0, 11) + '…' : agent.name}
      </text>
      {/* Price */}
      <text x={x + 54} y={y + NODE_H / 2 + 12} fontSize={10} fill="#71717a"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`}
      </text>

      {/* Score — bottom right */}
      <rect x={x + NODE_W - 38} y={y + NODE_H - 24} width={32} height={17} rx={8}
        fill={`${color}20`} />
      <text x={x + NODE_W - 22} y={y + NODE_H - 12} textAnchor="middle" fontSize={9}
        fontWeight="700" fill={color} style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.score}
      </text>
    </motion.g>
  )
}

// ─── Category label ───────────────────────────────────────────────────────────

function CategoryLabel({ node, delay }: {
  node: ReturnType<typeof computeLayout>['nodes'][0]; delay: number
}) {
  const color = catColor(node.agent.category)
  return (
    <motion.text
      x={node.cx} y={node.y + NODE_H + 18}
      textAnchor="middle" fontSize={9} fill={color}
      initial={{ opacity: 0 }} animate={{ opacity: 0.75 }}
      transition={{ duration: 0.3, delay: delay + 0.1 }}
      style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: 1.5 }}
    >
      {node.agent.category.toUpperCase()}
    </motion.text>
  )
}

// ─── Detail panel — wider, more breathing room ───────────────────────────────

function DetailPanel({ agent, onClose }: { agent: StackAgent; onClose: () => void }) {
  const color = catColor(agent.category)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isLLM = ['copywriting', 'research', 'coding'].includes(agent.category)

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-0 right-0 h-full bg-[#0e0e11] border-l border-zinc-800/80 overflow-y-auto z-20 flex flex-col"
      style={{ width: 380, boxShadow: '-12px 0 40px rgba(0,0,0,0.6)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            {agent.website_domain && !imgError ? (
              <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
                className="w-8 h-8 object-contain" onError={() => setImgError(true)} />
            ) : (
              <span className="text-base font-bold text-zinc-400">{agent.name[0]}</span>
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-white leading-tight">{agent.name}</p>
            <p className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color }}>{agent.category}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all text-lg">
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 overflow-y-auto">

        {/* Role */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Rôle dans la chaîne</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{agent.role}</p>
        </div>

        {/* Concrete result */}
        <div className="rounded-xl p-4" style={{ background: `${color}0c`, border: `1px solid ${color}28` }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color }}>Résultat concret</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{agent.concrete_result}</p>
        </div>

        {/* Why */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Pourquoi cet outil</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{agent.reason}</p>
        </div>

        {/* Prompt / guide */}
        {agent.prompt_to_use && (
          <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {isLLM ? 'Prompt à utiliser' : 'Comment le prendre en main'}
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(agent.prompt_to_use); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                className="text-[10px] px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
              >
                {copied ? '✓ Copié' : '⎘ Copier'}
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{agent.prompt_to_use}</p>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
          {[
            { label: 'Prix', value: agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois` },
            { label: 'Difficulté', value: agent.setup_difficulty ?? '—' },
            { label: 'Premiers résultats', value: agent.time_to_value ?? '—' },
            { label: 'Score', value: `${agent.score}/100`, accent: true },
          ].map((m, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-lg p-3">
              <p className="text-[10px] text-zinc-500 mb-1">{m.label}</p>
              <p className="text-sm font-medium" style={m.accent ? { color } : { color: '#f4f4f5' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StackRoadmap({ agents, stackName, objective, streamedCount }: Props) {
  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  const visible = streamedCount !== undefined ? sorted.slice(0, streamedCount) : sorted

  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(640)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(containerRef.current)
    setContainerW(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [fullscreen])

  const panelOpen = activeIdx !== null
  const PANEL_W = 380
  const graphW = panelOpen ? Math.max(containerW - PANEL_W, 320) : containerW
  const layout = computeLayout(visible, graphW)

  const inner = (
    <div ref={containerRef} className="relative w-full flex flex-col" style={{ minHeight: layout.canvasH + 56 }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Roadmap d'implémentation</p>
          <p className="text-sm font-semibold text-white">{stackName}</p>
        </div>
        <button
          onClick={() => setFullscreen(f => !f)}
          className="text-[10px] px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          {fullscreen ? '⊠ Quitter plein écran' : '⛶ Plein écran'}
        </button>
      </div>

      {/* Graph area */}
      <div className="relative" style={{ minHeight: layout.canvasH }}>
        <motion.div
          animate={{ width: panelOpen ? `calc(100% - ${PANEL_W}px)` : '100%' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <svg viewBox={`0 0 ${graphW} ${layout.canvasH + 24}`} width="100%"
            style={{ overflow: 'visible', display: 'block' }}>

            {/* Root */}
            <motion.g initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <rect x={layout.rootX} y={layout.rootY} width={ROOT_W} height={ROOT_H} rx={14}
                fill="#18181b" stroke="#CAFF32" strokeWidth={1.5} />
              <text x={layout.rootCX} y={layout.rootY + 23} textAnchor="middle"
                fontSize={12} fontWeight="700" fill="#CAFF32"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {stackName.length > 28 ? stackName.slice(0, 27) + '…' : stackName}
              </text>
              <text x={layout.rootCX} y={layout.rootY + 41} textAnchor="middle"
                fontSize={10} fill="#71717a"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {objective.length > 42 ? objective.slice(0, 41) + '…' : objective}
              </text>
            </motion.g>

            {/* Connectors */}
            {layout.nodes.map((node, i) => (
              <Connector key={node.agent.id + '-c'}
                x1={layout.rootCX} y1={layout.rootBottomY}
                x2={node.cx} y2={node.y}
                color={catColor(node.agent.category)}
                delay={0.15 + i * 0.07}
              />
            ))}

            {/* Nodes */}
            {layout.nodes.map((node, i) => (
              <AgentNodeSVG key={node.agent.id}
                node={node}
                isActive={activeIdx === i}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                delay={0.22 + i * 0.09}
              />
            ))}

            {/* Category labels */}
            {layout.nodes.map((node, i) => (
              <CategoryLabel key={node.agent.id + '-l'} node={node} delay={0.28 + i * 0.09} />
            ))}
          </svg>
        </motion.div>

        <AnimatePresence>
          {activeIdx !== null && sorted[activeIdx] && (
            <DetailPanel agent={sorted[activeIdx]} onClose={() => setActiveIdx(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-5 pt-3 mt-3 border-t border-zinc-800/60 text-xs text-zinc-500 flex-shrink-0">
        <span>Total <span className="text-white font-medium">{agents.reduce((s, a) => s + a.price_from, 0)}€/mois</span></span>
        <span>{agents.length} agents</span>
        {streamedCount !== undefined && streamedCount < agents.length && (
          <span className="text-[#CAFF32] animate-pulse">Génération en cours…</span>
        )}
        <span className="ml-auto opacity-60">Cliquer sur un nœud →</span>
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-zinc-950 overflow-auto p-10"
      >
        {inner}
      </motion.div>
    )
  }

  return inner
}
