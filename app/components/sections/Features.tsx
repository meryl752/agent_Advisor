import RevealWrapper from '../ui/RevealWrapper'
import MockupWindow from '../mockups/MockupWindow'
import AlertList from '../mockups/AlertList'
import ScoreCircle from '../mockups/ScoreCircle'
import WorkflowVisualizer from '../mockups/WorkflowVisualizer'
import VSComparison from '../mockups/VSComparison'
import BarChart from '../mockups/BarChart'

const ROI_BARS = [
  { height: 20 }, { height: 35 }, { height: 28 },
  { height: 55 }, { height: 48 }, { height: 70 },
  { height: 65 }, { height: 90 },
]

const ALERTS = [
  { type: 'success' as const, title: 'GPT-4o', message: "vient de baisser ses prix de 50%. Ton stack peut être optimisé.", time: 'Il y a 2 minutes' },
  { type: 'warning' as const, title: 'Jasper AI', message: "est remplacé avantageusement par Claude Sonnet pour ton cas d'usage.", time: 'Il y a 1 heure' },
  { type: 'info' as const, title: 'Nouvelle recommandation', message: '— Perplexity Pages correspond à ton objectif SEO.', time: "Aujourd'hui 09:14" },
  { type: 'success' as const, title: 'Make.com', message: 'a lancé une intégration native avec ton CRM.', time: 'Hier 17:42' },
]

const SCORE_METRICS = [
  { label: 'Couverture des tâches', value: 92 },
  { label: 'Efficacité coût', value: 78 },
  { label: 'Compatibilité outils', value: 86 },
  { label: 'Automatisation', value: 65 },
  { label: 'Scalabilité', value: 70 },
]

const FEATURES = [
  {
    num: 'Feature 01', title: 'ROI Tracker', tag: 'Core Feature',
    desc: 'Un tableau de bord en temps réel qui calcule exactement combien tu économises. Le chiffre qui justifie ton abonnement à lui seul.',
    mock: (
      <div className="p-5 flex flex-col gap-[10px]">
        <div className="grid grid-cols-2 gap-[10px]">
          {[
            { label: 'Économies totales', value: '+340€', change: '↑ +23% ce mois', good: true },
            { label: 'Dépenses outils', value: '112€', change: '─ Stable', good: false },
          ].map((c) => (
            <div key={c.label} className="bg-bg-3 border border-border p-3">
              <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.08em]">{c.label}</p>
              <p className={`font-syne font-extrabold text-[1.6rem] mt-[2px] ${c.good ? 'text-accent' : 'text-cream'}`}>{c.value}</p>
              <span className={`font-dm-mono text-[0.6rem] px-[7px] py-[2px] inline-block mt-1 ${c.good ? 'text-[#3d6e00] bg-accent/8' : 'text-muted bg-bg-3'}`}>{c.change}</span>
            </div>
          ))}
        </div>
        <div className="bg-bg-3 border border-border p-[10px] px-[14px]">
          <p className="font-dm-mono text-[0.58rem] text-muted uppercase mb-1">Évolution ROI</p>
          <div className="flex items-end gap-[3px] h-10">
            {ROI_BARS.map((b, i) => (
              <div key={i} className="flex-1 bg-accent/15 border-t border-accent" style={{ height: `${b.height}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    num: 'Feature 02', title: 'Stack Alerts', tag: 'Rétention maximale',
    desc: "Dès qu'un outil de ton stack devient obsolète ou qu'un concurrent supérieur sort — tu reçois une alerte instantanée. Personne ne fait ça aujourd'hui.",
    mock: <AlertList items={ALERTS} />,
  },
  {
    num: 'Feature 03', title: 'Stack Score', tag: 'Viralité',
    desc: "Un score de 0 à 100 qui évalue l'efficacité de ton stack selon 5 critères. Les utilisateurs optimisent pour atteindre 100. Très partageable.",
    mock: <ScoreCircle score={84} metrics={SCORE_METRICS} />,
  },
  {
    num: 'Feature 04', title: 'Workflow Visualizer', tag: 'Premium',
    desc: "Un canvas interactif qui cartographie comment tes agents s'interconnectent. Visualise les goulots d'étranglement, identifie ce qui peut être automatisé.",
    mock: <WorkflowVisualizer />,
  },
]

export default function Features() {
  return (
    <section id="features" className="px-[52px] py-[110px]">
      <RevealWrapper><p className="section-label mb-[18px]">Fonctionnalités</p></RevealWrapper>
      <RevealWrapper delay={0.1}>
        <h2 className="section-title text-cream mb-4">Cinq features.<br />Un seul objectif :<br />ton ROI.</h2>
      </RevealWrapper>
      <RevealWrapper delay={0.2}>
        <p className="text-muted-2 text-[0.95rem] font-light leading-[1.8] max-w-[480px] mb-16">
          Chaque fonctionnalité a été conçue pour une obsession — que chaque euro dépensé en outils IA te rapporte davantage.
        </p>
      </RevealWrapper>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {FEATURES.map((f, i) => (
          <RevealWrapper key={f.title} delay={i * 0.08}>
            <div className="group bg-bg hover:bg-[#0b0b0b] transition-colors duration-300
                            relative after:content-[''] after:absolute after:top-0 after:left-0
                            after:right-0 after:h-[2px] after:bg-transparent
                            hover:after:bg-accent after:transition-colors after:duration-300 h-full">
              <MockupWindow title={`StackAI — ${f.title}`}>
                <div className="h-[220px] overflow-hidden border-b border-border">
                  {f.mock}
                </div>
              </MockupWindow>
              <div className="p-8 md:p-9">
                <p className="font-dm-mono text-[0.65rem] text-muted tracking-[0.1em] uppercase mb-3">{f.num}</p>
                <h3 className="font-syne font-extrabold text-[1.25rem] tracking-[-0.02em] text-cream mb-[10px]">{f.title}</h3>
                <p className="text-[0.88rem] text-muted-2 leading-[1.75] font-light">{f.desc}</p>
                <span className="inline-block font-dm-mono text-[0.62rem] tracking-[0.1em] uppercase
                                  text-accent border border-accent/20 px-[10px] py-[3px] mt-[14px]">
                  {f.tag}
                </span>
              </div>
            </div>
          </RevealWrapper>
        ))}
      </div>

      {/* Stack vs Stack — full width */}
      <RevealWrapper delay={0.1} className="mt-px bg-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          <div className="bg-bg">
            <MockupWindow title="StackAI — Stack vs Stack">
              <div className="h-[200px] overflow-hidden">
                <VSComparison />
              </div>
            </MockupWindow>
          </div>
          <div className="bg-bg p-9 md:p-10 flex flex-col justify-center">
            <p className="font-dm-mono text-[0.65rem] text-muted tracking-[0.1em] uppercase mb-3">Feature 05</p>
            <h3 className="font-syne font-extrabold text-[1.25rem] tracking-[-0.02em] text-cream mb-[10px]">Stack vs Stack</h3>
            <p className="text-[0.88rem] text-muted-2 leading-[1.75] font-light">
              Compare ton stack avec celui d&apos;un concurrent. Vois exactement où tu perds de l&apos;argent ou de l&apos;efficacité. La feature la plus partagée sur LinkedIn.
            </p>
            <span className="inline-block font-dm-mono text-[0.62rem] tracking-[0.1em] uppercase
                              text-accent border border-accent/20 px-[10px] py-[3px] mt-4 self-start">
              Growth Hack
            </span>
          </div>
        </div>
      </RevealWrapper>
    </section>
  )
}
