interface ScoreCircleProps {
  score: number
  metrics: { label: string; value: number }[]
}

export default function ScoreCircle({ score, metrics }: ScoreCircleProps) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex gap-[14px] p-5 h-full">
      {/* Circle */}
      <div className="flex flex-col items-center justify-center bg-bg-3 border border-border p-5 flex-shrink-0 w-[120px]">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="-rotate-90 absolute inset-0" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r={radius} stroke="#1a1a1a" strokeWidth="6" />
            <circle
              cx="40" cy="40" r={radius}
              stroke="#C8F135" strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              opacity={0.8}
            />
          </svg>
          <span className="font-syne font-extrabold text-[1.5rem] text-accent relative z-10">
            {score}
          </span>
        </div>
        <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.1em] mt-2 text-center">
          Stack Score
        </p>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-[7px] flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="bg-bg-3 border border-border px-3 py-2">
            <p className="font-dm-mono text-[0.6rem] text-muted-2 mb-[5px]">{m.label}</p>
            <div className="h-[3px] bg-border-2 w-full">
              <div className="h-full bg-accent" style={{ width: `${m.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
