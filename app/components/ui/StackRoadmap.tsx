'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_W = 160
const NODE_H = 72
const ROOT_W = 220
const ROOT_H = 56
const H_GAP = 32   // horizontal gap between nodes
const V_GAP = 100  // vertical gap root → agents row

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
function catColor(cat: string) { return CATEGORY_COLOR[cat] ?? '#CAFF32' }

// ─── Layout computation ───────────────────────────────────────────────────────

function computeLayout(agents: StackAgent[]) {
  const n = agents.length
  const totalW = n * NODE_W + (n - 1) * H_GAP
  const canvasW = Math.max(totalW, ROOT_W) + 80
  const canvasH = ROOT_H + V_GAP + NODE_H + 40

  const rootX = canvasW / 2 - ROOT_W / 2
  const rootY = 20

  const startX = canvasW / 2 - totalW / 2
  const agentY = rootY + ROOT_H + V_GAP

  const nodes = agents.map((a, i) => ({
    agent: a,
    x: startX + i * (NODE_W + H_GAP),
    y: agentY,
    cx: startX + i * (NODE_W + H_GAP) + NODE_W / 2,
    cy: agentY + NODE_H / 2,
  }))

  return { canvasW, canvasH, rootX, rootY, rootCX: canvasW / 2, rootCY: rootY + ROOT_H / 2, nodes }
}

// ─── SVG curved connector ─────────────────────────────────────────────────────

function Connector({ x1, y1, x2, y2, color, delay }: {
  x1: number; y1: number; x2: number; y2: number; color: string; delay: number
}) {
  const midY = (y1 + y2) / 2
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray="5 4"
      opacity={0.5}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.5 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    />
  )
}

// ─── Agent node (on canvas) ───────────────────────────────────────────────────

