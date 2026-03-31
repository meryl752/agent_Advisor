'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

const TIERS = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        desc: 'Pour découvrir Raspquery.',
        features: ['1 stack/mois', '50 agents indexés', 'Stack Score basique', 'Dashboard lecture'],
        cta: 'Commencer gratuitement',
        priceId: null,
        featured: false,
    },
    {
        name: 'Pro',
        price: { monthly: 19, yearly: 15 },
        desc: 'Pour les entrepreneurs sérieux.',
        features: ['Stacks illimités', '200+ agents indexés', 'ROI Tracker temps réel', 'Stack Alerts', 'Workflow Visualizer', 'Stack Score complet'],
        cta: 'Essai 14 jours gratuit',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        featured: true,
    },
    {
        name: 'Agency',
        price: { monthly: 79, yearly: 63 },
        desc: 'Pour les agences et équipes.',
        features: ['Tout le plan Pro', 'Multi-clients', 'Exports PDF blanc', 'Stack vs Stack illimité', 'API access', 'Support prioritaire'],
        cta: 'Contacter l\'équipe',
        priceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID,
        featured: false,
    },
]

function CheckoutButton({ priceId, cta, featured }: { priceId: string | null | undefined; cta: string; featured: boolean }) {
    const { isSignedIn } = useAuth()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        if (!priceId) return // Free plan — just redirect to sign-up

        if (!isSignedIn) {
            window.location.href = '/sign-up'
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            })
            const data = await res.json()
            if (data.url) window.location.href = data.url
        } catch (err) {
            console.error('Checkout error:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!priceId) {
        return (
            <a href="/sign-up"
                className={cn(
                    'block w-full text-center font-bold py-3 rounded-xl transition-all duration-200 text-sm',
                    featured
                        ? 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] hover:shadow-lg hover:scale-105'
                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
                )}>
                {cta}
            </a>
        )
    }

    return (
        <button onClick={handleClick} disabled={loading}
            className={cn(
                'block w-full text-center font-bold py-3 rounded-xl transition-all duration-200 text-sm',
                featured
                    ? 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] hover:shadow-lg hover:scale-105'
                    : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200',
                loading && 'opacity-60 cursor-not-allowed'
            )}>
            {loading ? 'Redirection...' : cta}
        </button>
    )
}

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

                            <CheckoutButton priceId={tier.priceId} cta={tier.cta} featured={tier.featured} />
                        </motion.div>
                    ))}
                </div>

                {/* Reassurance text */}
                <div className="mt-10 flex items-center justify-center gap-2 text-sm text-zinc-500 font-medium">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Annule quand tu veux &middot; Aucune carte requise pour le Free
                </div>

                {/* Minimalist FAQ */}
                <div className="mt-32 max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h3 className="font-black text-2xl text-zinc-900 mb-4">Questions fréquentes</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                q: "Puis-je annuler mon abonnement ?",
                                a: "Absolument. Tu peux annuler ton plan à tout moment depuis ton espace en un seul clic. Sans condition."
                            },
                            {
                                q: "Quelles sont les limites du Free ?",
                                a: "Le plan Free permet de créer 1 stack par mois. Il est limité en analyse et ne donne pas accès aux Stack Alerts ni au Tracker de ROI."
                            },
                            {
                                q: "Et pour l'essai gratuit Pro ?",
                                a: "Tu as 14 jours pour utiliser toutes les fonctionnalités métiers. Sans engagement, annule avant la fin pour ne rien payer."
                            },
                            {
                                q: "Politique de remboursement ?",
                                a: "Si tu n'es pas satisfait de ta première facture, contacte-nous dans les 7 jours pour un remboursement intégral."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 border border-zinc-200 hover:border-zinc-300 transition-colors">
                                <h4 className="font-bold text-zinc-900 mb-2">{faq.q}</h4>
                                <p className="text-zinc-600 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    )
}