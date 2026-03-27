'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StackItem {
    name: string
    score: number
    category?: string
    website_domain?: string
}

const CATEGORY_COLORS: Record<string, string> = {
    copywriting: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    image: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
    automation: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    analytics: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
    customer_service: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
    seo: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
    prospecting: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    coding: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    research: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    video: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
}

const TOOL_METADATA: Record<string, { domain: string, category: string }> = {
    'Claude Sonnet': { domain: 'anthropic.com', category: 'copywriting' },
    'Claude': { domain: 'anthropic.com', category: 'copywriting' },
    'Make.com': { domain: 'make.com', category: 'automation' },
    'Make': { domain: 'make.com', category: 'automation' },
    'Perplexity Pro': { domain: 'perplexity.ai', category: 'research' },
    'Perplexity': { domain: 'perplexity.ai', category: 'research' },
    'GPT-4o': { domain: 'openai.com', category: 'research' },
    'Jasper': { domain: 'jasper.ai', category: 'copywriting' },
    'Shopify': { domain: 'shopify.com', category: 'automation' },
}

export default function StackList({ items }: { items: StackItem[] }) {
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

    const finalItems = items.length > 0 ? items : [
        { name: 'Claude Sonnet', score: 92 },
        { name: 'Make.com', score: 85 },
        { name: 'Perplexity Pro', score: 78 },
    ]

    return (
        <div className="flex flex-col gap-3">
            {finalItems.map((item, i) => {
                const meta = TOOL_METADATA[item.name] || TOOL_METADATA[Object.keys(TOOL_METADATA).find(k => item.name.includes(k)) || '']
                const domain = item.website_domain || meta?.domain
                const category = item.category || meta?.category || 'automation'
                const hasError = imgErrors[item.name]

                return (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative flex items-center gap-4 p-4 rounded-none 
                                   bg-[var(--bg)] dark:bg-zinc-900/40 backdrop-blur-md 
                                   border border-zinc-100 dark:border-white/[0.05] 
                                   hover:border-zinc-200 dark:hover:border-white/[0.1] 
                                   transition-all duration-300 shadow-sm dark:shadow-xl overflow-hidden"
                    >
                        {/* Liquid Highlight Effect */}
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Tool Logo */}
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/5 
                                        flex items-center justify-center flex-shrink-0 overflow-hidden 
                                        shadow-inner relative z-10">
                            {domain && !hasError ? (
                                <img
                                    src={`https://img.logo.dev/${domain}?token=pk_aJ8Bl7ROS6-FE3fLWji9tQ`}
                                    alt={item.name}
                                    className="w-7 h-7 object-contain"
                                    onError={() => setImgErrors(prev => ({ ...prev, [item.name]: true }))}
                                />
                            ) : (
                                <span className="font-syne font-black text-sm text-zinc-400 dark:text-zinc-500 uppercase">
                                    {item.name.charAt(0)}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-0.5">
                                    <h4 className="font-syne font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-[#CAFF32] transition-colors">
                                        {item.name}
                                    </h4>
                                    <span className={cn(
                                        "font-dm-mono text-[8px] uppercase tracking-[0.2em] font-black",
                                        "px-2 py-0.5 rounded-sm border w-fit",
                                        CATEGORY_COLORS[category] || 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                    )}>
                                        {category.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="font-syne font-black text-sm text-[#CAFF32] tabular-nums">
                                        {item.score}
                                    </span>
                                    <span className="font-dm-mono text-[8px] text-zinc-400 dark:text-zinc-600 uppercase font-bold">Score</span>
                                </div>
                            </div>

                            {/* Animated Progress Bar */}
                            <div className="h-1.5 bg-black/5 dark:bg-zinc-950 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.score}%` }}
                                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                    className="h-full bg-gradient-to-r from-[#CAFF32] to-[#7FFF00] opacity-80"
                                    style={{ 
                                        boxShadow: '0 0 10px rgba(202, 255, 50, 0.2)' 
                                    }}
                                />
                            </div>
                        </div>

                        {/* Subtle Glow on hover */}
                        <div className="absolute inset-0 rounded-none bg-[#CAFF32]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                )
            })}
        </div>
    )
}
