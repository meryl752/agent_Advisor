import { cn } from '@/lib/utils'

interface WFNode {
  label: string
  top: number
  left?: number
  right?: number
  variant?: 'active' | 'orange' | 'default'
}

const NODES: WFNode[] = [
  { label: 'Input utilisateur', top: 18, left: 20, variant: 'active' },
  { label: 'Claude Sonnet', top: 18, left: 175 },
  { label: 'Make.com', top: 18, right: 20, variant: 'active' },
  { label: 'Perplexity', top: 90, left: 20, variant: 'orange' },
  { label: 'Google Calendar', top: 90, left: 175 },
  { label: 'Telegram Bot', top: 90, right: 20, variant: 'active' },
  { label: 'Canva AI', top: 160, left: 20 },
  { label: 'Buffer AI', top: 160, left: 175, variant: 'active' },
  { label: 'Analytics', top: 160, right: 20, variant: 'orange' },
]

export default function WorkflowVisualizer() {
  return (
    <div className="relative p-4 h-full overflow-hidden">
      {NODES.map((node, i) => (
        <div
          key={i}
          className={cn(
            'absolute bg-bg-3 border font-dm-mono text-[0.6rem] px-3 py-[5px] whitespace-nowrap',
            node.variant === 'active' && 'border-accent/40 text-accent',
            node.variant === 'orange' && 'border-accent-2/30 text-accent-2',
            node.variant === 'default' || !node.variant ? 'border-border text-[#999]' : ''
          )}
          style={{
            top: node.top,
            ...(node.left !== undefined ? { left: node.left } : {}),
            ...(node.right !== undefined ? { right: node.right } : {}),
          }}
        >
          {node.label}
        </div>
      ))}

      {/* Connector lines */}
      {[
        { top: 28, left: 134, width: 38, active: true },
        { top: 28, left: 248, width: 40 },
        { top: 100, left: 110, width: 62 },
        { top: 100, left: 248, width: 40, active: true },
        { top: 170, left: 97, width: 75 },
        { top: 170, left: 248, width: 40, active: true },
      ].map((line, i) => (
        <div
          key={i}
          className={cn('absolute h-px', line.active ? 'bg-accent/20' : 'bg-border-2')}
          style={{ top: line.top, left: line.left, width: line.width }}
        />
      ))}

      {/* Dots */}
      {[{ top: 25, left: 134 }, { top: 97, left: 174 }].map((dot, i) => (
        <div
          key={i}
          className="absolute w-[6px] h-[6px] rounded-full bg-accent"
          style={{ top: dot.top, left: dot.left }}
        />
      ))}
    </div>
  )
}
