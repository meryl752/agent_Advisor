import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Payments will not work.')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-03-25.dahlia', // Latest Stripe API version
  appInfo: {
    name: 'StackAI Advisor',
    version: '0.1.0',
  },
})
