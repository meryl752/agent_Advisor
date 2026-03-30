import { supabaseService } from '@/lib/supabase/server'

export type UserPlan = 'free' | 'pro' | 'agency'

export interface UserPlanService {
  getUserPlan(userId: string): Promise<UserPlan>
}

export async function getUserPlanFromSupabase(clerkUserId: string): Promise<UserPlan> {
  try {
    const { data, error } = await supabaseService
      .from('users')
      .select('plan')
      .eq('clerk_id', clerkUserId)
      .single<{ plan: UserPlan }>()

    if (error || !data) {
      console.warn(`[getUserPlan] Failed to retrieve plan for user ${clerkUserId.substring(0, 8)}***: ${error?.message || 'User not found'}`)
      return 'free' // Default to most restrictive tier
    }

    const plan = data.plan
    
    // Validate plan value
    if (!['free', 'pro', 'agency'].includes(plan)) {
      console.warn(`[getUserPlan] Invalid plan value "${plan}" for user ${clerkUserId.substring(0, 8)}***, defaulting to free`)
      return 'free'
    }

    return plan
  } catch (error) {
    console.error(`[getUserPlan] Error retrieving plan for user ${clerkUserId.substring(0, 8)}***:`, error instanceof Error ? error.message : 'Unknown error')
    return 'free' // Fail-safe to most restrictive tier
  }
}
