'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent, ImplementationStep } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'
import { 
  IconExternalLink, IconCopy, IconCheck, IconBell, IconBellOff, 
  IconShare, IconRefresh, IconBolt, IconChevronDown, IconChevronUp,
  IconPencil, IconPlus, IconX, IconDeviceFloppy, IconGripVertical, IconSearch, IconTrash
} from '@tabler/icons-react'

// Dnd-kit imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
  totalCost: number
  roiEstimate: number
  timeSaved: number
  streamedCount?: number
  stackId?: string
  onRegenerate?: () => void
}

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

function ToolLogo({ agent }: { agent: StackAgent }) {
  const [err, setErr] = useState(false)
  
  // Use logo_url if available, otherwise generate from website_domain
  const logoSrc = agent.logo_url || (agent.website_domain ? getLogoUrl(agent.website_domain) : '')
  
  if (logoSrc && !err) {
    return (
      <img src={logoSrc} alt={agent.name}
        className="w-9 h-9 object-contain" onError={() => setErr(true)} />
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
      <span className="text-xs font-bold text-zinc-400 uppercase">{agent.name[0]}</span>
    </div>
  )
}

function AgentDetails({ agent }: { agent: StackAgent }) {
  const color = catColor(agent.category)
  const [promptCopied, setPromptCopied] = useState(false)
  const steps = agent.implementation_steps ?? []
  const logoSrc = agent.logo_url || (agent.website_domain ? getLogoUrl(agent.website_domain) : '')

  return (
    <>
      {/* Tool header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            {logoSrc ? (
              <img src={logoSrc} 
                alt={agent.name} className="w-12 h-12 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-lg font-bold text-zinc-400 uppercase">{agent.name[0]}</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{agent.name}</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ color, background: `${color}15` }}>
                {agent.category}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {agent.price_from === 0 ? 'Free' : `${agent.price_from}€/mo`}
              {' · '}Score {agent.score}
            </p>
          </div>
        </div>
        {agent.url && (
          <a href={agent.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all flex-shrink-0">
            <IconExternalLink size={14} />
            View tool
          </a>
        )}
      </div>

      {/* Role */}
      <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{agent.role}</p>

      {/* Why selected */}
      {agent.reason && (
        <div className="text-sm text-zinc-500 leading-relaxed px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
          {agent.reason}
        </div>
      )}

      {/* Concrete result */}
      {agent.concrete_result && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Résultat attendu</p>
          <div className="text-sm text-zinc-900 dark:text-zinc-100 font-medium p-4 rounded-xl bg-[#CAFF32]/5 border border-[#CAFF32]/20">
            {agent.concrete_result}
          </div>
        </div>
      )}

      {/* Prompt to use */}
      {agent.prompt_to_use && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Prompt recommandé</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(agent.prompt_to_use!)
                setPromptCopied(true)
                setTimeout(() => setPromptCopied(false), 2000)
              }}
              className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              {promptCopied ? <IconCheck size={12} /> : <IconCopy size={12} />}
              {promptCopied ? 'Copié !' : 'Copier le prompt'}
            </button>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 font-mono leading-relaxed whitespace-pre-wrap italic">
            "{agent.prompt_to_use}"
          </div>
        </div>
      )}

      {/* Implementation guide */}
      {steps.length > 0 && (
        <div>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-3">Guide d'implémentation · {steps.length} étapes</p>
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <StepRow key={i} step={step} index={i} color={color} />
            ))}
          </div>
        </div>
      )}

      {steps.length === 0 && (
        <div className="flex items-center gap-2 py-2">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#CAFF32', flexShrink: 0 }}
          />
          <p className="text-xs text-zinc-500 italic">Génération du guide en cours...</p>
        </div>
      )}
    </>
  )
}

