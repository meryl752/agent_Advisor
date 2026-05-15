import { cn } from '@/lib/utils'

interface MockupWindowProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export default function MockupWindow({ children, title = 'app.stackai.co — Dashboard', className }: MockupWindowProps) {
  return (
    <div className={cn(
      'bg-bg-2 overflow-hidden',
      'shadow-[0_40px_100px_rgba(0,0,0,0.55)]',
      className
    )}>
      {/* Title bar */}
      <div className="bg-bg-2 px-4 py-3 flex items-center gap-2">
        <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#ffbd2e]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        <div className="ml-[10px] flex-1 bg-[#161616] shadow-inner
                        font-dm-mono text-[0.65rem] text-muted
                        py-1 px-[14px] text-center rounded-sm">
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}
