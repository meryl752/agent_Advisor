interface StackSummaryProps {
  stackName: string
  justification: string
  total_cost: number
  roi_estimate: number
  time_saved_per_week?: number
  agentCount: number
}

export default function StackSummary({
  stackName, justification, total_cost,
  roi_estimate, time_saved_per_week, agentCount,
}: StackSummaryProps) {
  return (
    <div className="relative border border-border bg-bg-2 overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />

      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <div className="relative p-6">
        <p className="font-dm-mono text-[0.68rem] text-accent tracking-[0.14em] uppercase mb-2">
          ✦ Stack recommandé
        </p>
        <h2 className="font-syne font-extrabold text-2xl tracking-[-0.03em] text-cream mb-3">
          {stackName}
        </h2>
        <p className="font-dm-sans text-sm text-muted-2 font-light leading-relaxed mb-6 max-w-xl">
          {justification}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] bg-border">
          <div className="bg-bg-2 px-4 py-3">
            <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em] mb-1">
              Coût total
            </p>
            <p className="font-syne font-extrabold text-xl text-cream">
              {total_cost}€
              <span className="font-dm-sans text-xs font-light text-muted-2">/mois</span>
            </p>
          </div>
          <div className="bg-bg-2 px-4 py-3">
            <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em] mb-1">
              ROI estimé
            </p>
            <p className="font-syne font-extrabold text-xl text-accent">
              +{roi_estimate}%
            </p>
          </div>
          {time_saved_per_week && (
            <div className="bg-bg-2 px-4 py-3">
              <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em] mb-1">
                Temps économisé
              </p>
              <p className="font-syne font-extrabold text-xl text-accent-3">
                {time_saved_per_week}h
                <span className="font-dm-sans text-xs font-light text-muted-2">/semaine</span>
              </p>
            </div>
          )}
          <div className="bg-bg-2 px-4 py-3">
            <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em] mb-1">
              Agents
            </p>
            <p className="font-syne font-extrabold text-xl text-cream">
              {agentCount}
              <span className="font-dm-sans text-xs font-light text-muted-2"> outils</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}