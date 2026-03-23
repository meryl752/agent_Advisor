import type { StackItem } from '@/types'

const DEFAULT_ITEMS: StackItem[] = [
  { name: 'Claude Sonnet', score: 92 },
  { name: 'Make.com', score: 85 },
  { name: 'Perplexity Pro', score: 78 },
]

export default function StackList({ items }: { items?: StackItem[] }) {
  const data = items ?? DEFAULT_ITEMS

  return (
    <div className="bg-bg-3 border border-border px-4 py-[14px]">
      <p className="font-dm-mono text-[0.6rem] text-muted tracking-[0.08em] uppercase mb-[10px]">
        Ton stack actuel
      </p>
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-[10px] py-[7px] border-b border-[#161616] last:border-b-0">
          <span className="font-dm-mono text-[0.68rem] text-[#999]">{item.name}</span>
          <div className="flex-1 h-[3px] bg-border-2">
            <div className="h-full bg-accent opacity-60" style={{ width: `${item.score}%` }} />
          </div>
          <span className="font-syne font-bold text-[0.75rem] text-accent">{item.score}</span>
        </div>
      ))}
    </div>
  )
}