'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Spotlight } from '../ui/spotlight'
import { AnimatedBeam } from '../ui/animated-beam'
import { getLogoUrl } from '@/lib/utils/logo'

const FEATURES = [
    {
        id: '01',
        title: 'Stack parfaite en 30 secondes',
        description: 'Arrête de scroller des annuaires d\'outils. Notre moteur (rule-based + LLM) analyse tes besoins et valide la meilleure combinaison possible parmi +200 agents IA.',
        visual: 'search',
        size: 'large',
        accent: '#CAFF32',
    },
    {
        id: '02',
        title: 'ROI Tracker temps réel',
        description: 'Vois instantanément le temps économisé par semaine et les coûts cachés évités. Le chiffre qui justifie absolument chaque euro investi.',
        visual: 'chart',
        size: 'small',
        accent: '#FF6B35',
    },
    {
        id: '03',
        title: 'Stack Alerts intelligentes',
        description: 'Un outil de ton système baisse ses prix ? Un concurrent plus performant sort ? Tu reçois une alerte et tu switches en un clic.',
        visual: 'bell',
        size: 'small',
        accent: '#6B4FFF',
    },
    {
        id: '04',
        title: 'Workflow Visualizer',
        description: 'Passe de l\'idée à l\'exécution. Observe comment ChatGPT, Make et ton CRM s\'interconnectent sur un canvas clair et actionnable.',
        visual: 'flow',
        size: 'medium',
        accent: '#20B8CD',
    },
    {
        id: '05',
        title: 'Audit & Score 0-100',
        description: 'Ne laisse pas ta stack pourrir. Reçois un audit mensuel automatique : on note ta config sur 100 et on te dit exactement quoi désabonner.',
        visual: 'score',
        size: 'medium',
        accent: '#CAFF32',
    },
]

