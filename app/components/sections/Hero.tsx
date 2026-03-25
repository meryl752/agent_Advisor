'use client'

import { motion } from 'framer-motion'
import WaitlistForm from '../ui/WaitlistForm'
import HeroDashboard from '../mockups/HeroDashboard'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] },
})

export default function Hero() {
  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center
                         gap-[60px] px-[52px] py-20 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Glow effects */}
      <div className="absolute w-[700px] h-[700px] rounded-full pointer-events-none
                       -top-[150px] -right-[200px] animate-pulse-slow"
           style={{ background: 'radial-gradient(circle, rgba(200,241,53,0.055) 0%, transparent 65%)' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none
                       -bottom-[100px] -left-[100px] animate-pulse-slower"
           style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 65%)' }} />

      {/* Left — copy */}
      <div className="relative z-10">
        <motion.div {...fadeUp(0.1)}
          className="font-dm-mono text-[0.72rem] uppercase
                     text-accent mb-7 flex items-center gap-[10px]">
          <span className="inline-block w-6 h-px bg-accent" />
          La plateforme IA qui maximise ton ROI
        </motion.div>

        <motion.h1 {...fadeUp(0.2)} className="hero-title text-cream">
          Construis le<br />
          <em className="not-italic text-accent relative after:content-[''] after:absolute
                          after:bottom-[2px] after:left-0 after:right-0 after:h-[2px]
                          after:bg-accent after:opacity-35">
            stack parfait.
          </em>
          <br />
          Gagne plus.
        </motion.h1>

        <motion.p {...fadeUp(0.3)}
          className="mt-7 text-[1.05rem] text-muted-2 max-w-[480px] leading-[1.75] font-light">
          Tu décris ton objectif. Raspquery analyse 200+ agents IA et t&apos;assemble
          le combo exact — avec les coûts, le ROI estimé et le workflow clé en main.
        </motion.p>

        <motion.div {...fadeUp(0.4)} className="flex gap-[14px] mt-10 flex-wrap">
          <button
            onClick={() => document.getElementById('cta-email')?.focus()}
            className="bg-accent text-bg font-syne font-bold text-[0.88rem]
                       px-[30px] py-[15px]
                       hover:opacity-85 hover:-translate-y-[2px] transition-all duration-150"
          >
            Accès gratuit →
          </button>
          <a href="#features"
            className="border border-border-2 text-cream font-syne font-bold
                       text-[0.88rem] px-[30px] py-[15px]
                       hover:border-accent hover:-translate-y-[2px] transition-all duration-150">
            Voir la démo ↓
          </a>
        </motion.div>

        <motion.div {...fadeUp(0.5)} className="flex gap-7 mt-10">
          {['200+ outils indexés', 'Mis à jour chaque semaine', '0€ pour commencer'].map((t) => (
            <div key={t} className="font-dm-mono text-[0.68rem] text-muted
                                    flex items-center gap-[6px]">
              <div className="w-[5px] h-[5px] rounded-full bg-accent flex-shrink-0" />
              {t}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — mockup */}
      <div className="relative z-10 hidden lg:block">
        <HeroDashboard />
      </div>
    </section>
  )
}
