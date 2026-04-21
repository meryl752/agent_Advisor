import { NextResponse } from 'next/server'
import { waitlistSchema } from '@/lib/validators/api'
import { addToWaitlist } from '@/lib/supabase/queries'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = waitlistSchema.safeParse(body)

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json({ error: 'Validation échouée', details: errors }, { status: 400 })
    }

    const { email } = validation.data
    const success = await addToWaitlist(email)

    if (!success) {
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Inscrit avec succès' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
