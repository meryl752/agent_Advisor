'use client'

interface FlowAgent {
  name: string
  role: string
  website_domain?: string
  rank: number
}

interface StackFlowProps {
  agents: FlowAgent[]
  stackName: string
}

const COLORS = [
  { bg: 'rgba(200,241,53,0.08)',  border: 'rgba(200,241,53,0.4)',  text: '#C8F135' },
  { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.4)',  text: '#38bdf8' },
  { bg: 'rgba(255,107,43,0.08)',  border: 'rgba(255,107,43,0.4)',  text: '#ff6b2b' },
  { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.4)', text: '#a78bfa' },
  { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.4)',  text: '#34d399' },
  { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.4)',  text: '#fbbf24' },
]

export default function StackFlow({ agents, stackName }: StackFlowProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  
  return (
    <div className="border border-border bg-bg-2 p-5">
      <p className="font-dm-mono text-[0.65rem] text-muted uppercase tracking-[0.1em] mb-4">
        Flux d'exécution — {stackName}
      </p>

      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {agents.map((agent, i) => {
          const color = COLORS[i % COLORS.length]
          const isHovered = hoveredIdx === i

          return (
            <div key={i} className="flex items-center flex-shrink-0">
              {/* Node */}
              <div
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="flex flex-col items-center gap-2 cursor-default transition-transform duration-200"
                style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
              >
                {/* Logo circle */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-2 relative overflow-hidden"
                  style={{
                    background: color.bg,
                    borderColor: color.border,
                    boxShadow: isHovered ? `0 0 20px ${color.border}` : 'none',
                  }}
                >
                  {agent.website_domain ? (
                    <img
                      src={`https://logo.clearbit.com/${agent.website_domain}`}
                      alt={agent.name}
                      className="w-8 h-8 object-contain"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="font-syne font-extrabold text-lg" style={{ color: color.text }}>
                      {agent.name.charAt(0)}
                    </span>
                  )}

                  {/* Step number */}
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: color.text }}
                  >
                    <span className="font-syne font-extrabold text-[0.6rem] text-bg">
                      {agent.rank}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="text-center max-w-[80px]">
                  <p className="font-syne font-bold text-[0.72rem] text-cream leading-tight text-center">
                    {agent.name}
                  </p>
                  {isHovered && (
                    <p className="font-dm-mono text-[0.55rem] text-center leading-tight mt-1"
                       style={{ color: color.text }}>
                      {agent.role.length > 40 ? agent.role.slice(0, 40) + '...' : agent.role}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector arrow */}
              {i < agents.length - 1 && (
                <div className="flex items-center mx-2 flex-shrink-0">
                  <div className="w-8 h-[1px] bg-border-2" />
                  <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px]
                                  border-t-transparent border-b-transparent border-l-border-2" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="font-dm-mono text-[0.6rem] text-muted mt-3 tracking-[0.06em]">
        ↑ Passe la souris sur un agent pour voir son rôle
      </p>
    </div>
  )
}

// Need to import useState
import { useState } from 'react'