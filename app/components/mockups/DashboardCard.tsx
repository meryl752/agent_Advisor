import { cn } from '@/lib/utils'

interface DashboardMetric {
  label: string
  value: string
  sub: string
  variant?: 'green' | 'orange' | 'default'
}

export default function DashboardCard({ label, value, sub, variant = 'default' }: DashboardMetric) {
  return (
    <div className="bg-bg-3 border border-border px-4 py-[14px]">
      <p className="font-dm-mono text-[0.6rem] text-muted uppercase mb-[6px]">
        {label}
      </p>
      <p className={cn(
        'font-syne font-extrabold text-[1.4rem]',
        variant === 'green' && 'text-accent',
        variant === 'orange' && 'text-accent-2',
        variant === 'default' && 'text-cream',
      )}>
        {value}
      </p>
      <p className="font-dm-mono text-[0.6rem] text-border-2 mt-[3px]">{sub}</p>
    </div>
  )
}