function AgentNodeSVG({ node, isActive, onClick }: {
  node: ReturnType<typeof computeLayout>['nodes'][0]
  isActive: boolean
  onClick: () => void
}) {
  const { agent, x, y } = node
  const color = catColor(agent.category)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.g
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + agent.rank * 0.08 }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Shadow / glow */}
      {isActive && (
        <rect x={x - 2} y={y - 2} width={NODE_W + 4} height={NODE_H + 4}
          rx={14} fill={color} opacity={0.12} />
      )}
      {/* Card background */}
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={12}
        fill={isActive ? '#18181b' : '#111113'}
        stroke={isActive ? color : 'rgba(255,255,255,0.08)'}
        strokeWidth={isActive ? 1.5 : 1}
      />
      {/* Rank badge */}
      <circle cx={x + 18} cy={y + 18} r={10} fill={`${color}22`} stroke={color} strokeWidth={1} />
      <text x={x + 18} y={y + 22} textAnchor="middle" fontSize={9} fontWeight="700" fill={color}>{agent.rank}</text>

      {/* Logo placeholder (rendered as foreignObject for img) */}
      <foreignObject x={x + 34} y={y + 8} width={28} height={28}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {agent.website_domain && !imgError ? (
            <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
              style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={() => setImgError(true)} />
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa' }}>{agent.name[0]}</span>
          )}
        </div>
      </foreignObject>

      {/* Name */}
      <text x={x + 70} y={y + 22} fontSize={11} fontWeight="600" fill="#ffffff"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.name.length > 14 ? agent.name.slice(0, 13) + '…' : agent.name}
      </text>
      {/* Category */}
      <text x={x + 70} y={y + 36} fontSize={9} fill={color}
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.category}
      </text>
      {/* Price */}
      <text x={x + 70} y={y + 50} fontSize={9} fill="#71717a"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`}
      </text>

      {/* Score pill */}
      <rect x={x + NODE_W - 36} y={y + NODE_H - 22} width={30} height={16} rx={8}
        fill={`${color}20`} />
      <text x={x + NODE_W - 21} y={y + NODE_H - 11} textAnchor="middle" fontSize={9}
        fontWeight="700" fill={color} style={{ fontFamily: 'system-ui, sans-serif' }}>
        {agent.score}
      </text>
    </motion.g>
  )
}

// ─── Detail panel (slide-in) ──────────────────────────────────────────────────

function DetailPanel({ agent, onClose }: { agent: StackAgent; onClose: () => void }) {
  const color = catColor(agent.category)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isLLM = ['copywriting', 'research', 'coding'].includes(agent.category)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="absolute top-0 right-0 h-full w-[340px] bg-zinc-950 border-l border-zinc-800 overflow-y-auto z-20 flex flex-col"
      style={{ boxShadow: `-8px 0 32px rgba(0,0,0,0.4)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
            {agent.website_domain && !imgError ? (
              <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
                className="w-5 h-5 object-contain" onError={() => setImgError(true)} />
            ) : (
              <span className="text-xs font-bold text-zinc-400">{agent.name[0]}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{agent.name}</p>
            <p className="text-[10px]" style={{ color }}>{agent.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">×</button>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col gap-5">

        {/* Role in chain */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Rôle dans la chaîne</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{agent.role}</p>
        </div>

        {/* Concrete result */}
        <div className="rounded-lg p-3" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color }}>Résultat concret</p>
          <p className="text-sm text-zinc-200 leading-relaxed">{agent.concrete_result}</p>
        </div>

        {/* Why this tool */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Pourquoi cet outil</p>
          <p className="text-sm text-zinc-400 leading-relaxed">{agent.reason}</p>
        </div>

        {/* How to use / prompt */}
        {agent.prompt_to_use && (
          <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {isLLM ? 'Prompt à utiliser' : 'Comment le prendre en main'}
              </p>
              <button
                onClick={() => copy(agent.prompt_to_use)}
                className="text-[10px] px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
              >
                {copied ? '✓ Copié' : '⎘ Copier'}
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{agent.prompt_to_use}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs pt-1 border-t border-zinc-800">
          <div>
            <p className="text-zinc-500 mb-0.5">Prix</p>
            <p className="text-white font-medium">{agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`}</p>
          </div>
          {agent.setup_difficulty && (
            <div>
              <p className="text-zinc-500 mb-0.5">Difficulté</p>
              <p className="text-white font-medium capitalize">{agent.setup_difficulty}</p>
            </div>
          )}
          {agent.time_to_value && (
            <div>
              <p className="text-zinc-500 mb-0.5">Premiers résultats</p>
              <p className="text-white font-medium">{agent.time_to_value}</p>
            </div>
          )}
          <div>
            <p className="text-zinc-500 mb-0.5">Score</p>
            <p className="font-semibold" style={{ color }}>{agent.score}/100</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StackRoadmap({ agents, stackName, objective }: Props) {
  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(700)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setContainerW(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    setContainerW(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const layout = computeLayout(sorted)
  // Scale layout to fit container
  const scale = Math.min(1, (containerW - (activeIdx !== null ? 340 : 0)) / layout.canvasW)
  const svgW = layout.canvasW
  const svgH = layout.canvasH

  const rootCX = layout.rootCX
  const rootCY = layout.rootY + ROOT_H

  return (
    <div ref={containerRef} className="w-full relative" style={{ minHeight: svgH * scale + 80 }}>

      {/* SVG graph */}
      <div style={{ width: activeIdx !== null ? `calc(100% - 340px)` : '100%', transition: 'width 0.3s ease' }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{ overflow: 'visible', display: 'block' }}
        >
          {/* Root node */}
          <motion.g initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <rect x={layout.rootX} y={layout.rootY} width={ROOT_W} height={ROOT_H} rx={14}
              fill="#18181b" stroke="#CAFF32" strokeWidth={1.5} />
            <text x={rootCX} y={layout.rootY + 22} textAnchor="middle"
              fontSize={11} fontWeight="700" fill="#CAFF32"
              style={{ fontFamily: 'system-ui, sans-serif' }}>
              {stackName.length > 28 ? stackName.slice(0, 27) + '…' : stackName}
            </text>
            <text x={rootCX} y={layout.rootY + 38} textAnchor="middle"
              fontSize={9} fill="#71717a"
              style={{ fontFamily: 'system-ui, sans-serif' }}>
              {objective.length > 40 ? objective.slice(0, 39) + '…' : objective}
            </text>
          </motion.g>

          {/* Connectors */}
          {layout.nodes.map((node, i) => (
            <Connector
              key={node.agent.id}
              x1={rootCX}
              y1={rootCY}
              x2={node.cx}
              y2={node.y}
              color={catColor(node.agent.category)}
              delay={0.2 + i * 0.07}
            />
          ))}

          {/* Agent nodes */}
          {layout.nodes.map((node, i) => (
            <AgentNodeSVG
              key={node.agent.id}
              node={node}
              isActive={activeIdx === i}
              onClick={() => setActiveIdx(activeIdx === i ? null : i)}
            />
          ))}
        </svg>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {activeIdx !== null && (
          <DetailPanel
            agent={sorted[activeIdx]}
            onClose={() => setActiveIdx(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex gap-6 mt-4 pt-3 border-t border-zinc-800 text-sm">
        <div>
          <span className="text-zinc-500 text-xs">Coût total</span>
          <p className="text-white font-semibold">{agents.reduce((s, a) => s + a.price_from, 0)}€/mois</p>
        </div>
        <div>
          <span className="text-zinc-500 text-xs">Agents</span>
          <p className="text-white font-semibold">{agents.length}</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-zinc-500 text-xs">Cliquer sur un nœud pour le détail</span>
        </div>
      </div>
    </div>
  )
}
