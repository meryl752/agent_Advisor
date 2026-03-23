const SPARKS = [20, 35, 28, 55, 48, 70, 65, 90]

export default function ROIMock() {
  return (
    <div className="p-5 h-full flex flex-col gap-[10px]">
      <div className="flex gap-[10px]">
        <div className="bg-bg-3 border border-border p-3 flex-1">
          <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em]">Économies totales</p>
          <p className="font-syne font-extrabold text-[1.6rem] text-accent mt-[2px]">+340€</p>
          <span className="font-dm-mono text-[0.6rem] text-[#3d6e00] bg-accent/8 px-[7px] py-[2px] inline-block mt-1">
            ↑ +23% ce mois
          </span>
        </div>
        <div className="bg-bg-3 border border-border p-3 flex-1">
          <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em]">Dépenses outils</p>
          <p className="font-syne font-extrabold text-[1.6rem] text-cream mt-[2px]">112€</p>
          <span className="font-dm-mono text-[0.6rem] text-muted bg-bg-3 px-[7px] py-[2px] inline-block mt-1">
            ─ Stable
          </span>
        </div>
      </div>
      <div className="bg-bg-3 border border-border flex-1 p-[10px] px-[14px]">
        <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em]">Évolution ROI</p>
        <div className="flex items-end gap-[3px] h-10 mt-1">
          {SPARKS.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-accent/15 border-t border-accent"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
