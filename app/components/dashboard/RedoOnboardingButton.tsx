'use client'

export default function RedoOnboardingButton() {
  async function handleRedo() {
    await fetch('/api/onboarding/reset', { method: 'POST' })
    window.location.href = '/onboarding'
  }

  return (
    <button
      onClick={handleRedo}
      className="border border-zinc-700 text-zinc-400 text-xs font-bold px-4 py-2 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
    >
      Redo onboarding
    </button>
  )
}
