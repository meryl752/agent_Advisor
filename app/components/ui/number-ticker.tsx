'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

export function NumberTicker({
    value,
    direction = 'up',
    delay = 0,
    decimalPlaces = 0,
    className,
}: {
    value: number
    direction?: 'up' | 'down'
    delay?: number
    decimalPlaces?: number
    className?: string
}) {
    const ref = useRef<HTMLSpanElement>(null)
    const motionVal = useMotionValue(direction === 'down' ? value : 0)
    const springVal = useSpring(motionVal, { damping: 60, stiffness: 100 })
    const isInView = useInView(ref, { once: true, margin: '0px' })

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionVal.set(direction === 'down' ? 0 : value)
            }, delay * 1000)
        }
    }, [motionVal, isInView, delay, value, direction])

    useEffect(() => {
        return springVal.on('change', (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat('fr-FR', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                }).format(Number(latest.toFixed(decimalPlaces)))
            }
        })
    }, [springVal, decimalPlaces])

    return <span ref={ref} className={className}>0</span>
}