function FeatureVisual({ type, accent }: { type: string, accent: string }) {
    if (type === 'search') {
        const text = "Je veux lancer une boutique Shopify..."
        const [displayedText, setDisplayedText] = useState('')
        const [showCards, setShowCards] = useState(false)

        useEffect(() => {
            let i = 0
            const interval = setInterval(() => {
                setDisplayedText(text.slice(0, i))
                i++
                if (i > text.length) {
                    clearInterval(interval)
                    setTimeout(() => setShowCards(true), 500)
                }
            }, 50)
            return () => clearInterval(interval)
        }, [])

        return (
            <div className="relative h-full min-h-[160px] flex items-center justify-center p-6 overflow-hidden">
                <Spotlight fill={accent} />
                <div className="w-full max-w-xs relative z-10">
                    <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 rounded-xl p-3 mb-3 flex items-start gap-2 h-[48px]">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse" style={{ background: accent }} />
                        <p className="text-xs text-zinc-700 font-medium leading-relaxed">
                            {displayedText}
                            <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-zinc-300 animate-pulse" />
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <AnimatePresence>
                            {showCards && [
                                { name: 'Claude', domain: 'claude.ai' },
                                { name: 'Tidio', domain: 'tidio.com' },
                                { name: 'Make', domain: 'make.com' }
                            ].map((t, i) => (
                                <motion.div
                                    key={t.name}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.15, type: 'spring', bounce: 0.4 }}
                                    className="bg-white border border-zinc-200 rounded-lg p-2 text-center shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="w-7 h-7 rounded-md mx-auto mb-1 flex items-center justify-center overflow-hidden bg-zinc-50 border border-zinc-100">
                                        <img
                                            src={getLogoUrl(t.domain)}
                                            alt={t.name}
                                            className="w-5 h-5 object-contain"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-semibold text-zinc-700">{t.name}</p>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        )
    }

    if (type === 'chart') return (
        <div className="flex items-end justify-center gap-1.5 px-4 pb-4 pt-6 h-full min-h-[120px]">
            {[40, 65, 55, 80, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm transition-all duration-500"
                    style={{ height: `${h}%`, background: i === 5 ? accent : `${accent}40` }} />
            ))}
        </div>
    )

    if (type === 'bell') return (
        <div className="p-4 flex flex-col gap-2 min-h-[120px]">
            {[
                { text: 'GPT-4o a baissé ses prix', color: '#22c55e' },
                { text: 'Jasper → remplacer par Claude', color: '#FF6B35' },
                { text: 'Nouveau: Perplexity Pages', color: accent },
            ].map((alert, i) => (
                <div key={i} className="flex items-center gap-2 bg-zinc-50 rounded-lg px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: alert.color }} />
                    <p className="text-xs text-zinc-600">{alert.text}</p>
                </div>
            ))}
        </div>
    )

    if (type === 'flow') {
        const containerRef = useRef<HTMLDivElement>(null)
        const ref1 = useRef<HTMLDivElement>(null)
        const ref2 = useRef<HTMLDivElement>(null)
        const ref3 = useRef<HTMLDivElement>(null)
        const ref4 = useRef<HTMLDivElement>(null)

        const tools = [
            { name: 'Claude', domain: 'claude.ai', ref: ref1 },
            { name: 'Make', domain: 'make.com', ref: ref2 },
            { name: 'Notion', domain: 'notion.so', ref: ref3 },
            { name: 'Buffer', domain: 'buffer.com', ref: ref4 }
        ]

        return (
            <div ref={containerRef} className="relative flex items-center justify-between p-6 min-h-[120px] w-full max-w-sm mx-auto">
                {tools.map((t, i) => (
                    <div key={t.name} ref={t.ref} className="z-10 w-10 h-10 bg-white border-2 rounded-full flex items-center justify-center shadow-md overflow-hidden"
                        style={{ borderColor: accent + '80' }}>
                        <img
                            src={getLogoUrl(t.domain)}
                            alt={t.name}
                            className="w-6 h-6 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                    </div>
                ))}

                <AnimatedBeam containerRef={containerRef} fromRef={ref1} toRef={ref2} gradientStartColor={accent} gradientStopColor={accent} pathOpacity={0.1} />
                <AnimatedBeam containerRef={containerRef} fromRef={ref2} toRef={ref3} gradientStartColor={accent} duration={3} delay={1} gradientStopColor={accent} pathOpacity={0.1} />
                <AnimatedBeam containerRef={containerRef} fromRef={ref3} toRef={ref4} gradientStartColor={accent} duration={4} delay={0.5} gradientStopColor={accent} pathOpacity={0.1} />
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center p-6 min-h-[120px]">
            <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="34" stroke="#f4f4f5" strokeWidth="8" fill="none" />
                    <circle cx="40" cy="40" r="34" stroke={accent} strokeWidth="8" fill="none"
                        strokeDasharray="213" strokeDashoffset="45" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-black text-xl text-zinc-900">84</span>
                </div>
            </div>
        </div>
    )
}

export default function Features() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section id="features" className="py-32 bg-white" ref={ref}>
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block bg-zinc-900 text-[#CAFF32] text-xs font-black
                           uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        Le Moteur Raspquery
                    </span>
                    <h2 className="font-black text-zinc-900 leading-tight mb-4 tracking-tight"
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                        Fini le bricolage.<br />
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #111, #444)' }}>
                            Passe en mode expert.
                        </span>
                    </h2>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed">
                        Cinq fonctionnalités implacables pensées pour une seule obsession : maximiser le ROI de chaque euro que tu investis dans l'IA.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Large card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-2 bg-white rounded-3xl border border-zinc-200
                       hover:border-zinc-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                    >
                        <div className="p-10 pb-0">
                            <span className="text-xs font-black tracking-widest text-[#CAFF32] bg-zinc-900 px-3 py-1 rounded-sm">{FEATURES[0].id}</span>
                            <h3 className="font-black text-3xl text-zinc-900 mt-4 mb-3 tracking-tight">{FEATURES[0].title}</h3>
                            <p className="text-zinc-500 leading-relaxed text-lg max-w-lg">{FEATURES[0].description}</p>
                        </div>
                        <FeatureVisual type={FEATURES[0].visual} accent={FEATURES[0].accent} />
                    </motion.div>

                    {/* Small cards */}
                    <div className="flex flex-col gap-6">
                        {FEATURES.slice(1, 3).map((f, i) => (
                            <motion.div
                                key={f.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                                className="bg-white rounded-3xl border border-zinc-200
                           hover:border-zinc-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex-1 group"
                            >
                                <div className="p-8 pb-0">
                                    <span className="text-xs font-black tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">{f.id}</span>
                                    <h3 className="font-black text-xl text-zinc-900 mt-2 mb-2 tracking-tight">{f.title}</h3>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
                                </div>
                                <FeatureVisual type={f.visual} accent={f.accent} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Medium cards */}
                    {FEATURES.slice(3).map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                            className="bg-white rounded-3xl border border-zinc-200
                         hover:border-zinc-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden group"
                        >
                            <div className="p-8 pb-0">
                                <span className="text-xs font-black tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">{f.id}</span>
                                <h3 className="font-black text-2xl text-zinc-900 mt-2 mb-2 tracking-tight">{f.title}</h3>
                                <p className="text-zinc-500 leading-relaxed">{f.description}</p>
                            </div>
                            <FeatureVisual type={f.visual} accent={f.accent} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}