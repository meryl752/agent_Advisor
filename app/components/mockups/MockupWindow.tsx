import { cn } from '@/lib/utils'

interface MockupWindowProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export default function MockupWindow({ children, title = 'app.stackai.co — Dashboard', className }: MockupWindowProps) {
  return (
    <div className={cn(
      'bg-bg-2 border border-border-2 overflow-hidden',
      'shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(200,241,53,0.06)]',
      className
    )}>
      {/* Title bar */}
      <div className="bg-bg-2 border-b border-border px-4 py-3 flex items-center gap-2">
        <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        <div className="ml-[10px] flex-1 bg-[#161616] border border-border
                        font-dm-mono text-[0.65rem] text-muted
                        py-1 px-[14px] text-center">
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}
