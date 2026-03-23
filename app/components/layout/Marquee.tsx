import { MARQUEE_ITEMS } from '@/lib/constants'

export default function Marquee() {
  // Duplicate items for seamless loop
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div className="border-t border-b border-border overflow-hidden py-[18px] bg-bg-2">
      <div className="flex gap-0 animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-[10px] px-8 border-r border-border"
          >
            <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
            <span className="font-dm-mono text-[0.7rem] text-muted tracking-[0.08em] uppercase">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
