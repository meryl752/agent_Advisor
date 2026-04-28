'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getLogoUrl } from '@/lib/utils/logo'
import { useTranslations } from 'next-intl'

const TOOLS = [
    { name: 'Claude', domain: 'claude.ai', color: '#FF6B35' },
    { name: 'Make', domain: 'make.com', color: '#6B4FFF' },
    { name: 'Midjourney', domain: 'midjourney.com', color: '#000' },
    { name: 'Notion', domain: 'notion.so', color: '#000' },
    { name: 'Shopify', domain: 'shopify.com', color: '#96BF48' },
    { name: 'HubSpot', domain: 'hubspot.com', color: '#FF7A59' },
    { name: 'Taplio', domain: 'taplio.com', color: '#4F8EF7' },
    { name: 'Perplexity', domain: 'perplexity.ai', color: '#20B8CD' },
    { name: 'Jasper', domain: 'jasper.ai', color: '#6B4FFF' },
    { name: 'Copy.ai', domain: 'copy.ai', color: '#20B8CD' },
    { name: 'Synthesia', domain: 'synthesia.io', color: '#FF6B35' },
    { name: 'ElevenLabs', domain: 'elevenlabs.io', color: '#000' },
    { name: 'Klaviyo', domain: 'klaviyo.com', color: '#20B8CD' },
    { name: 'Zapier', domain: 'zapier.com', color: '#FF6B35' },
    { name: 'Gorgias', domain: 'gorgias.com', color: '#4F8EF7' },
    { name: 'Tidio', domain: 'tidio.com', color: '#4F8EF7' },
    { name: 'Figma', domain: 'figma.com', color: '#FF6B35' },
    { name: 'Vercel', domain: 'vercel.com', color: '#000' },
    { name: 'Supabase', domain: 'supabase.com', color: '#3ECF8E' },
    { name: 'Stripe', domain: 'stripe.com', color: '#6B4FFF' },
    { name: 'OpenAI', domain: 'openai.com', color: '#10A37F' },
    { name: 'Mistral', domain: 'mistral.ai', color: '#FF6B35' },
    { name: 'Groq', domain: 'groq.com', color: '#FF6B35' },
    { name: 'Gumroad', domain: 'gumroad.com', color: '#000' },
    { name: 'Manychat', domain: 'manychat.com', color: '#4F8EF7' },
    { name: 'Minea', domain: 'minea.com', color: '#6B4FFF' },
    { name: 'Zendrop', domain: 'zendrop.com', color: '#6B4FFF' },
    { name: 'DSers', domain: 'dsers.com', color: '#FF6B35' },
    { name: 'Triple Whale', domain: 'triplewhale.com', color: '#20B8CD' },
    { name: 'Canva', domain: 'canva.com', color: '#4F8EF7' },
    { name: 'CapCut', domain: 'capcut.com', color: '#000' },
    { name: 'Mailchimp', domain: 'mailchimp.com', color: '#FFE01B' },
    { name: 'Airtable', domain: 'airtable.com', color: '#FF6B35' },
    { name: 'Linear', domain: 'linear.app', color: '#5E6AD2' },
    { name: 'Intercom', domain: 'intercom.com', color: '#4F8EF7' },
]

const WORDS = ['Shopify', 'LinkedIn', 'Prospection', 'YouTube', 'SAV', 'SEO', 'SaaS']

const HEADLINES = [
    { prefix: 'Lance ton projet', suffix: 'avec les bons outils IA' },
    { prefix: 'Scale ton business', suffix: 'sans recruter' }
]

