'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function Pricing() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const t = useTranslations('landing')

    const perks = t.raw('pricing.perks') as string[]

    return (
        <section id="pricing" className="py-32 bg-[#FAFAF7] relative overflow-hidden" ref={ref}>

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #CAFF32 0%, transparent 70%)' }} />
            </div>

            <div className="relative max-w-5xl mx-auto px-6">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <span className="inline-flex items-center gap-2 bg-zinc-900 text-[#CAFF32] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse" />
                        {t('pricing.badge')}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h2 className="font-black text-zinc-900 leading-tight mb-4"
                        style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                        {t('pricing.title')}{' '}
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #5a8a00, #7aaa00)' }}>
                            {t('pricing.titleHighlight')}
                        </span>
                    </h2>
                    <p className="text-zinc-500 text-base max-w-xl mx-auto leading-relaxed">
                        {t('pricing.subtitle')}
                    </p>
                </motion.div>

                {/* Main card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white border border-zinc-200 rounded-none p-10"
                    style={{ boxShadow: '6px 6px 0px #CAFF32' }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

                        {/* Left — perks */}
                        <div>
                            <p className="text-zinc-900 font-black text-xl mb-6">{t('pricing.perksTitle')}</p>
                            <div className="flex flex-col gap-3">
                                {perks.map((perk, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={inView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                                        className="flex items-center gap-3"
                                    >
                                        <img
                                            src="/assets/icons svg/checkmark-circle-03-stroke-rounded.svg"
                                            alt="check"
                                            className="w-5 h-5 shrink-0"
                                        />
                                        <span className="text-zinc-600 text-sm">{perk}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Right — CTA */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-6">
                                <div className="text-6xl font-black text-zinc-900 mb-1">{t('pricing.price')}</div>
                                <div className="text-zinc-400 text-sm">{t('pricing.priceSub')}</div>
                            </div>

                            <div className="w-full flex flex-col gap-3">
                                <Link href="/sign-up"
                                    className="w-full bg-[#CAFF32] text-zinc-900 font-black py-3 rounded-xl text-sm hover:bg-[#d4ff50] transition-colors text-center">
                                    {t('pricing.cta')}
                                </Link>
                                <p className="text-zinc-400 text-xs">{t('pricing.disclaimer')}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    )
}
