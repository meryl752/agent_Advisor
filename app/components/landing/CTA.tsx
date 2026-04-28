'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function CTA() {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })
    const t = useTranslations('landing')

    return (
        <section className="py-16 bg-zinc-950 relative overflow-hidden" ref={ref} data-theme="dark">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[400px] h-[200px] opacity-15 blur-3xl rounded-full"
                    style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent)' }} />
            </div>

            <div className="relative max-w-2xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="font-black text-white leading-tight mb-3"
                        style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                        {t('cta.title')}{' '}
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                            {t('cta.titleHighlight')}
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-sm mb-8 font-light">
                        {t('cta.subtitle')}
                    </p>

                    <Link href="/sign-up"
                        className="inline-flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-black px-8 py-4 rounded-xl
                                   hover:bg-[#d4ff50] transition-all text-sm">
                        {t('cta.cta')}
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}
