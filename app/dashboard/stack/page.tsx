import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StacksClient from './StacksClient'

export default async function StacksPage() {
  const { getToken } = await auth()
  let user = null
  try { user = await currentUser() } catch { redirect('/sign-in') }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const userEmail = user.emailAddresses[0]?.emailAddress
  const stacks = await getUserStacks(user.id, clerkToken, userEmail)

  return (
    <div className="p-6 md:p-10 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">Mes stacks</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/recommend"
          className="bg-[#CAFF32] text-zinc-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#d4ff50] transition-colors">
          + Nouveau
        </Link>
      </div>
      <StacksClient initialStacks={stacks} />
    </div>
  )
}
