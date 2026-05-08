'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { getLogoUrl } from '@/lib/utils/logo'
import type { ToolWithSubscription } from '@/types/roi-tracker'

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CAFF32] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[#CAFF32]' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function ToolCard({
  tool,
  onToggle,
  isToggling,
}: {
  tool: ToolWithSubscription
  onToggle: (agentId: string, currentStatus: boolean) => void
  isToggling?: boolean
}) {
  const [imgErr, setImgErr] = useState(false)
  const isActive = tool.subscriptionStatus?.isActive ?? false

  const domain = tool.url
    ? (() => { try { return new URL(tool.url).hostname.replace('www.', '') } catch { return '' } })()
    : ''
  const logoSrc = domain && !imgErr ? getLogoUrl(domain) : null

  const costLabel =
    !tool.price_from || tool.price_from === 0
      ? 'Free'
      : `${tool.price_from}/month`

  const subscriptionUrl = tool.url || null

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-zinc-900/50 p-5 transition-all ${
        isActive
          ? 'border-[#CAFF32]/50 ring-1 ring-[#CAFF32]/20'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={tool.name}
              className="w-full h-full object-cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {tool.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">
                  {tool.name}
                </h3>
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#CAFF32]/20 text-[#8aad00] dark:text-[#CAFF32]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] inline-block" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="flex-shrink-0 pt-0.5">
              <ToggleSwitch
                checked={isActive}
                onChange={() => onToggle(tool.id, isActive)}
                disabled={isToggling}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <span className={`text-sm font-semibold ${
              costLabel === 'Free'
                ? 'text-emerald-500'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}>
              {costLabel}
            </span>

            {subscriptionUrl && (
              <a
                href={subscriptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50]'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {isActive ? 'View Offer' : 'Subscribe'}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
