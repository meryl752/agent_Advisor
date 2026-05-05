/**
 * User Memory System
 * Handles persistent AI memory for each user:
 * - Profile (from onboarding)
 * - Compressed stacks summary
 * - Compressed conversation summary
 * - Preferences
 */

import { supabaseService } from './server'
import { getUserByClerkId } from './queries'
import { callLLM } from '@/lib/llm/router'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  role?: string
  sector?: string
  team_size?: string
  budget?: string
  main_goal?: string
}

export interface UserMemory {
  profile: UserProfile
  stacks_summary: string
  conversation_summary: string
  preferences: Record<string, unknown>
  updated_at: string
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Load full memory for a user (profile + summaries).
 * Falls back to onboarding data if no memory row exists yet.
 */
export async function getUserMemory(clerkId: string): Promise<UserMemory | null> {
  const dbUser = await getUserByClerkId(clerkId)
  if (!dbUser) return null

  const userId = (dbUser as any).id

  // Try to get existing memory row
  const { data: memory } = await (supabaseService as any)
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (memory) {
    // Merge with latest onboarding data (in case it was updated)
    const profile: UserProfile = {
      role:       (dbUser as any).role       ?? memory.profile?.role,
      sector:     (dbUser as any).sector     ?? memory.profile?.sector,
      team_size:  (dbUser as any).team_size  ?? memory.profile?.team_size,
      budget:     (dbUser as any).budget     ?? memory.profile?.budget,
      main_goal:  (dbUser as any).main_goal  ?? memory.profile?.main_goal,
    }
    return {
      profile,
      stacks_summary:       memory.stacks_summary       ?? '',
      conversation_summary: memory.conversation_summary ?? '',
      preferences:          memory.preferences          ?? {},
      updated_at:           memory.updated_at,
    }
  }

  // No memory row yet — bootstrap from onboarding data
  const profile: UserProfile = {
    role:      (dbUser as any).role,
    sector:    (dbUser as any).sector,
    team_size: (dbUser as any).team_size,
    budget:    (dbUser as any).budget,
    main_goal: (dbUser as any).main_goal,
  }

  // Create the memory row for next time
  await (supabaseService as any)
    .from('user_memory')
    .insert({ user_id: userId, profile })

  return {
    profile,
    stacks_summary: '',
    conversation_summary: '',
    preferences: {},
    updated_at: new Date().toISOString(),
  }
}

/**
 * Format memory as a concise context block for the LLM prompt.
 */
export function formatMemoryForPrompt(memory: UserMemory): string {
  const lines: string[] = []

  const { profile, stacks_summary, conversation_summary, preferences } = memory

  // Profile
  const profileParts: string[] = []
  if (profile.role)      profileParts.push(`Rôle: ${profile.role}`)
  if (profile.sector)    profileParts.push(`Secteur: ${profile.sector}`)
  if (profile.team_size) profileParts.push(`Équipe: ${profile.team_size}`)
  if (profile.budget)    profileParts.push(`Budget mensuel: ${profile.budget}`)
  if (profile.main_goal) profileParts.push(`Objectif principal: ${profile.main_goal}`)

  if (profileParts.length > 0) {
    lines.push('Profil: ' + profileParts.join(' | '))
  }

  // Stacks history
  if (stacks_summary) {
    lines.push(`Historique stacks: ${stacks_summary}`)
  }

  // Conversation history
  if (conversation_summary) {
    lines.push(`Contexte conversations: ${conversation_summary}`)
  }

  // Preferences
  const prefs = preferences as any
  const prefParts: string[] = []
  if (prefs.tools_already_using?.length) {
    prefParts.push(`Outils déjà utilisés: ${prefs.tools_already_using.join(', ')}`)
  }
  if (prefs.prefers_nocode) prefParts.push('Préfère le no-code')
  if (prefs.avoids_expensive) prefParts.push('Évite les outils chers')
  if (prefParts.length > 0) {
    lines.push('Préférences: ' + prefParts.join(' | '))
  }

  if (lines.length === 0) return ''

  return `<memoire_utilisateur>\n${lines.join('\n')}\n</memoire_utilisateur>`
}

// ─── Save conversation ────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Save or update a chat session in the conversations table.
 */
export async function saveConversation(
  clerkId: string,
  sessionId: string,
  messages: ConversationMessage[],
  options?: { stackGenerated?: boolean; stackId?: string }
): Promise<void> {
  const dbUser = await getUserByClerkId(clerkId)
  if (!dbUser) {
    console.warn('[saveConversation] User not found for clerkId:', clerkId)
    return
  }

  const userId = (dbUser as any).id

  const { error } = await (supabaseService as any)
    .from('conversations')
    .upsert(
      {
        user_id:         userId,
        session_id:      sessionId,
        messages,
        stack_generated: options?.stackGenerated ?? false,
        stack_id:        options?.stackId ?? null,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    )

  if (error) {
    console.error('[saveConversation] Supabase error:', error.message, error.code)
  }
}

// ─── Compress & update memory ─────────────────────────────────────────────────

/**
 * After a session ends, compress unsummarized conversations
 * and update the user_memory row.
 * Called from /api/memory/update
 */
export async function compressAndUpdateMemory(clerkId: string): Promise<void> {
  const dbUser = await getUserByClerkId(clerkId)
  if (!dbUser) return

  const userId = (dbUser as any).id

  // Get all unsummarized conversations
  const { data: unsummarized } = await (supabaseService as any)
    .from('conversations')
    .select('id, messages, stack_generated')
    .eq('user_id', userId)
    .eq('summarized', false)
    .order('created_at', { ascending: true })

  if (!unsummarized || unsummarized.length === 0) return

  // Get current memory
  const { data: currentMemory } = await (supabaseService as any)
    .from('user_memory')
    .select('conversation_summary, stacks_summary, preferences')
    .eq('user_id', userId)
    .single()

  const existingSummary = currentMemory?.conversation_summary ?? ''

  // Build text of new conversations to compress
  const newConversationsText = unsummarized
    .map((conv: any) => {
      const msgs = (conv.messages as ConversationMessage[])
        .map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
        .join('\n')
      return msgs
    })
    .join('\n\n---\n\n')

  // Ask LLM to produce a compressed summary
  const compressionPrompt = `Tu es un système de mémoire IA. Ton rôle est de produire un résumé concis et utile des conversations d'un utilisateur.

Résumé existant:
${existingSummary || '(aucun)'}

Nouvelles conversations à intégrer:
${newConversationsText}

Produis un nouveau résumé en 3-5 phrases maximum qui capture:
- Les besoins et problèmes principaux de l'utilisateur
- Les outils qu'il mentionne utiliser déjà
- Ses préférences (budget, niveau technique, no-code vs code)
- L'évolution de ses besoins

Réponds uniquement avec le résumé, sans introduction ni explication.`

  const newSummary = await callLLM(compressionPrompt, 300).catch(() => existingSummary)

  // Update memory row
  await (supabaseService as any)
    .from('user_memory')
    .update({
      conversation_summary: newSummary,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Mark conversations as summarized
  const ids = unsummarized.map((c: any) => c.id)
  await (supabaseService as any)
    .from('conversations')
    .update({ summarized: true })
    .in('id', ids)
}

/**
 * Update the stacks summary after a new stack is generated.
 * Called from /api/recommend after a successful stack save.
 */
export async function updateStacksSummary(
  clerkId: string,
  newStack: { name: string; objective: string; agents: string[]; cost: number }
): Promise<void> {
  const dbUser = await getUserByClerkId(clerkId)
  if (!dbUser) return

  const userId = (dbUser as any).id

  const { data: currentMemory } = await (supabaseService as any)
    .from('user_memory')
    .select('stacks_summary')
    .eq('user_id', userId)
    .single()

  const existingSummary = currentMemory?.stacks_summary ?? ''

  const compressionPrompt = `Tu es un système de mémoire IA. Mets à jour le résumé des stacks d'un utilisateur.

Résumé actuel:
${existingSummary || '(aucun stack encore)'}

Nouveau stack généré:
- Nom: ${newStack.name}
- Objectif: ${newStack.objective}
- Outils: ${newStack.agents.join(', ')}
- Coût: ${newStack.cost}€/mois

Produis un résumé mis à jour en 2-3 phrases qui capture:
- Le nombre total de stacks et les domaines couverts
- Les outils récurrents
- Le budget moyen
- Le dernier stack généré

Réponds uniquement avec le résumé, sans introduction.`

  const newSummary = await callLLM(compressionPrompt, 200).catch(() => existingSummary)

  await (supabaseService as any)
    .from('user_memory')
    .upsert(
      { user_id: userId, stacks_summary: newSummary, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}
