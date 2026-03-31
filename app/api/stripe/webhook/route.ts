import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseService } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Nouveau paiement / upgrade ────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.userId

        if (!clerkUserId) {
          console.error('No userId in session metadata')
          break
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const priceId = lineItems.data[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)

        const { error } = await (supabaseService as any)
          .from('users')
          .update({ plan, stripe_customer_id: session.customer })
          .eq('clerk_id', clerkUserId)

        if (error) {
          console.error('Failed to update user plan:', error.message)
        } else {
          console.log(`✅ User ${clerkUserId.substring(0, 8)}*** upgraded to ${plan}`)
        }
        break
      }

      // ── Renouvellement mensuel réussi → maintenir le plan ─────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const priceId = (invoice as any).lines?.data?.[0]?.price?.id
        const plan = getPlanFromPriceId(priceId)

        if (plan !== 'free') {
          const { error } = await (supabaseService as any)
            .from('users')
            .update({ plan })
            .eq('stripe_customer_id', customerId)

          if (error) {
            console.error('Failed to renew user plan:', error.message)
          } else {
            console.log(`✅ Plan ${plan} renewed for customer ${customerId.substring(0, 8)}***`)
          }
        }
        break
      }

      // ── Paiement échoué → downgrade vers free ─────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { error } = await (supabaseService as any)
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Failed to downgrade after payment failure:', error.message)
        } else {
          console.log(`⚠️ Payment failed — customer ${customerId.substring(0, 8)}*** downgraded to free`)
        }
        break
      }

      // ── Abonnement annulé → downgrade vers free ───────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { error } = await (supabaseService as any)
          .from('users')
          .update({ plan: 'free' })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Failed to downgrade user plan:', error.message)
        } else {
          console.log(`✅ Customer ${customerId.substring(0, 8)}*** downgraded to free`)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function getPlanFromPriceId(priceId: string | undefined): 'pro' | 'agency' | 'free' {
  if (!priceId) return 'free'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID) return 'agency'
  return 'free'
}
