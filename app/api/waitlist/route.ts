import { NextResponse } from 'next/server'
import { waitlistSchema } from '@/lib/validators/api'
import { anonymizeEmail } from '@/lib/utils/logger'

// TODO: Replace with Supabase insert when DB layer is connected
// supabase.from('waitlist').insert({ email, created_at: new Date() })

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

    // Placeholder — log for now
    console.log('New waitlist signup:', anonymizeEmail(email))

    return NextResponse.json({ success: true, message: 'Inscrit avec succès' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
