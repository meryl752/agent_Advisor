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
        <section className="py-16 bg-zinc-950 relative overflow-hidden" ref={ref}>
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
                        Ton stack.<br />
                        Ton{' '}
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                            avantage.
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-sm mb-8 font-light">
                        Les 50 premiers accèdent gratuitement à la bêta privée.
                    </p>

                    {sent ? (
                        <div className="bg-zinc-900 border border-[#CAFF32]/30 rounded-2xl p-5 flex items-center justify-center gap-3">
                            <div className="w-7 h-7 bg-[#CAFF32] rounded-full flex items-center justify-center">
                                <span className="text-zinc-900 font-black text-xs">✓</span>
                            </div>
                            <p className="text-white font-semibold text-sm">Tu es sur la liste. On te contacte en premier.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                placeholder="ton@email.com"
                                className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-4 py-3
                               rounded-xl outline-none focus:border-[#CAFF32] transition-colors
                               placeholder:text-zinc-500 text-sm"
                            />
                            <button
                                onClick={handleSubmit}
                                className="bg-[#CAFF32] text-zinc-900 font-bold px-5 py-3 rounded-xl
                               hover:bg-[#d4ff50] transition-all whitespace-nowrap text-sm"
                            >
                                Rejoindre →
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    )
}