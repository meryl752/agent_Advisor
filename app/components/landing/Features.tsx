'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Spotlight } from '../ui/spotlight'
import { AnimatedBeam } from '../ui/animated-beam'
import { NumberTicker } from '../ui/number-ticker'
import { TextGenerateEffect } from '../ui/text-generate-effect'
import { getLogoUrl } from '@/lib/utils/logo'
import { useTranslations } from 'next-intl'

// ─── Bento cards data ────────────────────────────────────────────────────────

const CARDS = [
    {
        id: '01',
        col: 'md:col-span-2',
        accent: '#CAFF32',
        tag: 'Recommandation IA',
        title: 'Ton stack parfait en 30 secondes',
        description: 'Notre moteur analyse ton objectif et valide la meilleure combinaison parmi +200 outils IA — coûts, ROI et workflow inclus.',
        visual: 'search',
    },
    {
        id: '02',
        col: 'md:col-span-1',
        accent: '#FF6B35',
        tag: 'ROI Tracker',
        title: 'Vois ton retour sur investissement en temps réel',
        description: 'Temps économisé, coûts évités, gains estimés. Le chiffre qui justifie chaque euro.',
        visual: 'roi',
    },
    {
        id: '03',
        col: 'md:col-span-1',
        accent: '#6B4FFF',
        tag: 'Stack Alerts',
        title: 'Alertes intelligentes sur ton stack',
        description: 'Un outil baisse ses prix ? Un meilleur concurrent sort ? Tu reçois une alerte et tu switches en un clic.',
        visual: 'alerts',
    },
    {
        id: '04',
        col: 'md:col-span-2',
        accent: '#20B8CD',
        tag: 'Workflow Visualizer',
        title: 'Visualise comment tes outils s\'interconnectent',
        description: 'De l\'idée à l\'exécution. Observe comment ChatGPT, Make et ton CRM s\'enchaînent sur un canvas clair.',
        visual: 'flow',
    },
    {
        id: '05',
        col: 'md:col-span-1',
        accent: '#CAFF32',
        tag: 'Audit & Score',
        title: 'Score 0-100 sur ta stack chaque mois',
        description: 'Audit automatique mensuel : on note ta config et on te dit exactement quoi désabonner.',
        visual: 'score',
    },
]

// ─── Visuals ─────────────────────────────────────────────────────────────────

function SearchVisual({ accent }: { accent: string }) {
    return (
        <div className="relative h-full min-h-[160px] flex items-center justify-center p-6 overflow-hidden">
            <Spotlight fill={accent} />
            <div className="w-full max-w-xs relative z-10">
                <div className="bg-white/90 shadow-sm border border-zinc-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: accent }} />
                    <p className="text-xs text-zinc-600 font-medium">Je veux lancer une boutique Shopify...</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { name: 'Claude', domain: 'claude.ai' },
                        { name: 'Tidio', domain: 'tidio.com' },
                        { name: 'Make', domain: 'make.com' },
                    ].map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.15, type: 'spring', bounce: 0.4 }}
                            className="bg-white border border-zinc-200 rounded-lg p-2 text-center shadow-sm"
                        >
                            <div className="w-7 h-7 rounded-md mx-auto mb-1 flex items-center justify-center bg-zinc-50 border border-zinc-100">
                                <img src={getLogoUrl(t.domain)} alt={t.name} className="w-5 h-5 object-contain"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            </div>
                            <p className="text-[10px] font-semibold text-zinc-700">{t.name}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ROIVisual({ accent }: { accent: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    return (
        <div ref={ref} className="p-6 flex flex-col gap-3 min-h-[120px]">
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Temps économisé</span>
                <span className="font-black text-zinc-900 text-lg">
                    {inView && <NumberTicker value={8} className="font-black" />}h/sem
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">ROI estimé</span>
                <span className="font-black text-lg" style={{ color: accent }}>
                    +{inView && <NumberTicker value={380} className="font-black" />}%
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Coût mensuel</span>
                <span className="font-black text-zinc-900 text-lg">
                    {inView && <NumberTicker value={48} className="font-black" />}€
                </span>
            </div>
        </div>
    )
}

function AlertsVisual({ accent }: { accent: string }) {
    return (
        <div className="p-4 flex flex-col gap-2 min-h-[120px]">
            {[
                { text: 'GPT-4o a baissé ses prix de 50%', color: '#22c55e', time: 'Il y a 2h' },
                { text: 'Jasper → remplacer par Claude', color: '#FF6B35', time: 'Hier' },
                { text: 'Nouveau: Perplexity Pages', color: accent, time: 'Cette semaine' },
            ].map((alert, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2"
                >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: alert.color }} />
                    <p className="text-xs text-zinc-600 flex-1">{alert.text}</p>
                    <span className="text-[10px] text-zinc-400">{alert.time}</span>
                </motion.div>
            ))}
        </div>
    )
}

