'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

export default function HowItWorks() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const t = useTranslations('landing')

    const STEPS = [
        {
            num: '01',
            title: t('howItWorks.step1Title'),
            desc: t('howItWorks.step1Desc'),
            color: '#CAFF32',
        },
        {
            num: '02',
            title: t('howItWorks.step2Title'),
            desc: t('howItWorks.step2Desc'),
            color: '#FF6B35',
        },
        {
            num: '03',
            title: t('howItWorks.step3Title'),
            desc: t('howItWorks.step3Desc'),
            color: '#6B4FFF',
        },
        {
            num: '04',
            title: t('howItWorks.step4Title'),
            desc: t('howItWorks.step4Desc'),
            color: '#20B8CD',
        },
    ]

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    })

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        // Calculate the active index based on scroll position within the container
        // We use slightly less than latest to ensure the last index is reached right at the bottom
        const index = Math.min(
            STEPS.length - 1,
            Math.floor(latest * STEPS.length * 0.99)
        );
        setActiveIndex(index);
    });

    return (
        <section ref={containerRef} className="relative h-[400vh] bg-zinc-950" data-theme="dark">
            {/* The sticky container that acts as a viewport */}
            <div className="sticky top-0 min-h-screen w-full flex flex-col items-center justify-center overflow-hidden py-24">
                
                {/* Fixed Title Section */}
                <div className="w-full max-w-7xl mx-auto px-6 mb-20 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <span className="inline-block bg-zinc-800 text-zinc-400 text-xs font-bold
                               uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                            {t('howItWorks.badge')}
                        </span>
                        <h2 className="font-black text-white leading-tight"
                            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}>
                            {t('howItWorks.title')}<br />
                            <span className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(135deg, #CAFF32, #7FFF00)' }}>
                                {t('howItWorks.titleHighlight')}
                            </span>
                        </h2>
                    </motion.div>
                </div>

                <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    
                    {/* Left Side: Timeline indicators */}
                    <div className="flex flex-col justify-center gap-8 relative z-10 w-full max-w-sm mx-auto lg:mx-0">
                        <div className="relative hidden lg:flex flex-col gap-12">
                            {/* Vertical Line Background */}
                            <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-zinc-900 rounded-full" />
                            
                            {/* Vertical Active Line */}
                            <motion.div 
                                className="absolute left-0 top-4 w-[2px] bg-gradient-to-b from-[#CAFF32] to-[#20B8CD] rounded-full origin-top"
                                style={{
                                    bottom: '16px',
                                    scaleY: scrollYProgress
                                }}
                            />

                            {STEPS.map((step, idx) => (
                                <div key={step.num} className="relative flex items-center gap-6 group pl-8">
                                    <h3 className={`font-black text-xl lg:text-3xl transition-all duration-500`}
                                        style={{ color: activeIndex === idx ? step.color : (activeIndex > idx ? '#a1a1aa' : '#52525b') }}>
                                        {step.title}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: The dynamic Card */}
                    <div className="relative w-full max-w-md mx-auto aspect-square lg:h-[400px] flex items-center mt-8 lg:mt-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', rotateY: -10 }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', rotateY: 0 }}
                                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)', rotateY: 10 }}
                                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute w-full bg-[#ffffff03] backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 
                                              border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] 
                                              ring-1 ring-white/5 flex flex-col justify-center"
                            >
                                {/* The overlapping number (inside/outside effect) */}
                                <div className="absolute -top-12 -left-6 lg:-top-16 lg:-left-12 text-[100px] lg:text-[140px] font-black z-0 opacity-80 select-none pointer-events-none"
                                     style={{ 
                                         WebkitTextStroke: `2px ${STEPS[activeIndex].color}`,
                                         color: 'transparent',
                                         textShadow: `0 0 40px ${STEPS[activeIndex].color}30`
                                     }}>
                                    {STEPS[activeIndex].num}
                                </div>

                                <div className="relative z-10 pl-6 mt-8">
                                    <h3 className="font-black text-white text-3xl md:text-4xl leading-tight mb-6 mt-4">
                                        {STEPS[activeIndex].title}
                                    </h3>
                                    <p className="text-zinc-400 text-lg leading-relaxed font-light">
                                        {STEPS[activeIndex].desc}
                                    </p>
                                </div>
                                
                                {/* Liquid shine highlight */}
                                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 rotate-[20deg]" />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </section>
    )
}