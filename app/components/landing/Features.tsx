'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const FEATURES = [
    {
        id: '01',
        title: 'Stack parfaite en 30 secondes',
        description: 'Décris ton objectif en langage naturel. Notre algo hybride (rule-based + LLM) analyse 200+ agents et construit le combo optimal.',
        visual: 'search',
        size: 'large',
        accent: '#CAFF32',
    },
    {
        id: '02',
        title: 'ROI Tracker temps réel',
        description: 'Vois exactement combien tu économises chaque mois grâce à ton stack. Le chiffre qui justifie chaque euro dépensé.',
        visual: 'chart',
        size: 'small',
        accent: '#FF6B35',
    },
    {
        id: '03',
        title: 'Stack Alerts instantanées',
        description: 'Dès qu\'un outil de ton stack devient obsolète ou qu\'un meilleur sort — alerte immédiate.',
        visual: 'bell',
        size: 'small',
        accent: '#6B4FFF',
    },
    {
        id: '04',
        title: 'Workflow Visualizer',
        description: 'Un canvas interactif qui montre comment tes agents s\'interconnectent et où automatiser davantage.',
        visual: 'flow',
        size: 'medium',
        accent: '#20B8CD',
    },
    {
        id: '05',
        title: 'Stack Score & Audit mensuel',
        description: 'Un score 0-100 + rapport mensuel automatique. Tu sais toujours si ton stack est optimal.',
        visual: 'score',
        size: 'medium',
        accent: '#CAFF32',
    },
]

function FeatureVisual({ type, accent }: { type: string, accent: string }) {
    if (type === 'search') return (
        <div className="relative h-full min-h-[160px] flex items-center justify-center p-6">
            <div className="w-full max-w-xs">
                <div className="bg-zinc-100 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: accent }} />
                    <p className="text-xs text-zinc-600 leading-relaxed">Je veux lancer une boutique Shopify...</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { name: 'Claude', domain: 'claude.ai' },
                        { name: 'Tidio', domain: 'tidio.com' },
                        { name: 'Make', domain: 'make.com' }
                    ].map((t) => (
                        <div key={t.name} className="bg-white border border-zinc-200 rounded-lg p-2 text-center
                                     shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-7 h-7 rounded-md mx-auto mb-1 flex items-center justify-center overflow-hidden bg-zinc-50 border border-zinc-100">
                                <img
                                    src={`https://img.logo.dev/${t.domain}?token=pk_aJ8Bl7ROS6-FE3fLWji9tQ`}
                                    alt={t.name}
                                    className="w-5 h-5 object-contain"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                            </div>
                            <p className="text-[10px] font-semibold text-zinc-700">{t.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

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
        const flowTools = [
            { name: 'Claude', domain: 'claude.ai' },
            { name: 'Make', domain: 'make.com' },
            { name: 'Notion', domain: 'notion.so' },
            { name: 'Buffer', domain: 'buffer.com' }
        ]
        return (
            <div className="flex items-center justify-center gap-2 p-6 min-h-[120px]">
                {flowTools.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white border-2 rounded-full flex items-center justify-center shadow-md overflow-hidden"
                            style={{ borderColor: accent + '60' }}>
                            <img
                                src={`https://img.logo.dev/${t.domain}?token=pk_aJ8Bl7ROS6-FE3fLWji9tQ`}
                                alt={t.name}
                                className="w-6 h-6 object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                        {i < 3 && (
                            <div className="w-4 h-[1px]" style={{ background: accent }} />
                        )}
                    </div>
                ))}
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
                    <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-bold
                           uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        Fonctionnalités
                    </span>
                    <h2 className="font-black text-zinc-900 leading-tight mb-4"
                        style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
                        Tout ce dont tu as besoin<br />
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                            pour dominer l'IA
                        </span>
                    </h2>
                    <p className="text-xl text-zinc-500 max-w-xl mx-auto font-light">
                        Cinq features pensées pour une obsession — maximiser ton ROI sur chaque euro dépensé en IA.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Large card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="md:col-span-2 bg-zinc-50 rounded-2xl border border-zinc-100
                       hover:border-zinc-200 transition-all duration-300 hover:shadow-xl overflow-hidden"
                    >
                        <div className="p-8 pb-0">
                            <span className="text-xs font-mono text-zinc-400">{FEATURES[0].id}</span>
                            <h3 className="font-black text-2xl text-zinc-900 mt-2 mb-3">{FEATURES[0].title}</h3>
                            <p className="text-zinc-500 leading-relaxed">{FEATURES[0].description}</p>
                        </div>
                        <FeatureVisual type={FEATURES[0].visual} accent={FEATURES[0].accent} />
                    </motion.div>

                    {/* Small cards */}
                    <div className="flex flex-col gap-4">
                        {FEATURES.slice(1, 3).map((f, i) => (
                            <motion.div
                                key={f.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                                className="bg-zinc-50 rounded-2xl border border-zinc-100
                           hover:border-zinc-200 transition-all duration-300 hover:shadow-xl overflow-hidden flex-1"
                            >
                                <div className="p-6 pb-0">
                                    <span className="text-xs font-mono text-zinc-400">{f.id}</span>
                                    <h3 className="font-black text-lg text-zinc-900 mt-1 mb-2">{f.title}</h3>
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
                            className="bg-zinc-50 rounded-2xl border border-zinc-100
                         hover:border-zinc-200 transition-all duration-300 hover:shadow-xl overflow-hidden"
                        >
                            <div className="p-6 pb-0">
                                <span className="text-xs font-mono text-zinc-400">{f.id}</span>
                                <h3 className="font-black text-xl text-zinc-900 mt-1 mb-2">{f.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
                            </div>
                            <FeatureVisual type={f.visual} accent={f.accent} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}