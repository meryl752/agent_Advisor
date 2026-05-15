import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/supabase/queries'
import { supabaseService } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await currentUser()
  if (!user) {
    console.error('[conversations/sessionId] No user')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) {
    console.error('[conversations/sessionId] User not found in DB:', user.id)
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userId = (dbUser as any).id
  const { sessionId } = await params

  console.log('[conversations/sessionId] Fetching conversation:', { sessionId, userId })

  // Fetch conversation
  const { data: conversation, error } = await (supabaseService as any)
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .single()

  if (error) {
    console.error('[conversations/sessionId] Supabase error:', error)
    
    // Try without user_id filter to see if conversation exists at all
    const { data: anyConv } = await (supabaseService as any)
      .from('conversations')
      .select('user_id, session_id')
      .eq('session_id', sessionId)
      .single()
    
    if (anyConv) {
      console.error('[conversations/sessionId] Conversation exists but user_id mismatch:', {
        expected: userId,
        actual: anyConv.user_id
      })
    } else {
      console.error('[conversations/sessionId] Conversation does not exist:', sessionId)
    }
    
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  if (!conversation) {
    console.error('[conversations/sessionId] No conversation data')
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  console.log('[conversations/sessionId] Found conversation:', {
    session_id: conversation.session_id,
    stack_id: conversation.stack_id,
    messages_count: conversation.messages?.length ?? 0
  })

  // If conversation has a stack, fetch stack details
  let stack = null
  if (conversation.stack_id) {
    const { data: stackData } = await (supabaseService as any)
      .from('stacks')
      .select('*')
      .eq('id', conversation.stack_id)
      .single()
    
    if (stackData) {
      // Fetch agent details for the stack
      const { data: agents } = await (supabaseService as any)
        .from('agents')
        .select('id, name, category, description, price_from, score, url, website_domain, logo_url')
        .in('id', stackData.agent_ids ?? [])
      
      stack = {
        ...stackData,
        agents: agents ?? []
      }
    }
  }

  return NextResponse.json({
    conversation: {
      session_id: conversation.session_id,
      messages: conversation.messages,
      stack_generated: conversation.stack_generated,
      stack_id: conversation.stack_id,
      custom_title: conversation.custom_title,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    },
    stack
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userId = (dbUser as any).id
  const { sessionId } = await params

  const body = await req.json().catch(() => null)
  if (!body || !body.title) {
    return NextResponse.json({ error: 'Title missing' }, { status: 400 })
  }

  console.log('[conversations/sessionId] Updating conversation title:', { sessionId, userId, title: body.title })

  // Update conversation title (custom_title field)
  const { error } = await (supabaseService as any)
    .from('conversations')
    .update({
      custom_title: body.title.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (error) {
    console.error('[conversations/sessionId] Update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const userId = (dbUser as any).id
  const { sessionId } = await params

  console.log('[conversations/sessionId] Deleting conversation:', { sessionId, userId })

  // Delete conversation (only if it belongs to the user)
  const { error } = await (supabaseService as any)
    .from('conversations')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (error) {
    console.error('[conversations/sessionId] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
