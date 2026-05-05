import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/supabase/queries'
import { supabaseService } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) return NextResponse.json({ conversations: [] })

  const userId = (dbUser as any).id

  const { data, error } = await (supabaseService as any)
    .from('conversations')
    .select('session_id, messages, stack_generated, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('[conversations] fetch error:', error)
    return NextResponse.json({ conversations: [] })
  }

  // Return a lightweight list — just enough for the sidebar
  const conversations = (data ?? []).map((c: any) => {
    const msgs = c.messages as Array<{ role: string; content: string }>
    const firstUserMsg = msgs.find(m => m.role === 'user')?.content ?? 'Conversation'
    // Truncate title to 40 chars
    const title = firstUserMsg.length > 40
      ? firstUserMsg.slice(0, 40) + '...'
      : firstUserMsg

    return {
      session_id:      c.session_id,
      title,
      stack_generated: c.stack_generated,
      updated_at:      c.updated_at,
    }
  })

  return NextResponse.json({ conversations })
}