const DEMO_SCENARIOS = [
    {
        query: "Je veux lancer une boutique Shopify et automatiser mon service client",
        tools: [
            { name: 'Claude Sonnet', role: 'Fiches produits', price: '0€', color: '#FF6B35', domain: 'claude.ai' },
            { name: 'Midjourney', role: 'Visuels produits', price: '10€', color: '#000', domain: 'midjourney.com' },
            { name: 'Tidio AI', role: 'Chatbot SAV', price: '29€', color: '#4F8EF7', domain: 'tidio.com' },
            { name: 'Make.com', role: 'Automation', price: '9€', color: '#6B4FFF', domain: 'make.com' },
        ],
        metrics: { cost: '48€/mois', roi: '+380%', time: '8h/sem', tools: '4 outils' }
    },
    {
        query: "Je veux créer du contenu LinkedIn et automatiser ma prospection",
        tools: [
            { name: 'ChatGPT', role: 'Posts LinkedIn', price: '20€', color: '#10A37F', domain: 'openai.com' },
            { name: 'Taplio', role: 'Scheduling', price: '39€', color: '#4F8EF7', domain: 'taplio.com' },
            { name: 'Lemlist', role: 'Cold email', price: '59€', color: '#FF6B35', domain: 'lemlist.com' },
            { name: 'Phantombuster', role: 'Scraping', price: '30€', color: '#6B4FFF', domain: 'phantombuster.com' },
        ],
        metrics: { cost: '148€/mois', roi: '+520%', time: '12h/sem', tools: '4 outils' }
    },
    {
        query: "Je veux lancer une chaîne YouTube et automatiser le montage vidéo",
        tools: [
            { name: 'Claude', role: 'Scripts vidéo', price: '0€', color: '#FF6B35', domain: 'claude.ai' },
            { name: 'ElevenLabs', role: 'Voix off IA', price: '22€', color: '#000', domain: 'elevenlabs.io' },
            { name: 'Descript', role: 'Montage auto', price: '24€', color: '#4F8EF7', domain: 'descript.com' },
            { name: 'TubeBuddy', role: 'SEO YouTube', price: '9€', color: '#FF6B35', domain: 'tubebuddy.com' },
        ],
        metrics: { cost: '55€/mois', roi: '+290%', time: '10h/sem', tools: '4 outils' }
    }
]

function RawLogo({ tool }: { tool: typeof TOOLS[0] }) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <div className="w-14 h-14 flex items-center justify-center shrink-0">
            {!imgErr ? (
                <img
                    src={getLogoUrl(tool.domain)}
                    alt={tool.name}
                    className="w-10 h-10 object-contain"
                    onError={() => setImgErr(true)}
                />
            ) : (
                <span className="text-2xl font-black" style={{ color: tool.color }}>
                    {tool.name[0]}
                </span>
            )}
        </div>
    )
}

