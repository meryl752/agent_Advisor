'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const STEPS = [
    {
        num: '01',
        title: 'Décris ton objectif',
        desc: 'En langage naturel, sans formulaire. "Je veux lancer une boutique Shopify et automatiser mon SAV" suffit.',
        color: '#CAFF32',
    },
    {
        num: '02',
        title: 'L\'IA analyse et matche',
        desc: 'Notre pipeline multi-agents décompose ta requête, identifie les sous-tâches et score 200+ agents en fonction de ton contexte exact.',
        color: '#FF6B35',
    },
    {
        num: '03',
        title: 'Tu reçois le stack parfait',
        desc: 'Outils classés, rôles expliqués, coûts détaillés, ROI estimé et quick wins immédiats. Tout ce dont tu as besoin pour agir.',
        color: '#6B4FFF',
    },
    {
        num: '04',
        title: 'Tu ajustes et optimises',
        desc: 'Filtre par budget, niveau technique ou urgence. Le stack s\'adapte instantanément sans nouvelle génération.',
        color: '#20B8CD',
    },
]

export default function HowItWorks() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section className="py-32 bg-zinc-950" ref={ref}>
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-block bg-zinc-800 text-zinc-400 text-xs font-bold
                           uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        Comment ça marche
                    </span>
                    <h2 className="font-black text-white leading-tight"
                        style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
                        De l'idée au stack<br />
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                            en 30 secondes
                        </span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, y: 40 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className="relative bg-zinc-900 rounded-2xl p-6 border border-zinc-800
                         hover:border-zinc-600 transition-all duration-300 group"
                        >
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-8 -right-3 w-6 h-[1px] bg-zinc-700 z-10" />
                            )}

                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4
                               font-black text-sm text-zinc-900"
                                style={{ background: step.color }}>
                                {step.num}
                            </div>

                            <h3 className="font-black text-white text-lg mb-3 group-hover:text-[#CAFF32]
                              transition-colors">
                                {step.title}
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}