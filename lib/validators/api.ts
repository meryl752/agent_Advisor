import { z } from 'zod'
import { VALID_CATEGORIES } from '@/lib/constants'

// ─── Shared primitives ────────────────────────────────────────────────────────

export const uuidSchema = z
  .string()
  .uuid({ message: 'ID invalide — format UUID attendu' })

export const sectorSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, { message: 'Secteur invalide — caractères alphanumériques et tirets uniquement' })

// ─── Recommend API ────────────────────────────────────────────────────────────

export const recommendSchema = z.object({
  objective: z
    .string()
    .min(10, { message: "L'objectif doit contenir au moins 10 caractères" })
    .max(2000, { message: "L'objectif ne peut pas dépasser 2000 caractères" })
    .trim(),
  sector: z.string().min(1).max(100).trim(),
  budget: z.enum(['zero', 'low', 'medium', 'high']),
  tech_level: z.enum(['beginner', 'intermediate', 'advanced']),
  team_size: z.enum(['solo', 'small', 'medium', 'large']).default('solo'),
  timeline: z.enum(['asap', 'weeks', 'months']).default('weeks'),
  current_tools: z.array(z.string().max(100)).max(20).optional().default([]),
  session_id: z.string().uuid().optional(),
})

export type RecommendInput = z.infer<typeof recommendSchema>

// ─── Waitlist API ─────────────────────────────────────────────────────────────

export const waitlistSchema = z.object({
  email: z
    .string()
    .min(1, { message: "L'email est requis" })
    .email({ message: "L'email n'est pas valide" })
    .toLowerCase()
    .trim(),
})

export type WaitlistInput = z.infer<typeof waitlistSchema>

// ─── Stack PATCH ──────────────────────────────────────────────────────────────

export const stackPatchSchema = z.object({
  name: z.string().min(1).max(200).trim(),
})

export type StackPatchInput = z.infer<typeof stackPatchSchema>

// ─── Stack Feedback ───────────────────────────────────────────────────────────

export const agentRatingSchema = z.object({
  agent_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const feedbackSchema = z.object({
  stack_rating: z.number().int().min(1).max(5).optional(),
  stack_comment: z.string().max(1000).trim().optional(),
  agent_ratings: z.array(agentRatingSchema).max(20).optional().default([]),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

// ─── Stack Chat ───────────────────────────────────────────────────────────────

export const stackChatSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  stackContext: z.object({
    stack_name: z.string().max(200),
    objective: z.string().max(1000),
    total_cost: z.number().min(0),
    agents: z.array(z.object({
      name: z.string().max(200),
      role: z.string().max(500),
    })).max(20),
  }),
})

export type StackChatInput = z.infer<typeof stackChatSchema>
