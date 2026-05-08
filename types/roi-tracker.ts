// ─── ROI Tracker Types ────────────────────────────────────────────────────────
// Types for the ROI Tracker subscription management feature

/**
 * Represents the subscription status for a user-agent pair
 * Maps to the subscription_tracking table in the database
 */
export interface SubscriptionStatus {
  id: string
  userId: string
  agentId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Represents a single entry in the subscription history
 * Maps to the subscription_history table in the database
 */
export interface SubscriptionHistoryEntry {
  id: string
  userId: string
  agentId: string
  previousStatus: boolean
  newStatus: boolean
  changedAt: string
}

/**
 * Tool with its subscription status — used in the ROI Tracker dashboard.
 * Fields mirror the agents table in Supabase.
 */
export interface ToolWithSubscription {
  id: string
  name: string
  category: string
  description: string
  price_from: number
  score: number
  roi_score: number
  url?: string
  website_domain?: string
  logo_url?: string
  subscriptionStatus?: SubscriptionStatus
}

/**
 * Financial and ROI metrics for the ROI Tracker dashboard
 * Calculated based on active subscriptions and tool costs
 */
export interface ROIMetrics {
  /** Total monthly cost if all tools were subscribed */
  predictedMonthlyCost: number
  
  /** Actual monthly cost based on active subscriptions */
  actualMonthlyCost: number
  
  /** Savings from not subscribing to all tools */
  monthlySavings: number
  
  /** Predicted ROI from the stack recommendation (optional) */
  predictedROI?: number
  
  /** Actual ROI based on active subscriptions (optional) */
  actualROI?: number
  
  /** Difference between predicted and actual ROI (optional) */
  roiDifference?: number
}

/**
 * History entry with agent name for display purposes
 * Used in the history view component
 */
export interface SubscriptionHistoryEntryWithAgent extends SubscriptionHistoryEntry {
  agentName: string
}

/**
 * Financial and ROI metrics for the ROI Tracker dashboard
 * Calculated based on active subscriptions and tool costs
 */
export interface ROIMetrics {
  /** Total monthly cost if all tools were subscribed */
  predictedMonthlyCost: number
  
  /** Actual monthly cost based on active subscriptions */
  actualMonthlyCost: number
  
  /** Savings from not subscribing to all tools */
  monthlySavings: number
  
  /** Predicted ROI from the stack recommendation (optional) */
  predictedROI?: number
  
  /** Actual ROI based on active subscriptions (optional) */
  actualROI?: number
  
  /** Difference between predicted and actual ROI (optional) */
  roiDifference?: number
}

/**
 * History entry with agent name for display purposes
 * Used in the history view component
 */
export interface SubscriptionHistoryEntryWithAgent extends SubscriptionHistoryEntry {
  agentName: string
}
