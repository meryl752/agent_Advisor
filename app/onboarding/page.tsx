'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface StepConfig {
  key: string
  question: string
  options: string[]
  hasOther: boolean
}

const STEPS: StepConfig[] = [
  {
    key: 'role',
    question: "What's your role?",
    options: ['Founder/CEO', 'Marketing Manager', 'E-commerce Manager', 'Freelancer', 'Developer', 'Content Creator', 'Sales Manager', 'Other'],
    hasOther: true,
  },
  {
    key: 'sector',
    question: "What industry are you in?",
    options: ['E-commerce', 'SaaS', 'Agency', 'Consulting', 'Content Creation', 'B2B Sales', 'Other'],
    hasOther: false,
  },
  {
    key: 'team_size',
    question: "How big is your team?",
    options: ['Just me', '2-5', '6-20', '21-100', '100+'],
    hasOther: false,
  },
  {
    key: 'budget',
    question: "What's your monthly AI tools budget?",
    options: ['$0 (free only)', 'Under $50', '$50-$200', '$200-$500', '$500+'],
    hasOther: false,
  },
  {
    key: 'main_goal',
    question: "What's your main goal right now?",
    options: ['Save time on repetitive tasks', 'Grow revenue', 'Improve customer experience', 'Scale content production', 'Automate sales/prospecting', 'Other'],
    hasOther: true,
  },
  {
    key: 'referral_source',
    question: "How did you find Raspquery?",
    options: ['Word of mouth', 'YouTube', 'LinkedIn', 'Reddit', 'X (Twitter)', 'Google Search', 'Product Hunt', 'Other'],
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

  // Load saved state from server on mount
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
      } catch {
        // fail silently — start from step 0
      }
    }
    loadState()
  }, [])

  const step = STEPS[currentStep]
  const stepKey = step.key as keyof StepAnswers
  const currentValue = answers[stepKey]
  const isOtherSelected = currentValue === 'Other'

  async function saveStep(value: string | null) {
    setError(null)
    try {
      const res = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepKey: step.key, value, stepIndex: currentStep }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }
    } catch (err) {
      throw err
    }
  }

  async function handleNext() {
    const value = isOtherSelected
      ? (otherValues[step.key] || 'Other')
      : (currentValue ?? null)

    setLoading(true)
    try {
      await saveStep(value)
      const newAnswers = { ...answers, [stepKey]: value ?? undefined }
      setAnswers(newAnswers)

      if (currentStep === STEPS.length - 1) {
        // Final step — complete onboarding
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: newAnswers }),
        })
        const data = await res.json()
        const message = data.message ?? "Welcome! Your personalized stack is ready."
        localStorage.setItem('stackai_welcome_message', message)
        router.push('/dashboard')
      } else {
        setDirection(1)
        setCurrentStep(s => s + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSkip() {
    setLoading(true)
    try {
      await saveStep(null)
      const newAnswers = { ...answers }
      delete newAnswers[stepKey]
      setAnswers(newAnswers)

      if (currentStep === STEPS.length - 1) {
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: newAnswers }),
        })
        const data = await res.json()
        const message = data.message ?? "Welcome! Your personalized stack is ready."
        localStorage.setItem('stackai_welcome_message', message)
        router.push('/dashboard')
      } else {
        setDirection(1)
        setCurrentStep(s => s + 1)
      }
    } catch {
      // fail silently on skip
      if (currentStep < STEPS.length - 1) {
        setDirection(1)
        setCurrentStep(s => s + 1)
      } else {
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setDirection(-1)
    setCurrentStep(s => s - 1)
    setError(null)
  }

  function handleSelect(option: string) {
    setAnswers(prev => ({ ...prev, [stepKey]: option }))
    setError(null)
  }

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="font-dm-mono text-[11px] text-zinc-500 uppercase tracking-widest">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#CAFF32] rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h1 className="font-syne font-black text-3xl text-white mb-8 leading-tight">
              {step.question}
            </h1>

            {/* Chip grid */}
            <div className="flex flex-wrap gap-3 mb-6">
              {step.options.map(option => {
                const selected = currentValue === option
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`px-4 py-2.5 text-sm font-medium transition-all rounded-sm ${
                      selected
                        ? 'bg-[#CAFF32] text-zinc-900'
                        : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {/* Other text input */}
            {step.hasOther && isOtherSelected && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <input
                  type="text"
                  placeholder="Please specify..."
                  value={otherValues[step.key] ?? ''}
                  onChange={e => setOtherValues(prev => ({ ...prev, [step.key]: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600
                             px-4 py-3 text-sm focus:outline-none focus:border-[#CAFF32] transition-colors"
                  autoFocus
                />
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="font-dm-mono text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="font-dm-mono text-xs text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              disabled={loading || (!currentValue && !isOtherSelected)}
              className="bg-[#CAFF32] text-zinc-900 font-syne font-black text-sm px-6 py-2.5
                         hover:bg-[#d4ff50] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : currentStep === STEPS.length - 1 ? 'Continue →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
