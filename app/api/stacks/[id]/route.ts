import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'

// ─── Helper: verify stack belongs to user ────────────────────────────────────

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

// ─── DELETE /api/stacks/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const { error } = await (supabaseService as any)
      .from('stacks')
      .delete()
      .eq('id', id)
      .eq('user_id', internalId) // security: only delete own stacks

    if (error) {
      console.error('Delete stack error:', error.message)
      return NextResponse.json({ error: 'Suppression échouée' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/stacks/[id]:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── PATCH /api/stacks/[id] ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })

    const { name } = body
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    }

    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const { data, error } = await (supabaseService as any)
      .from('stacks')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', internalId) // security: only update own stacks
      .select()
      .single()

    if (error) {
      console.error('Update stack error:', error.message)
      return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
    }

    return NextResponse.json({ success: true, stack: data })
  } catch (err) {
    console.error('PATCH /api/stacks/[id]:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