function StepRow({ step, index, color }: { step: ImplementationStep; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-3"
    >
      {/* Timeline vertical line + badge */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Step number badge */}
        <div 
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all text-xs font-semibold border z-10 bg-white dark:bg-zinc-950"
          style={{ 
            borderColor: open ? 'rgba(161,161,170,0.4)' : 'rgba(161,161,170,0.2)',
            color: open ? '#3f3f46' : '#a1a1aa'
          }}
        >
          {step.step}
        </div>
        
        {/* Vertical timeline line - only if not last step */}
        <div 
          className="w-px flex-1 mt-1"
          style={{ 
            background: 'linear-gradient(to bottom, rgba(161,161,170,0.2) 0%, rgba(161,161,170,0.1) 50%, rgba(161,161,170,0.05) 100%)'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <button 
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-start gap-3 p-3 text-left group rounded-lg transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {step.title}
              </span>
              {step.source_url && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  Doc
                </span>
              )}
            </div>
          </div>
          
          {/* Chevron */}
          <div className="flex-shrink-0 mt-0.5">
            {open ? <IconChevronUp size={14} className="text-zinc-400" />
                   : <IconChevronDown size={14} className="text-zinc-400" />}
          </div>
        </button>
        
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2 pt-1">
                {/* Details - styled border with beveled corners */}
                <div 
                  className="p-3 mb-2 bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    border: '1px solid rgba(161,161,170,0.2)'
                  }}
                >
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {step.details}
                  </p>
                </div>
                
                {/* Documentation link */}
                {step.source_url && (
                  <a 
                    href={step.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    style={{
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                    }}
                  >
                    <IconExternalLink size={12} />
                    View documentation
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function SortableAgent({ 
  agent, 
  isSelected, 
  isEditing, 
  onClick, 
  onRemove 
}: { 
  agent: StackAgent; 
  isSelected: boolean; 
  isEditing: boolean; 
  onClick: () => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: agent.id, disabled: !isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all relative ${
          isSelected
            ? 'border-l-2 border-zinc-300 dark:border-zinc-600 pl-4 bg-zinc-50 dark:bg-white/[0.02]'
            : 'hover:bg-zinc-50 dark:hover:bg-white/[0.01] border-l-2 border-transparent'
        }`}
      >
        {isEditing && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <IconGripVertical size={16} />
          </div>
        )}
        <button onClick={onClick} className="flex flex-1 items-center gap-2.5 min-w-0 text-left">
          <ToolLogo agent={agent} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-tight truncate ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
              {agent.name}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{agent.price_from === 0 ? 'Free' : `${agent.price_from}€/mo`}</p>
          </div>
        </button>
        
        {isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(agent.id) }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <IconTrash size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function StackArtifact({
  agents, stackName, objective, totalCost, roiEstimate, timeSaved,
  streamedCount, stackId, onRegenerate
}: Props) {
  const [localAgents, setLocalAgents] = useState<StackAgent[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [selected, setSelected] = useState<string | null>(null)
  const [alertsActive, setAlertsActive] = useState(false)
  const [copied, setCopied] = useState(false)

  // Initialize local state from props
  useEffect(() => {
    setLocalAgents(agents)
  }, [agents])

  const sorted = [...localAgents].sort((a, b) => a.rank - b.rank)
  const visible = streamedCount !== undefined ? sorted.slice(0, streamedCount) : sorted
  const selectedAgent = visible.find(a => a.id === selected) ?? visible[0] ?? null

  // Calculate local metrics
  const localTotalCost = visible.reduce((sum, a) => sum + (a.price_from || 0), 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setLocalAgents((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        // Update ranks based on new order
        return newOrder.map((a, i) => ({ ...a, rank: i + 1 }))
      })
    }
  }

  const handleRemoveAgent = (id: string) => {
    setLocalAgents(prev => prev.filter(a => a.id !== id).map((a, i) => ({ ...a, rank: i + 1 })))
    if (selected === id) setSelected(null)
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/agents/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      // Filter out agents already in the stack
      const filtered = (data.agents || []).filter((a: any) => !localAgents.some(la => la.id === a.id))
      setSearchResults(filtered)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddAgent = (a: any) => {
    const newAgent: StackAgent = {
      id: a.id,
      name: a.name,
      category: a.category,
      price_from: a.price_from,
      score: a.score,
      rank: localAgents.length + 1,
      role: a.description || '',
      reason: 'Manually added to stack',
      concrete_result: '',
      website_domain: a.website_domain,
      logo_url: a.logo_url,
      url: a.url || a.website_url,
      implementation_steps: []
    }
    setLocalAgents(prev => [...prev, newAgent])
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    setSelected(newAgent.id)
  }

  const handleSave = async () => {
    if (!stackId) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/stacks/${stackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_ids: localAgents.map(a => a.id)
        })
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => {
          setIsEditing(false)
          setSaveSuccess(false)
        }, 1500)
      } else {
        alert('Failed to save changes')
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div 
      animate={{ x: isEditing ? 40 : 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="flex flex-col gap-5 h-full"
    >

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Recommended stack</p>
          <h2 className="font-syne font-bold text-2xl text-zinc-900 dark:text-white leading-tight">{stackName}</h2>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-md">{objective}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stackId && (
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                isEditing 
                  ? 'bg-[#CAFF32] border-[#CAFF32] text-zinc-900 shadow-lg shadow-[#CAFF32]/20' 
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
              ) : isEditing ? (
                <IconDeviceFloppy size={14} />
              ) : (
                <IconPencil size={14} />
              )}
              {isEditing ? 'Save changes' : 'Edit stack'}
            </button>
          )}
          {isEditing && (
            <button 
              onClick={() => { setIsEditing(false); setLocalAgents(agents) }}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-500 transition-all"
            >
              Cancel
            </button>
          )}
          <button onClick={() => setAlertsActive(a => !a)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              alertsActive ? 'bg-[#CAFF32]/10 border-[#CAFF32]/30 text-[#CAFF32]'
                           : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}>
            {alertsActive ? <IconBell size={14} /> : <IconBellOff size={14} />}
            Alerts
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
            {copied ? <IconCheck size={14} /> : <IconShare size={14} />}
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
              <IconRefresh size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-6 px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Cost</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{totalCost}€<span className="text-sm font-normal text-zinc-500">/mo</span></p>
        </div>
        <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">ROI</p>
          <p className="text-lg font-bold text-[#CAFF32]">+{roiEstimate}%</p>
        </div>
        <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Tools</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{visible.length}</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400">
            <IconBolt size={14} />
            <span className="text-xs">Execution — coming soon</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Floating Search Panel (Left of the card) - Minimalist */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-[calc(100%+24px)] top-0 w-64 flex flex-col gap-4 z-50"
            >
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Rechercher un outil..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide max-h-[400px]">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-4 h-4 border-2 border-zinc-500/20 border-t-zinc-500 rounded-full animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {searchResults.map((a) => {
                      const logoSrc = a.logo_url || (a.website_domain ? getLogoUrl(a.website_domain) : '')
                      return (
                      <button 
                        key={a.id}
                        onClick={() => handleAddAgent(a)}
                        className="group flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 transition-all text-left border border-transparent active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                          {logoSrc ? (
                            <img src={logoSrc} 
                              className="w-full h-full object-contain" onError={e => (e.currentTarget.style.display='none')} />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                               <span className="text-[10px] font-bold text-zinc-400 uppercase">{a.name[0]}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">{a.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate">{a.category}</p>
                        </div>
                        <IconPlus size={14} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      )
                    })}
                  </div>
                ) : searchQuery.length >= 2 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-[10px] text-zinc-500 italic">Aucun résultat</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-5 flex-1 min-h-0" style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}>
          {/* Column 2: Tool List (Reorderable) */}
          <div className="w-60 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto scrollbar-hide pr-2">
            {isEditing && (
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">Votre stack</h3>
            )}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={visible.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {visible.map((agent) => (
                <SortableAgent 
                  key={agent.id}
                  agent={agent}
                  isEditing={isEditing}
                  isSelected={(selected ?? visible[0]?.id) === agent.id}
                  onClick={() => setSelected(agent.id)}
                  onRemove={handleRemoveAgent}
                />
              ))}
            </SortableContext>
          </DndContext>

          {streamedCount !== undefined && streamedCount < localAgents.length && !isEditing && (
            <div className="flex items-center gap-2 px-3 py-2">
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#CAFF32', flexShrink: 0 }}
              />
              <p className="text-[10px] text-zinc-500">Chargement...</p>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <AnimatePresence mode="wait">
          {selectedAgent && (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto scrollbar-hide rounded-xl border border-zinc-100 dark:border-zinc-800/60 p-5 flex flex-col gap-4"
            >
              <AgentDetails agent={selectedAgent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </motion.div>
)
}