function FlowVisual({ accent }: { accent: string }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const r1 = useRef<HTMLDivElement>(null)
    const r2 = useRef<HTMLDivElement>(null)
    const r3 = useRef<HTMLDivElement>(null)
    const r4 = useRef<HTMLDivElement>(null)

    const tools = [
        { name: 'Claude', domain: 'claude.ai', ref: r1 },
        { name: 'Make', domain: 'make.com', ref: r2 },
        { name: 'Notion', domain: 'notion.so', ref: r3 },
        { name: 'HubSpot', domain: 'hubspot.com', ref: r4 },
    ]

    return (
        <div ref={containerRef} className="relative flex items-center justify-between px-8 py-6 min-h-[100px] w-full">
            {tools.map((t) => (
                <div key={t.name} ref={t.ref}
                    className="z-10 w-12 h-12 bg-white border-2 rounded-2xl flex items-center justify-center shadow-md overflow-hidden"
                    style={{ borderColor: accent + '60' }}>
                    <img src={getLogoUrl(t.domain)} alt={t.name} className="w-7 h-7 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
            ))}
            <AnimatedBeam containerRef={containerRef} fromRef={r1} toRef={r2} gradientStartColor={accent} gradientStopColor={accent} pathOpacity={0.15} />
            <AnimatedBeam containerRef={containerRef} fromRef={r2} toRef={r3} gradientStartColor={accent} gradientStopColor={accent} pathOpacity={0.15} duration={3} delay={1} />
            <AnimatedBeam containerRef={containerRef} fromRef={r3} toRef={r4} gradientStartColor={accent} gradientStopColor={accent} pathOpacity={0.15} duration={4} delay={0.5} />
        </div>
    )
}

function ScoreVisual({ accent }: { accent: string }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true })
    const score = 84
    const circumference = 2 * Math.PI * 34
    const offset = circumference - (score / 100) * circumference

    return (
        <div ref={ref} className="flex items-center justify-center p-6 min-h-[120px] gap-6">
            <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="#f4f4f5" strokeWidth="8" fill="none" />
                    <motion.circle
                        cx="40" cy="40" r="34"
                        stroke={accent} strokeWidth="8" fill="none"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={inView ? { strokeDashoffset: offset } : {}}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-black text-xl text-zinc-900">
                        {inView && <NumberTicker value={score} />}
                    </span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                {[
                    { label: 'Pertinence', val: 92 },
                    { label: 'Coût/ROI', val: 78 },
                    { label: 'Intégration', val: 85 },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 w-20">{item.label}</span>
                        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: accent }}
                                initial={{ width: 0 }}
                                animate={inView ? { width: `${item.val}%` } : {}}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600">{item.val}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function CardVisual({ type, accent }: { type: string; accent: string }) {
    if (type === 'search') return <SearchVisual accent={accent} />
    if (type === 'roi') return <ROIVisual accent={accent} />
    if (type === 'alerts') return <AlertsVisual accent={accent} />
    if (type === 'flow') return <FlowVisual accent={accent} />
    return <ScoreVisual accent={accent} />
}

// ─── Feature row (text left, card right) ─────────────────────────────────────

function FeatureRow({ card, index }: { card: typeof CARDS[0], index: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative grid grid-cols-1 md:grid-cols-2 gap-0 py-16"
        >
            {/* Separator line with traveling light */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-200 overflow-visible">
                        {/* Base glow layer */}
                        <div
                            className="absolute -top-1 h-[3px] w-48 animate-line-light"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${card.accent}40, ${card.accent}, ${card.accent}40, transparent)`,
                                filter: `blur(2px)`,
                                animationDelay: `${index * 1.2}s`,
                                animationDuration: '4s',
                            }}
                        />
                        {/* Sharp bright core */}
                        <div
                            className="absolute top-0 h-px w-48 animate-line-light"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${card.accent}, ${card.accent}, transparent)`,
                                animationDelay: `${index * 1.2}s`,
                                animationDuration: '4s',
                            }}
                        />
                    </div>
            {/* Left — number + text */}
            <div className="flex flex-col justify-center pr-0 md:pr-16">
                <div className="flex items-center gap-4 mb-5">
                    {/* Number — tall green pill */}
                    <div className="flex items-center justify-center px-3 py-2 rounded-xl shrink-0"
                        style={{ background: '#CAFF3215' }}>
                        <span className="font-black text-3xl leading-none tracking-tighter"
                            style={{ color: '#CAFF32', WebkitTextStroke: '0px', fontVariantNumeric: 'tabular-nums' }}>
                            {card.id}
                        </span>
                    </div>
                    {/* Tag */}
                    <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-500">
                        {card.tag}
                    </span>
                </div>
                <h3 className="font-black text-zinc-900 text-2xl tracking-tight mb-3 leading-tight">
                    {card.title}
                </h3>
                <p className="text-zinc-500 leading-relaxed text-base max-w-sm">
                    {card.description}
                </p>
            </div>

            {/* Right — visual card */}
            <div className="flex items-center justify-center pl-0 md:pl-16">
                <div className="group relative bg-white rounded-3xl border border-zinc-200
                                hover:border-zinc-300 hover:shadow-xl transition-all duration-300
                                overflow-hidden w-full max-w-sm">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <Spotlight fill={card.accent} />
                    </div>
                    <div className="relative z-10">
                        <CardVisual type={card.visual} accent={card.accent} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }} />
                </div>
            </div>
        </motion.div>
    )
}

// ─── Animated card wrapper ───────────────────────────────────────────────────

function AnimatedCard({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-80px' })

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function Features() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const t = useTranslations('landing')

    return (
        <section id="features" className="py-32 bg-[#FAFAF7]" ref={ref}>
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 bg-zinc-900 text-[#CAFF32] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6"
                    >
                        {t('features.badge')}
                    </motion.span>

                    <TextGenerateEffect
                        words={t('features.title')}
                        className="font-black text-zinc-900 leading-tight tracking-tight mb-4"
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
                        duration={0.4}
                    />

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-xl text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed"
                    >
                        {t('features.subtitle')}
                    </motion.p>
                </div>

                {/* Features list - two columns with divider */}
                <div className="relative">
                    {/* Vertical divider */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-200 -translate-x-1/2" />

                    <div className="flex flex-col gap-0">
                        {CARDS.map((card, i) => (
                            <FeatureRow key={card.id} card={card} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
