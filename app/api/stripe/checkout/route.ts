import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe/client'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const authObj = await auth()
    const { userId } = authObj

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.emailAddresses[0]?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'Email manquant' }, { status: 400 })
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Prix manquant' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        userId: userId, // Keep Clerk user ID to map to Supabase on webhook
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erreur Stripe Checkout:', error)
    return NextResponse.json(
      { error: "Impossible d'initialiser le paiement." },
      { status: 500 }
    )
  }
}
