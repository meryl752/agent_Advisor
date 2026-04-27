'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface StepConfig {
  key: string
  question: string
  subtitle?: string
  options: OptionConfig[]
  hasOther: boolean
}

interface OptionConfig {
  label: string
  icon?: string // emoji or SVG string
}

// Social logos as inline SVG paths (simple, clean)
const SOCIAL_ICONS: Record<string, string> = {
  'YouTube': '📺',
  'LinkedIn': '💼',
  'Reddit': '🔴',
  'X (Twitter)': '✕',
  'Google Search': '🔍',
  'Product Hunt': '🐱',
  'Word of mouth': '💬',
  'Other': '✦',
}

const STEPS: StepConfig[] = [
  {
    key: 'role',
    question: "What's your role?",
    subtitle: "Help us personalize your experience",
    options: [
      { label: 'Founder / CEO', icon: '🚀' },
      { label: 'Marketing Manager', icon: '📣' },
      { label: 'E-commerce Manager', icon: '🛒' },
      { label: 'Freelancer', icon: '💻' },
      { label: 'Developer', icon: '⚡' },
      { label: 'Content Creator', icon: '🎬' },
      { label: 'Sales Manager', icon: '📈' },
      { label: 'Other', icon: '✦' },
    ],
    hasOther: true,
  },
  {
    key: 'sector',
    question: "What's your industry?",
    subtitle: "We'll tailor recommendations to your field",
    options: [
      { label: 'E-commerce', icon: '🛍️' },
      { label: 'SaaS', icon: '⚡' },
      { label: 'Agency', icon: '🏢' },
      { label: 'Consulting', icon: '💼' },
      { label: 'Content Creation', icon: '🎬' },
      { label: 'B2B Sales', icon: '🤝' },
      { label: 'Other', icon: '✦' },
    ],
    hasOther: false,
  },
  {
    key: 'team_size',
    question: "How big is your team?",
    subtitle: "We'll suggest tools that scale with you",
    options: [
      { label: 'Just me', icon: '👤' },
      { label: '2–5', icon: '👥' },
      { label: '6–20', icon: '🏃' },
      { label: '21–100', icon: '🏢' },
      { label: '100+', icon: '🌐' },
    ],
    hasOther: false,
  },
  {
    key: 'budget',
    question: "Monthly AI tools budget?",
    subtitle: "We'll only recommend what fits your budget",
    options: [
      { label: '$0 — free only', icon: '🆓' },
      { label: 'Under $50', icon: '💵' },
      { label: '$50 – $200', icon: '💰' },
      { label: '$200 – $500', icon: '💎' },
      { label: '$500+', icon: '🚀' },
    ],
    hasOther: false,
  },
  {
    key: 'main_goal',
    question: "What's your #1 goal?",
    subtitle: "We'll build your stack around this",
    options: [
      { label: 'Save time on repetitive tasks', icon: '⏱️' },
      { label: 'Grow revenue', icon: '📈' },
      { label: 'Improve customer experience', icon: '⭐' },
      { label: 'Scale content production', icon: '🎯' },
      { label: 'Automate sales & prospecting', icon: '🤖' },
      { label: 'Other', icon: '✦' },
    ],
    hasOther: true,
  },
  {
    key: 'referral_source',
    question: "How did you find us?",
    subtitle: "Just curious — takes 2 seconds",
    options: [
      { label: 'Word of mouth', icon: '💬' },
      { label: 'YouTube', icon: '▶️' },
      { label: 'LinkedIn', icon: '🔗' },
      { label: 'Reddit', icon: '🔴' },
      { label: 'X (Twitter)', icon: '✕' },
      { label: 'Google Search', icon: '🔍' },
      { label: 'Product Hunt', icon: '🐱' },
      { label: 'Other', icon: '✦' },
    ],
    hasOther: false,
  },
]

