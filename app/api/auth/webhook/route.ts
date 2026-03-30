import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { syncUserWithServiceRole } from '@/lib/supabase/queries'
import { anonymizeId } from '@/lib/utils/logger'

export async function POST(req: Request) {
  // Obtenir le secret du webhook Clerk depuis les variables d'environnement
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Obtenir les en-têtes svix pour la vérification
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // Si pas d'en-têtes, erreur
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Obtenir le corps de la requête
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Créer une nouvelle instance Svix avec le secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Vérifier la signature du webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses[0]?.email_address
    
    if (id && email) {
      await syncUserWithServiceRole(id, email, {
        full_name: `${first_name ?? ''} ${last_name ?? ''}`.trim(),
        avatar_url: image_url,
        last_signed_in_at: new Date().toISOString()
      })
      console.log(`✅ Webhook: User ${anonymizeId(id)} synced to Supabase`)
    }
  }

  return new Response('', { status: 200 })
}
