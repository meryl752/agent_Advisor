import { NextResponse } from 'next/server'

// TODO: Replace with Supabase insert when DB layer is connected
// supabase.from('waitlist').insert({ email, created_at: new Date() })

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // Placeholder — log for now
    console.log('New waitlist signup:', email)

    return NextResponse.json({ success: true, message: 'Inscrit avec succès' })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
