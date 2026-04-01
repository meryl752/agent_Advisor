'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
  /** Stream mode: agents arrive one by one */
  streamedCount?: number
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_W = 148
const NODE_H = 64
const ROOT_W = 200
const ROOT_H = 52
const H_GAP = 28
const V_GAP = 90

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
  const rootY = 16
  const agentY = rootY + ROOT_H + V_GAP

  const nodes = agents.map((a, i) => ({
    agent: a,
    x: startX + i * (NODE_W + H_GAP),
    y: agentY,
    cx: startX + i * (NODE_W + H_GAP) + NODE_W / 2,
    cy: agentY + NODE_H / 2,
  }))

  return {
    canvasH: agentY + NODE_H + 16,
    rootX, rootY,
    rootCX: canvasW / 2,
    rootBottomY: rootY + ROOT_H,
    nodes,
  }
}

// ─── SVG curved connector ─────────────────────────────────────────────────────

function Connector({ x1, y1, x2, y2, color, delay }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay: number
}) {
  const midY = (y1 + y2) / 2
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  return (
    <motion.path d={d} fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray="5 4" opacity={0}
      animate={{ opacity: 0.45 }}
      transition={{ duration: 0.5, delay }}
    >
      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1.2s" begin={`${delay}s`} fill="freeze" />
    </motion.path>
  )
}

