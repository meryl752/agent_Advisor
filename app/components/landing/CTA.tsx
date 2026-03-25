'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

export default function CTA() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: '-100px' })

    const handleSubmit = async () => {
        if (!email.includes('@')) return
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            setSent(true)
        } catch { setSent(true) }
    }

    return (
        <section className="py-32 bg-zinc-950 relative overflow-hidden" ref={ref}>
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[300px] opacity-20 blur-3xl rounded-full"
                    style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent)' }} />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block bg-zinc-800 text-zinc-400 text-xs font-bold
                           uppercase tracking-widest px-4 py-2 rounded-full mb-8">
                        Early Access
                    </span>
                    <h2 className="font-black text-white leading-tight mb-4"
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                        Ton stack.<br />
                        Ton{' '}
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                            avantage.
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 font-light">
                        Les 50 premiers accèdent gratuitement à la bêta privée.
                    </p>

                    {sent ? (
                        <div className="bg-zinc-900 border border-[#CAFF32]/30 rounded-2xl p-6 inline-flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#CAFF32] rounded-full flex items-center justify-center">
                                <span className="text-zinc-900 font-black text-sm">✓</span>
                            </div>
                            <p className="text-white font-semibold">Tu es sur la liste. On te contacte en premier.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="ton@email.com"
                                className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-5 py-3.5
                           rounded-xl outline-none focus:border-[#CAFF32] transition-colors
                           placeholder:text-zinc-500 text-sm"
                            />
                            <button
                                onClick={handleSubmit}
                                className="bg-[#CAFF32] text-zinc-900 font-bold px-6 py-3.5 rounded-xl
                           hover:bg-[#d4ff50] transition-all hover:scale-105 hover:shadow-xl
                           whitespace-nowrap text-sm"
                            >
                                Rejoindre →
                            </button>
                        </div>
                    )}

                    <p className="text-zinc-600 text-xs">
                        ✦ Bêta privée · Aucun spam · Désabonnement en 1 clic
                    </p>
                </motion.div>
            </div>
        </section>
    )
}