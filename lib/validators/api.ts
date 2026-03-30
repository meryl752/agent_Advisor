import { z } from 'zod'

// ─── Recommend API ────────────────────────────────────────────────────────────
export const recommendSchema = z.object({
  objective: z
    .string()
    .min(10, { message: "L'objectif doit contenir au moins 10 caractères" })
    .max(1000, { message: "L'objectif ne peut pas dépasser 1000 caractères" })
    .trim(),
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