export default function Hero() {
    const [wordIdx, setWordIdx] = useState(0)
    const [headlineIdx, setHeadlineIdx] = useState(0)
    const [visible, setVisible] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const [windowWidth, setWindowWidth] = useState(0)
    const t = useTranslations('landing')

    // Build translated arrays
    const WORDS = [
        t('hero.word1'), t('hero.word2'), t('hero.word3'), t('hero.word4'),
        t('hero.word5'), t('hero.word6'), t('hero.word7'),
    ]

    const HEADLINES = [
        { prefix: t('hero.headline1Prefix'), suffix: t('hero.headline1Suffix') },
        { prefix: t('hero.headline2Prefix'), suffix: t('hero.headline2Suffix') },
    ]

    // Animation states for demo card
    const [scenarioIdx, setScenarioIdx] = useState(0)
    const [typedText, setTypedText] = useState('')
    const [visibleTools, setVisibleTools] = useState<number[]>([])
    const [isTyping, setIsTyping] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setWordIdx(i => {
                    const next = (i + 1) % WORDS.length
                    // Change headline every 4 words
                    if (next === 0 || next === 4) {
                        setHeadlineIdx(h => (h + 1) % HEADLINES.length)
                    }
                    return next
                })
                setVisible(true)
            }, 300)
        }, 2500)
        return () => clearInterval(interval)
    }, [])

    // Demo card animation - SIMPLIFIED
    useEffect(() => {
        const currentScenario = DEMO_SCENARIOS[scenarioIdx]
        const fullText = currentScenario.query
        
        // Reset state
        setTypedText('')
        setVisibleTools([])
        setIsTyping(true)
        setIsGenerating(false)
        
        let charIndex = 0
        let typingTimer: NodeJS.Timeout
        let toolTimer: NodeJS.Timeout
        
        const typeNextChar = () => {
            if (charIndex < fullText.length) {
                setTypedText(fullText.slice(0, charIndex + 1))
                charIndex++
                typingTimer = setTimeout(typeNextChar, 50)
            } else {
                // Typing done → show green button
                setIsTyping(false)
                // After 600ms → simulate click: start generating
                setTimeout(() => {
                    setIsGenerating(true)
                    // After 1.2s generating → show tools one by one
                    setTimeout(() => {
                        setIsGenerating(false)
                        setVisibleTools([0])
                        setTimeout(() => setVisibleTools([0, 1]), 400)
                        setTimeout(() => setVisibleTools([0, 1, 2]), 800)
                        setTimeout(() => setVisibleTools([0, 1, 2, 3]), 1200)
                        toolTimer = setTimeout(() => {
                            setScenarioIdx((prev) => (prev + 1) % DEMO_SCENARIOS.length)
                        }, 4200)
                    }, 1200)
                }, 600)
            }
        }
        
        typeNextChar()
        
        return () => {
            clearTimeout(typingTimer)
            clearTimeout(toolTimer)
        }
    }, [scenarioIdx])

    return (
        <section className="relative min-h-screen bg-[#FAFAF7] flex items-center overflow-hidden pt-28">

            {/* Gradient mesh background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, #CAFF32 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6B4FFF 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />
            
            {/* Logos scattered in grid cells - balanced left and right */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {isMounted && (() => {
                    const gridSize = 60
                    // Fewer, more spaced out logos on left side (4 columns)
                    const leftPositions = [
                        { col: 0, row: 2 }, { col: 1, row: 6 }, { col: 2, row: 1 }, { col: 3, row: 9 },
                        { col: 0, row: 11 }, { col: 1, row: 4 }, { col: 2, row: 13 }, { col: 3, row: 3 },
                        { col: 0, row: 7 }, { col: 1, row: 14 }, { col: 2, row: 5 }, { col: 3, row: 12 },
                        { col: 0, row: 15 }, { col: 1, row: 9 }, { col: 2, row: 10 }, { col: 3, row: 6 }
                    ]
                    // Same number on right side (4 columns)
                    const rightPositions = [
                        { col: -4, row: 3 }, { col: -3, row: 7 }, { col: -2, row: 2 }, { col: -1, row: 10 },
                        { col: -4, row: 12 }, { col: -3, row: 5 }, { col: -2, row: 14 }, { col: -1, row: 4 },
                        { col: -4, row: 8 }, { col: -3, row: 15 }, { col: -2, row: 6 }, { col: -1, row: 13 },
                        { col: -4, row: 1 }, { col: -3, row: 10 }, { col: -2, row: 11 }, { col: -1, row: 7 }
                    ]
                    
                    return TOOLS.slice(0, 32).map((tool, i) => {
                        const isLeft = i < 16
                        const pos = isLeft ? leftPositions[i] : rightPositions[i - 16]
                        
                        if (!pos) return null
                        
                        // Calculate position from viewport edges
                        const left = isLeft 
                            ? pos.col * gridSize + gridSize / 2
                            : windowWidth + pos.col * gridSize + gridSize / 2
                        const top = pos.row * gridSize + gridSize / 2
                        
                        return (
                            <div 
                                key={i}
                                className="absolute opacity-70 transition-opacity duration-300 hover:opacity-100"
                                style={{
                                    left: `${left}px`,
                                    top: `${top}px`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <RawLogo tool={tool} />
                            </div>
                        )
                    })
                })()}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">

                {/* Headline */}
                <h1 className="font-black text-zinc-900 leading-[1.1] tracking-tight mb-6 animate-fadeUp"
                    style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', animationDelay: '0.1s' }}>
                    {HEADLINES[headlineIdx].prefix}{' '}
                    <br />
                    <span className="relative inline-block px-6 py-2">
                        {/* Torn paper highlight background */}
                        <span 
                            className="absolute inset-0 bg-[#CAFF32] pointer-events-none"
                            style={{
                                clipPath: 'polygon(0% 0%, 2% 5%, 0% 10%, 3% 15%, 0% 20%, 2% 25%, 0% 30%, 3% 35%, 0% 40%, 2% 45%, 0% 50%, 3% 55%, 0% 60%, 2% 65%, 0% 70%, 3% 75%, 0% 80%, 2% 85%, 0% 90%, 3% 95%, 0% 100%, 100% 100%, 98% 95%, 100% 90%, 97% 85%, 100% 80%, 98% 75%, 100% 70%, 97% 65%, 100% 60%, 98% 55%, 100% 50%, 97% 45%, 100% 40%, 98% 35%, 100% 30%, 97% 25%, 100% 20%, 98% 15%, 100% 10%, 97% 5%, 100% 0%)',
                            }}
                        />
                        {/* Rotating word */}
                        <span className="relative z-10 text-zinc-900 font-black">
                            <span className={cn(
                                'inline-block transition-all duration-300',
                                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                            )}>
                                {WORDS[wordIdx]}
                            </span>
                        </span>
                    </span>
                    <br />
                    {HEADLINES[headlineIdx].suffix}
                </h1>

                {/* Subheadline - with scribbled circles around key words */}
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-fadeUp text-center"
                    style={{ animationDelay: '0.2s' }}>
                    {t('hero.subheadline')}{' '}
                    <span className="relative inline-block px-2 mx-1" translate="no">
                        <span className="relative z-10">{t('hero.subheadlineCosts')}</span>
                        <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none" viewBox="0 0 100 60" preserveAspectRatio="none">
                            <ellipse cx="50" cy="30" rx="45" ry="25" fill="none" stroke="#18181b" strokeWidth="2" opacity="0.7" 
                                     style={{ transform: 'rotate(2deg)', transformOrigin: 'center' }} />
                            <ellipse cx="50" cy="30" rx="46" ry="26" fill="none" stroke="#18181b" strokeWidth="2" opacity="0.6" 
                                     style={{ transform: 'rotate(3deg)', transformOrigin: 'center' }} />
                            <ellipse cx="50" cy="30" rx="44" ry="24" fill="none" stroke="#18181b" strokeWidth="2" opacity="0.5" 
                                     style={{ transform: 'rotate(1deg)', transformOrigin: 'center' }} />
                            <ellipse cx="50" cy="30" rx="45.5" ry="25.5" fill="none" stroke="#18181b" strokeWidth="2" opacity="0.6" 
                                     style={{ transform: 'rotate(4deg)', transformOrigin: 'center' }} />
                        </svg>
                    </span>
                    {t('hero.subheadlineEnd')}
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fadeUp"
                    style={{ animationDelay: '0.3s' }}>
                    <Link href="/sign-up"
                        className="bg-zinc-900 text-white font-bold text-sm px-7 py-3 rounded-lg
                       hover:bg-zinc-800 transition-colors
                       flex items-center gap-2">
                        <span>{t('hero.ctaPrimary')}</span>
                    </Link>
                    <a href="#demo"
                        className="flex items-center justify-center gap-2 bg-zinc-50/50 backdrop-blur-sm text-zinc-700 font-medium text-sm px-6 py-3 rounded-lg
                                   hover:bg-zinc-100/50 transition-colors">
                        <span>{t('hero.ctaSecondary')}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </a>
                </div>

                {/* Demo card + bubbles outside */}
                <div id="demo" className="relative max-w-3xl mx-auto animate-fadeUp" style={{ animationDelay: '0.4s' }}>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200 overflow-hidden relative">
                        {/* Browser bar */}
                        <div className="relative flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white rounded-t-2xl">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div suppressHydrationWarning className="flex-1 bg-white border border-zinc-200 rounded-md py-1 px-3 text-xs text-zinc-400 font-mono text-center">
                                app.stackai.co — Construis ton stack
                            </div>
                        </div>

                        {/* Demo content */}
                        <div className="relative p-6 bg-gradient-to-br from-white to-zinc-50/50">
                            {/* Input */}
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-5 text-left flex items-center gap-3 min-h-[64px]">
                                <p className="text-zinc-700 font-medium flex-1 text-sm">
                                    {typedText}
                                    {isTyping && <span className="inline-block w-0.5 h-4 bg-zinc-900 ml-0.5 animate-pulse align-middle" />}
                                </p>
                                {/* Button: green always, spinner while generating */}
                                <button className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#CAFF32] transition-all duration-300">
                                    {isGenerating ? (
                                        <svg className="w-4 h-4 text-zinc-900 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Tool cards */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {DEMO_SCENARIOS[scenarioIdx].tools.map((tool, i) => (
                                    visibleTools.includes(i) ? (
                                        <div key={`card-${scenarioIdx}-${i}`} className="bg-white border border-zinc-200 rounded-xl p-3 text-center animate-fadeUp">
                                            <ToolLogo domain={tool.domain} color={tool.color} name={tool.name} />
                                            <p className="text-xs font-bold text-zinc-900 leading-tight mt-2 mb-1">{tool.name}</p>
                                            <p className="text-[10px] text-zinc-400 mb-1.5">{tool.role}</p>
                                            <p className="text-xs font-bold text-[#22c55e] bg-green-50 rounded-full px-2 py-0.5 inline-block">{tool.price}</p>
                                        </div>
                                    ) : (
                                        <div key={`empty-${i}`} className="h-[130px]" />
                                    )
                                ))}
                            </div>

                            {/* Metrics row - always visible, values change per scenario */}
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400 mb-0.5">Coût total</p>
                                    <p className="font-black text-zinc-900 text-sm transition-all duration-500">
                                        {visibleTools.length === 4 ? DEMO_SCENARIOS[scenarioIdx].metrics.cost : '—'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400 mb-0.5">ROI estimé</p>
                                    <p className="font-black text-sm text-[#22c55e] transition-all duration-500">
                                        {visibleTools.length === 4 ? DEMO_SCENARIOS[scenarioIdx].metrics.roi : '—'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400 mb-0.5">Temps économisé</p>
                                    <p className="font-black text-zinc-900 text-sm transition-all duration-500">
                                        {visibleTools.length === 4 ? DEMO_SCENARIOS[scenarioIdx].metrics.time : '—'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400 mb-0.5">Outils</p>
                                    <p className="font-black text-zinc-900 text-sm transition-all duration-500">
                                        {visibleTools.length === 4 ? DEMO_SCENARIOS[scenarioIdx].metrics.tools : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trusted by logos */}
                <div className="mt-16 animate-fadeUp" style={{ animationDelay: '0.5s' }}>
                    <p className="text-sm text-zinc-400 mb-6 font-medium">
                        {t('hero.trustedBy')}
                    </p>
                    <div className="flex items-center justify-center gap-8 flex-wrap opacity-40 grayscale">
                        {['openai.com', 'anthropic.com', 'google.com', 'groq.com', 'mistral.ai'].map(domain => (
                            <img key={domain}
                                src={getLogoUrl(domain)}
                                alt={domain}
                                className="h-6 object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function ToolLogo({ domain, color, name }: { domain: string; color: string; name: string }) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center mx-auto">
            {!imgErr ? (
                <img src={getLogoUrl(domain)} alt={name} className="w-8 h-8 object-contain" onError={() => setImgErr(true)} />
            ) : (
                <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                    {name[0]}
                </div>
            )}
        </div>
    )
}

function DemoCard({ tool, delay }: { tool: { name: string; role: string; price: string; color: string; domain: string }, delay: number }) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center animate-fadeUp relative"
             style={{ animationDelay: `${delay}ms` }}>
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100
                      flex items-center justify-center mx-auto mb-3">
                {!imgErr ? (
                    <img
                        src={getLogoUrl(tool.domain)}
                        alt={tool.name}
                        className="w-8 h-8 object-contain"
                        onError={() => setImgErr(true)}
                    />
                ) : (
                    <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: tool.color }}>
                        {tool.name[0]}
                    </div>
                )}
            </div>
            <p className="text-sm font-bold text-zinc-900 leading-tight mb-1">{tool.name}</p>
            <p className="text-xs font-bold text-[#22c55e] bg-green-50 rounded-full px-2 py-1 inline-block">{tool.price}</p>
        </div>
    )
}