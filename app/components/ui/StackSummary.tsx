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
    <div className="relative mb-6 border-2 border-[#CAFF32] bg-zinc-950 shadow-[0_0_30px_rgba(202,255,50,0.15)] overflow-hidden">
      <div className="relative p-6">
        <p className="font-dm-mono text-[0.7rem] text-[#CAFF32] font-black uppercase mb-2 tracking-[0.2em]">
          ✦ Stack recommandé
        </p>
        <h2 className="font-syne font-black text-3xl tracking-[-0.03em] text-white mb-3">
          {stackName}
        </h2>
        <p className="font-dm-sans text-sm text-zinc-300 font-medium leading-relaxed mb-6 max-w-xl">
          {justification}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-zinc-800">
          <div className="bg-zinc-900 px-5 py-4">
            <p className="font-dm-mono text-[0.6rem] text-zinc-500 font-bold uppercase mb-1 tracking-wider">
              Coût total
            </p>
            <p className="font-syne font-black text-2xl text-white">
              {total_cost}€
              <span className="font-dm-sans text-xs font-normal text-zinc-500 ml-1">/m</span>
            </p>
          </div>
          <div className="bg-zinc-900 px-5 py-4">
            <p className="font-dm-mono text-[0.6rem] text-zinc-500 font-bold uppercase mb-1 tracking-wider">
              ROI estimé
            </p>
            <p className="font-syne font-black text-2xl text-[#CAFF32]">
              +{roi_estimate}%
            </p>
          </div>
          {time_saved_per_week && (
            <div className="bg-zinc-900 px-5 py-4">
              <p className="font-dm-mono text-[0.6rem] text-zinc-500 font-bold uppercase mb-1 tracking-wider">
                Temps gagné
              </p>
              <p className="font-syne font-black text-2xl text-[#38bdf8]">
                {time_saved_per_week}h
                <span className="font-dm-sans text-xs font-normal text-zinc-500 ml-1">/s</span>
              </p>
            </div>
          )}
          <div className="bg-zinc-900 px-5 py-4">
            <p className="font-dm-mono text-[0.6rem] text-zinc-500 font-bold uppercase mb-1 tracking-wider">
              Outils
            </p>
            <p className="font-syne font-black text-2xl text-white">
              {agentCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}