// ─── Agent node (SVG) ─────────────────────────────────────────────────────────

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Glow when active */}
      {isActive && (
        <rect x={x - 3} y={y - 3} width={NODE_W + 6} height={NODE_H + 6}
          rx={13} fill={color} opacity={0.1} />
      )}
      {/* Card */}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={11}
        fill={isActive ? '#1c1c1f' : '#111113'}
        stroke={isActive ? color : 'rgba(255,255,255,0.09)'}
        strokeWidth={isActive ? 1.5 : 1}
      />

      {/* Logo — no background, just the image */}
      <foreignObject x={x + 12} y={y + NODE_H / 2 - 14} width={28} height={28}>
        <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {agent.website_domain && !imgError ? (
            <img
              src={getLogoUrl(agent.website_domain)}
              alt={agent.name}
              style={{ width: 24, height: 24, objectFit: 'contain' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#a1a1aa' }}>{agent.name[0]}</span>
          )}
        </div>
      </foreignObject>

      {/* Name */}
      <text x={x + 48} y={y + NODE_H / 2 - 4} fontSize={11} fontWeight="600" fill="#ffffff"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.name.length > 13 ? agent.name.slice(0, 12) + '…' : agent.name}
      </text>
      {/* Price */}
      <text x={x + 48} y={y + NODE_H / 2 + 12} fontSize={9} fill="#71717a"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`}
      </text>

      {/* Score pill — bottom right */}
      <rect x={x + NODE_W - 34} y={y + NODE_H - 20} width={28} height={14} rx={7}
        fill={`${color}22`} />
      <text x={x + NODE_W - 20} y={y + NODE_H - 10} textAnchor="middle" fontSize={8}
        fontWeight="700" fill={color} style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.score}
      </text>
    </motion.g>
  )
}

// ─── Category label under each node ──────────────────────────────────────────

function CategoryLabel({ node, delay }: {
  node: ReturnType<typeof computeLayout>['nodes'][0]
  delay: number
}) {
  const color = catColor(node.agent.category)
  return (
    <motion.text
      x={node.cx} y={node.y + NODE_H + 14}
      textAnchor="middle" fontSize={9} fill={color} opacity={0}
      animate={{ opacity: 0.8 }}
      transition={{ duration: 0.3, delay: delay + 0.1 }}
      style={{ fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}
    >
      {node.agent.category}
    </motion.text>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ agent, onClose }: { agent: StackAgent; onClose: () => void }) {
  const color = catColor(agent.category)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)
  const isLLM = ['copywriting', 'research', 'coding'].includes(agent.category)

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-0 right-0 h-full w-[320px] bg-zinc-950 border-l border-zinc-800 overflow-y-auto z-20 flex flex-col"
      style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            {agent.website_domain && !imgError ? (
              <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
                className="w-6 h-6 object-contain" onError={() => setImgError(true)} />
            ) : (
              <span className="text-sm font-bold text-zinc-400">{agent.name[0]}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{agent.name}</p>
            <p className="text-[10px] uppercase tracking-wider" style={{ color }}>{agent.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center">×</button>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Rôle dans la chaîne</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{agent.role}</p>
        </div>

        <div className="rounded-lg p-3" style={{ background: `${color}0d`, border: `1px solid ${color}30` }}>
          <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color }}>Résultat concret</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{agent.concrete_result}</p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Pourquoi cet outil</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{agent.reason}</p>
        </div>

        {agent.prompt_to_use && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {isLLM ? 'Prompt à utiliser' : 'Prise en main'}
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(agent.prompt_to_use); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                className="text-[10px] px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
              >
                {copied ? '✓ Copié' : '⎘ Copier'}
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{agent.prompt_to_use}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs pt-2 border-t border-zinc-800">
          <div><p className="text-zinc-500 mb-0.5">Prix</p><p className="text-white font-medium">{agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`}</p></div>
          {agent.setup_difficulty && <div><p className="text-zinc-500 mb-0.5">Difficulté</p><p className="text-white font-medium capitalize">{agent.setup_difficulty}</p></div>}
          {agent.time_to_value && <div><p className="text-zinc-500 mb-0.5">Premiers résultats</p><p className="text-white font-medium">{agent.time_to_value}</p></div>}
          <div><p className="text-zinc-500 mb-0.5">Score</p><p className="font-semibold" style={{ color }}>{agent.score}/100</p></div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StackRoadmap({ agents, stackName, objective, streamedCount }: Props) {
  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  // In stream mode, only show agents up to streamedCount
  const visible = streamedCount !== undefined ? sorted.slice(0, streamedCount) : sorted

  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(600)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setContainerW(e[0].contentRect.width))
    ro.observe(containerRef.current)
    setContainerW(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [fullscreen])

  const panelOpen = activeIdx !== null
  const graphW = panelOpen ? Math.max(containerW - 320, 300) : containerW
  const layout = computeLayout(visible, graphW)

  const wrapper = (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col"
      style={{ minHeight: layout.canvasH + 48 }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Roadmap</p>
          <p className="text-sm font-semibold text-white">{stackName}</p>
        </div>
        <button
          onClick={() => setFullscreen(f => !f)}
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          {fullscreen ? '⊠ Quitter plein écran' : '⛶ Plein écran'}
        </button>
      </div>

      {/* Graph + detail panel */}
      <div className="relative flex-1" style={{ minHeight: layout.canvasH }}>
        {/* SVG */}
        <motion.div
          animate={{ width: panelOpen ? `calc(100% - 320px)` : '100%' }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <svg
            viewBox={`0 0 ${graphW} ${layout.canvasH + 20}`}
            width="100%"
            style={{ overflow: 'visible', display: 'block' }}
          >
            {/* Root node */}
            <motion.g initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <rect x={layout.rootX} y={layout.rootY} width={ROOT_W} height={ROOT_H} rx={12}
                fill="#18181b" stroke="#CAFF32" strokeWidth={1.5} />
              <text x={layout.rootCX} y={layout.rootY + 20} textAnchor="middle"
                fontSize={11} fontWeight="700" fill="#CAFF32"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {stackName.length > 26 ? stackName.slice(0, 25) + '…' : stackName}
              </text>
              <text x={layout.rootCX} y={layout.rootY + 36} textAnchor="middle"
                fontSize={9} fill="#71717a"
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {objective.length > 38 ? objective.slice(0, 37) + '…' : objective}
              </text>
            </motion.g>

            {/* Connectors */}
            {layout.nodes.map((node, i) => (
              <Connector
                key={node.agent.id + '-line'}
                x1={layout.rootCX} y1={layout.rootBottomY}
                x2={node.cx} y2={node.y}
                color={catColor(node.agent.category)}
                delay={0.15 + i * 0.06}
              />
            ))}

            {/* Agent nodes */}
            {layout.nodes.map((node, i) => (
              <AgentNodeSVG
                key={node.agent.id}
                node={node}
                isActive={activeIdx === i}
                onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                delay={0.2 + i * 0.08}
              />
            ))}

            {/* Category labels under nodes */}
            {layout.nodes.map((node, i) => (
              <CategoryLabel key={node.agent.id + '-cat'} node={node} delay={0.25 + i * 0.08} />
            ))}
          </svg>
        </motion.div>

        {/* Detail panel */}
        <AnimatePresence>
          {activeIdx !== null && sorted[activeIdx] && (
            <DetailPanel agent={sorted[activeIdx]} onClose={() => setActiveIdx(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex gap-5 pt-3 mt-2 border-t border-zinc-800 text-xs text-zinc-500 flex-shrink-0">
        <span>Coût total <span className="text-white font-medium">{agents.reduce((s, a) => s + a.price_from, 0)}€/mois</span></span>
        <span>{agents.length} agents</span>
        {streamedCount !== undefined && streamedCount < agents.length && (
          <span className="text-[#CAFF32] animate-pulse">Génération en cours…</span>
        )}
        <span className="ml-auto">Cliquer sur un nœud pour le détail →</span>
      </div>
    </div>
  )

  // Fullscreen overlay
  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-zinc-950 overflow-auto p-8"
        >
          {wrapper}
        </motion.div>
      </AnimatePresence>
    )
  }

  return wrapper
}
