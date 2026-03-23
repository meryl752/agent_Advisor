interface StackData {
  label: string
  name: string
  metrics: { key: string; value: string; good: boolean }[]
  winner?: boolean
}

const STACKS: StackData[] = [
  {
    label: 'Ton stack',
    name: 'Stack A',
    winner: true,
    metrics: [
      { key: 'Score', value: '84/100', good: true },
      { key: 'Coût/mois', value: '112€', good: true },
      { key: 'Automatisation', value: '87%', good: true },
      { key: 'ROI estimé', value: '+304%', good: true },
    ],
  },
  {
    label: 'Concurrent',
    name: 'Stack B',
    metrics: [
      { key: 'Score', value: '61/100', good: false },
      { key: 'Coût/mois', value: '198€', good: false },
      { key: 'Automatisation', value: '44%', good: false },
      { key: 'ROI estimé', value: '+89%', good: false },
    ],
  },
]

export default function VSComparison() {
  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 h-full">
        {[STACKS[0], null, STACKS[1]].map((stack, i) => {
          if (!stack) {
            return (
              <div key={i} className="flex items-center justify-center font-syne font-extrabold text-xl text-border-2">
                VS
              </div>
            )
          }
          return (
            <div
              key={i}
              className={`bg-bg-3 border p-3 ${stack.winner ? 'border-accent/30' : 'border-border'}`}
            >
              <p className="font-dm-mono text-[0.58rem] text-muted tracking-[0.08em] uppercase mb-2">
                {stack.label}
              </p>
              <p className="font-syne font-bold text-[0.85rem] text-cream mb-[10px]">
                {stack.name}
              </p>
              {stack.metrics.map((m, j) => (
                <div
                  key={j}
                  className="flex justify-between py-1 border-b border-[#161616] last:border-b-0 font-dm-mono text-[0.6rem]"
                >
                  <span className="text-muted">{m.key}</span>
                  <span className={m.good ? 'text-accent' : 'text-muted'}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
