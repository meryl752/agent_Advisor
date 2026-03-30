import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Stack } from '@/lib/supabase/types'

function StackCard({ stack }: { stack: Stack }) {
  const date = new Date(stack.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 p-6 hover:border-zinc-700 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-black text-white text-lg truncate mb-1">
            {stack.name}
          </h3>
          <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed">
            {stack.objective}
          </p>
        </div>
        <span className="ml-4 flex-shrink-0 font-dm-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          {date}
        </span>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-zinc-800">
        <div>
          <p className="font-dm-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1">Coût</p>
          <p className="font-black text-white text-sm">{stack.total_cost}€<span className="text-zinc-600 font-normal text-xs">/mois</span></p>
        </div>
        <div>
          <p className="font-dm-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1">ROI</p>
          <p className="font-black text-[#CAFF32] text-sm">+{stack.roi_estimate}%</p>
        </div>
        <div>
          <p className="font-dm-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1">Score</p>
          <p className="font-black text-white text-sm">{stack.score}<span className="text-zinc-600 font-normal text-xs">/100</span></p>
        </div>
        <div>
          <p className="font-dm-mono text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-1">Agents</p>
          <p className="font-black text-white text-sm">{stack.agent_ids?.length ?? 0}</p>
        </div>
      </div>
    </div>
  )
}

export default async function StacksPage() {
  const { getToken } = await auth()
  let user = null
  try {
    user = await currentUser()
  } catch {
    redirect('/sign-in')
  }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const userEmail = user.emailAddresses[0]?.emailAddress
  const stacks = await getUserStacks(user.id, clerkToken, userEmail)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">
            Mes Stacks
          </h1>
          <p className="font-dm-sans text-sm text-zinc-500">
            {stacks.length} stack{stacks.length !== 1 ? 's' : ''} généré{stacks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/recommend"
          className="bg-[#CAFF32] text-zinc-900 font-syne font-black text-sm px-6 py-3 hover:bg-[#d4ff50] transition-all"
        >
          + Nouveau stack
        </Link>
      </div>

      {/* Empty state */}
      {stacks.length === 0 ? (
        <div className="border border-dashed border-zinc-800 p-16 text-center">
          <p className="font-syne font-black text-white text-2xl mb-3">Aucun stack pour l'instant</p>
          <p className="text-zinc-500 text-sm mb-8">Décris ton objectif métier pour générer ton premier stack IA sur-mesure.</p>
          <Link
            href="/dashboard/recommend"
            className="inline-block bg-[#CAFF32] text-zinc-900 font-bold px-8 py-3 text-sm hover:bg-[#d4ff50] transition-colors"
          >
            Construire mon premier stack →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stacks.map((stack) => (
            <StackCard key={stack.id} stack={stack} />
          ))}
        </div>
      )}
    </div>
  )
}
