export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { supabaseService } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import StacksClient from './StacksClient'
import { getTranslations } from 'next-intl/server'

export default async function StacksPage() {
  const t = await getTranslations('dashboard.stack')
  const { getToken } = await auth()
  let user = null
  try { user = await currentUser() } catch { redirect('/sign-in') }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const userEmail = user.emailAddresses[0]?.emailAddress
  const stacks = await getUserStacks(user.id, clerkToken, userEmail)

  // Fetch agent data for all stacks to get logos
  const allAgentIds = [...new Set(stacks.flatMap(s => s.agent_ids ?? []))]
  let agentsMap: Record<string, { name: string; url: string }> = {}
  if (allAgentIds.length > 0) {
    const { data } = await (supabaseService as any)
      .from('agents')
      .select('id, name, url')
      .in('id', allAgentIds)
    if (data) {
      agentsMap = Object.fromEntries(data.map((a: any) => [a.id, { name: a.name, url: a.url }]))
    }
  }

  // Fetch session_id for each stack from conversations table
  const stackIds = stacks.map(s => s.id).filter(Boolean)
  let stackSessionMap: Record<string, string> = {}
  if (stackIds.length > 0) {
    const { data: convData } = await (supabaseService as any)
      .from('conversations')
      .select('stack_id, session_id')
      .in('stack_id', stackIds)
    if (convData) {
      stackSessionMap = Object.fromEntries(
        convData.map((c: any) => [c.stack_id, c.session_id])
      )
    }
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">{t('title')}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/recommend"
          className="bg-[#CAFF32] text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#d4ff50] transition-colors">
          + Nouveau
        </Link>
      </div>
      <StacksClient initialStacks={stacks} agentsMap={agentsMap} stackSessionMap={stackSessionMap} />
    </div>
  )
}