type StepAnswers = {
  role?: string
  sector?: string
  team_size?: string
  budget?: string
  main_goal?: string
  referral_source?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<StepAnswers>({})
  const [otherValues, setOtherValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch('/api/onboarding/state')
        if (res.ok) {
          const data = await res.json()
          if (data.onboarding_step && data.onboarding_step > 0) {
            setCurrentStep(Math.min(data.onboarding_step, STEPS.length - 1))
          }
          const saved: StepAnswers = {}
          for (const key of ['role', 'sector', 'team_size', 'budget', 'main_goal', 'referral_source'] as const) {
            if (data[key]) saved[key] = data[key]
          }
          setAnswers(saved)
        }
      } catch { /* start from step 0 */ }
    }
    loadState()
  }, [])

  const step = STEPS[currentStep]
  const stepKey = step.key as keyof StepAnswers
  const currentValue = answers[stepKey]
  const isOtherSelected = currentValue === 'Other'

  async function saveStep(value: string | null) {
    const res = await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepKey: step.key, value, stepIndex: currentStep }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Save failed')
    }
  }

  async function handleNext() {
    const value = isOtherSelected
      ? (otherValues[step.key] || 'Other')
      : (currentValue ?? null)

    setLoading(true)
    setError(null)
    try {
      await saveStep(value)
      const newAnswers = { ...answers, [stepKey]: value ?? undefined }
      setAnswers(newAnswers)

      if (currentStep === STEPS.length - 1) {
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: newAnswers }),
        })
        const data = await res.json()
        localStorage.setItem('stackai_welcome_message', data.message ?? "Welcome! Your personalized stack is ready.")
        router.push('/dashboard')
      } else {
        setDirection(1)
        setCurrentStep(s => s + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSkip() {
    setLoading(true)
    try {
      await saveStep(null)
    } catch { /* silent */ }
    const newAnswers = { ...answers }
    delete newAnswers[stepKey]
    setAnswers(newAnswers)

    if (currentStep === STEPS.length - 1) {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers }),
      })
      const data = await res.json().catch(() => ({}))
      localStorage.setItem('stackai_welcome_message', data.message ?? "Welcome! Your personalized stack is ready.")
      router.push('/dashboard')
    } else {
      setDirection(1)
      setCurrentStep(s => s + 1)
    }
    setLoading(false)
  }

  function handleBack() {
    setDirection(-1)
    setCurrentStep(s => s - 1)
    setError(null)
  }

  function handleSelect(label: string) {
    setAnswers(prev => ({ ...prev, [stepKey]: label }))
    setError(null)
  }

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-8 py-5 border-b border-zinc-200">
        <span className="font-syne font-extrabold text-lg tracking-[-0.02em] text-zinc-900 flex items-center">
          Ras
          <span className="relative flex items-center mx-[1px]">
            <span className="text-zinc-900 bg-[#D6E8F5] px-[3px] py-[1px] rounded-l-md leading-none text-[0.95em]">p</span>
            <span className="text-zinc-900 bg-[#CAFF32] px-[3px] py-[1px] rounded-r-md leading-none -ml-[1px] text-[0.95em]">q</span>
          </span>
          uery
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-200">
        <motion.div className="h-full bg-zinc-900"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ x: direction * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Question */}
              <div className="mb-8">
                <p className="font-dm-mono text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2">
                  Step {currentStep + 1} of {STEPS.length}
                </p>
                <h2 className="font-dm-sans text-2xl font-semibold text-zinc-900 mb-1 leading-snug">
                  {step.question}
                </h2>
                {step.subtitle && (
                  <p className="font-dm-sans text-sm text-zinc-500">{step.subtitle}</p>
                )}
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {step.options.map(opt => {
                  const selected = currentValue === opt.label
                  return (
                    <button key={opt.label} onClick={() => handleSelect(opt.label)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        selected
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                      }`}>
                      <span className="font-dm-sans">{opt.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Other input */}
              {step.hasOther && isOtherSelected && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6">
                  <input type="text" placeholder="Please specify..."
                    value={otherValues[step.key] ?? ''}
                    onChange={e => setOtherValues(prev => ({ ...prev, [step.key]: e.target.value }))}
                    className="w-full bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400
                               px-4 py-3 text-sm rounded-xl focus:outline-none focus:border-zinc-900 transition-colors"
                    autoFocus />
                </motion.div>
              )}

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200">
            <div>
              {currentStep > 0 && (
                <button onClick={handleBack} disabled={loading}
                  className="font-dm-mono text-xs text-zinc-400 hover:text-zinc-700 transition-colors uppercase tracking-widest">
                  ← Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSkip} disabled={loading}
                className="font-dm-mono text-xs text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest">
                Skip
              </button>
              <button onClick={handleNext}
                disabled={loading || (!currentValue && !isOtherSelected)}
                className="bg-zinc-900 text-white font-dm-sans font-medium text-sm px-6 py-2.5 rounded-xl
                           hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                {loading ? '...' : currentStep === STEPS.length - 1 ? 'Get started →' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
