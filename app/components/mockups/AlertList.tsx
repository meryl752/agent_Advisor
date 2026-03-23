import { cn } from '@/lib/utils'
import type { AlertItem } from '@/types'

const DEFAULT_ALERTS: AlertItem[] = [
  {
    type: 'success',
    title: 'GPT-4o',
    message: 'vient de baisser ses prix de 50%. Ton stack peut être optimisé.',
    time: 'Il y a 2 minutes',
  },
  {
    type: 'warning',
    title: 'Jasper AI',
    message: "est remplacé avantageusement par Claude Sonnet pour ton cas d'usage.",
    time: 'Il y a 1 heure',
  },
  {
    type: 'info',
    title: 'Nouvelle recommendation',
    message: '— Perplexity Pages correspond à ton objectif SEO.',
    time: "Aujourd'hui 09:14",
  },
]

const VARIANT_STYLES = {
  success: {
    border: 'border-l-accent',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    icon: '↓',
  },
  warning: {
    border: 'border-l-accent-2',
    iconBg: 'bg-accent-2/10',
    iconColor: 'text-accent-2',
    icon: '!',
  },
  info: {
    border: 'border-l-accent-3',
    iconBg: 'bg-accent-3/10',
    iconColor: 'text-accent-3',
    icon: '★',
  },
}

export default function AlertList({ items }: { items?: AlertItem[] }) {
  const data = items ?? DEFAULT_ALERTS

  return (
    <div className="flex flex-col gap-2 p-4">
      {data.map((item: AlertItem, i: number) => {
        const s = VARIANT_STYLES[item.type as keyof typeof VARIANT_STYLES]
        return (
          <div
            key={i}
            className={cn(
              'bg-bg-3 border border-border border-l-2 px-[14px] py-[10px]',
              'flex items-start gap-[10px]',
              s.border
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center',
              'text-[0.65rem] flex-shrink-0',
              s.iconBg, s.iconColor
            )}>
              {s.icon}
            </div>
            <div>
              <p className="font-dm-mono text-[0.62rem] text-[#777] leading-[1.5]">
                <strong className="text-cream font-normal">{item.title}</strong>{' '}
                {item.message}
              </p>
              <p className="font-dm-mono text-[0.55rem] text-muted mt-[2px]">{item.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}