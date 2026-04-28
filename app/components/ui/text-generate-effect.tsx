'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function TextGenerateEffect({
    words,
    className,
    filter = true,
    duration = 0.5,
    style,
}: {
    words: string
    className?: string
    filter?: boolean
    duration?: number
    style?: React.CSSProperties
}) {
    const wordsArray = words.split(' ')
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    return (
        <div ref={ref} className={className} style={style}>
            {wordsArray.map((word, i) => (
                <motion.span
                    key={`${word}-${i}`}
                    initial={{ opacity: 0, filter: filter ? 'blur(10px)' : 'none' }}
                    animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : {}}
                    transition={{ duration, delay: i * 0.08 }}
                    className="inline mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </div>
    )
}
