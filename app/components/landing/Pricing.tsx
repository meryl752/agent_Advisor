'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TIERS = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        desc: 'Pour découvrir Raspquery.',
        features: ['1 stack/mois', '50 agents indexés', 'Stack Score basique', 'Dashboard lecture'],
        cta: 'Commencer gratuitement',
        href: '/sign-up',
        featured: false,
    },
    {
        name: 'Pro',
        price: { monthly: 19, yearly: 15 },
        desc: 'Pour les entrepreneurs sérieux.',
        features: ['Stacks illimités', '200+ agents indexés', 'ROI Tracker temps réel', 'Stack Alerts', 'Workflow Visualizer', 'Stack Score complet'],
        cta: 'Essai 14 jours gratuit',
        href: '/sign-up',
        featured: true,
    },
    {
        name: 'Agency',
        price: { monthly: 79, yearly: 63 },
        desc: 'Pour les agences et équipes.',
        features: ['Tout le plan Pro', 'Multi-clients', 'Exports PDF blanc', 'Stack vs Stack illimité', 'API access', 'Support prioritaire'],
        cta: 'Contacter l\'équipe',
        href: '/sign-up',
        featured: false,
    },
]

export default function Pricing() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const [yearly, setYearly] = useState(false)

    return (
        <section id="pricing" className="py-32 bg-[#FAFAF7]" ref={ref}>
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block bg-white border border-zinc-200 text-zinc-600 text-xs
                           font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                        Pricing
                    </span>
                    <h2 className="font-black text-zinc-900 leading-tight mb-4"
                        style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
                        Simple. Transparent.<br />ROI positif dès le 1er mois.
                    </h2>

                    {/* Toggle */}
                    <div className="inline-flex items-center gap-3 bg-white border border-zinc-200 rounded-full p-1 mt-4">
                        <button onClick={() => setYearly(false)}
                            className={cn('px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                                !yearly ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700')}>
                            Mensuel
                        </button>
                        <button onClick={() => setYearly(true)}
                            className={cn('px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
                                yearly ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-700')}>
                            Annuel
                            <span className="bg-[#CAFF32] text-zinc-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                                -20%
                            </span>
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TIERS.map((tier, i) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 40 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className={cn(
                                'relative rounded-2xl p-8 border transition-all duration-300',
                                tier.featured
                                    ? 'bg-zinc-900 border-zinc-700 shadow-2xl scale-105'
                                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-lg'
                            )}
                        >
                            {tier.featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-[#CAFF32] text-zinc-900 text-xs font-black
                                   px-4 py-1 rounded-full uppercase tracking-wide">
                                        ✦ Plus populaire
                                    </span>
                                </div>
                            )}

                            <p className={cn('font-black text-xl mb-1', tier.featured ? 'text-white' : 'text-zinc-900')}>
                                {tier.name}
                            </p>
                            <p className={cn('text-sm mb-6', tier.featured ? 'text-zinc-400' : 'text-zinc-500')}>
                                {tier.desc}
                            </p>

                            <div className="mb-8">
                                <span className={cn('font-black text-5xl', tier.featured ? 'text-white' : 'text-zinc-900')}>
                                    {yearly ? tier.price.yearly : tier.price.monthly}€
                                </span>
                                <span className={cn('text-sm ml-1', tier.featured ? 'text-zinc-400' : 'text-zinc-400')}>
                                    /mois
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 mb-8">
                                {tier.features.map(feat => (
                                    <div key={feat} className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: tier.featured ? '#CAFF32' : '#f4f4f5' }}>
                                            <span className={cn('text-[8px] font-black', tier.featured ? 'text-zinc-900' : 'text-zinc-500')}>
                                                ✓
                                            </span>
                                        </div>
                                        <span className={cn('text-sm', tier.featured ? 'text-zinc-300' : 'text-zinc-600')}>
                                            {feat}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <Link href={tier.href}
                                className={cn(
                                    'block w-full text-center font-bold py-3 rounded-xl transition-all duration-200 text-sm',
                                    tier.featured
                                        ? 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] hover:shadow-lg hover:scale-105'
                                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
                                )}>
                                {tier.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}