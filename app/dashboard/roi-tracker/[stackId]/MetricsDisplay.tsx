'use client'

import { TrendingUp, TrendingDown, DollarSign, PiggyBank, BarChart3, Minus } from 'lucide-react'
import type { ROIMetrics } from '@/types/roi-tracker'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  positive,
  negative,
  subtitle,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent?: boolean
  positive?: boolean
  negative?: boolean
  subtitle?: string
}) {
  const valueColor = positive
    ? 'text-emerald-500'
    : negative
    ? 'text-red-400'
    : accent
    ? 'text-[#CAFF32]'
    : 'text-zinc-900 dark:text-white'

  const iconBg = positive
    ? 'bg-emerald-500/10'
    : negative
    ? 'bg-red-500/10'
    : accent
    ? 'bg-[#CAFF32]/10'
    : 'bg-zinc-100 dark:bg-zinc-800'

  const iconColor = positive
    ? 'text-emerald-500'
    : negative
    ? 'text-red-400'
    : accent
    ? 'text-[#CAFF32]'
    : 'text-zinc-500 dark:text-zinc-400'

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function ROICard({
  predictedROI,
  actualROI,
  roiDifference,
}: {
  predictedROI: number
  actualROI: number
  roiDifference: number
}) {
  const isPositive = roiDifference >= 0

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 col-span-full md:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          ROI Comparison
        </span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#CAFF32]/10">
          <BarChart3 className="w-4 h-4 text-[#CAFF32]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-zinc-400 mb-1">Predicted ROI</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-white">
            {formatPercent(predictedROI)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-1">Actual ROI</p>
          <p className="text-xl font-bold text-[#CAFF32]">
            {formatPercent(actualROI)}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400 mb-1">Difference</p>
          <div className="flex items-center gap-1">
            {roiDifference === 0 ? (
              <Minus className="w-4 h-4 text-zinc-400" />
            ) : isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <p className={`text-xl font-bold ${
              roiDifference === 0
                ? 'text-zinc-400'
                : isPositive
                ? 'text-emerald-500'
                : 'text-red-400'
            }`}>
              {isPositive && roiDifference > 0 ? '+' : ''}{formatPercent(roiDifference)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MetricsDisplay({ metrics }: { metrics: ROIMetrics }) {
  const {
    predictedMonthlyCost,
    actualMonthlyCost,
    monthlySavings,
    predictedROI,
    actualROI,
    roiDifference,
  } = metrics

  const hasSavings = monthlySavings > 0
  const hasROI = predictedROI !== undefined && actualROI !== undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Predicted Cost"
          value={formatCurrency(predictedMonthlyCost)}
          icon={DollarSign}
          subtitle="Estimated monthly cost"
        />
        <MetricCard
          label="Actual Cost"
          value={formatCurrency(actualMonthlyCost)}
          icon={DollarSign}
          accent
          subtitle="Current monthly cost"
        />
        <MetricCard
          label="Savings"
          value={formatCurrency(monthlySavings)}
          icon={PiggyBank}
          positive={hasSavings}
          subtitle={hasSavings ? 'You are saving money' : 'No savings yet'}
        />
      </div>

      {hasROI && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ROICard
            predictedROI={predictedROI!}
            actualROI={actualROI!}
            roiDifference={roiDifference ?? 0}
          />
        </div>
      )}
    </div>
  )
}
