import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseService } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get stripe_customer_id from Supabase
    const { data, error } = await (supabaseService as any)
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', userId)
      .single()

    if (error || !data?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé.' },
        { status: 404 }
      )
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'Impossible d\'ouvrir le portail.' }, { status: 500 })
  }
}
