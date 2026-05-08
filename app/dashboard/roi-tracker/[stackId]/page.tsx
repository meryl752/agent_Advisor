export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseService } from '@/lib/supabase/server'
import ROITrackerClient from './ROITrackerClient'
import type { Metadata } from 'next'

/**
 * Generate metadata for the ROI Tracker page
 * Includes the stack name in the title for better SEO and user context
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ stackId: string; locale: string }>
}): Promise<Metadata> {
  const { stackId } = await params

  // Try to fetch the stack name for the title
  let stackName = 'Stack'
  try {
    const { data } = await supabaseService
      .from('stacks')
      .select('name')
      .eq('id', stackId)
      .single() as { data: { name: string } | null }
    
    if (data?.name) {
      stackName = data.name
    }
  } catch (error) {
    // If we can't fetch the stack name, use the default
    console.error('[roi-tracker/page] Error fetching stack name for metadata:', error)
  }

  return {
    title: `ROI Tracker - ${stackName}`,
    description: 'Track your return on investment and manage tool subscriptions',
  }
}

/**
 * ROI Tracker Page
 * 
 * Displays the ROI Tracker dashboard for a specific stack.
 * Users can:
 * - View all tools in their stack with monthly costs
 * - Toggle subscription status for each tool
 * - See real-time financial metrics (predicted vs actual costs, savings)
 * - Access subscription links for each tool
 * - View subscription change history
 * 
 * Requirements: 1.1, 7.2
 */
export default async function ROITrackerPage({
  params,
}: {
  params: Promise<{ stackId: string; locale: string }>
}) {
  const { stackId } = await params

  // Validate authentication with Clerk
  const { getToken } = await auth()
  let user = null
  
  try {
    user = await currentUser()
  } catch (error) {
    console.error('[roi-tracker/page] Error fetching current user:', error)
    redirect('/sign-in')
  }

  if (!user) {
    redirect('/sign-in')
  }

  // Get Clerk token for Supabase authentication
  const clerkToken = await getToken({ template: 'supabase' }) ?? ''

  // Verify the stack exists and belongs to the user
  try {
    const { data: stack, error } = await supabaseService
      .from('stacks')
      .select('id, name, user_id')
      .eq('id', stackId)
      .single() as { data: { id: string; name: string; user_id: string } | null; error: any }

    if (error || !stack) {
      console.error('[roi-tracker/page] Stack not found:', error)
      redirect('/dashboard/stack')
    }

    // Verify ownership
    if (stack.user_id !== user.id) {
      console.error('[roi-tracker/page] Stack does not belong to user')
      redirect('/dashboard/stack')
    }
  } catch (error) {
    console.error('[roi-tracker/page] Error verifying stack:', error)
    redirect('/dashboard/stack')
  }

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto">
      <ROITrackerClient stackId={stackId} clerkToken={clerkToken} />
    </div>
  )
}
