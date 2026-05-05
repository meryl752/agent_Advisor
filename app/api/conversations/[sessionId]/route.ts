import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/supabase/queries'
import { supabaseService } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const userId = (dbUser as any).id

  const { data, error } = await (supabaseService as any)
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

  return NextResponse.json({ conversation: data })
}

// ─── PATCH — rename conversation ─────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.title?.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const userId = (dbUser as any).id

  const { error } = await (supabaseService as any)
    .from('conversations')
    .update({ custom_title: body.title.trim(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('session_id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// ─── DELETE — delete conversation ────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const dbUser = await getUserByClerkId(user.id)
  if (!dbUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const userId = (dbUser as any).id

  const { error } = await (supabaseService as any)
    .from('conversations')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
