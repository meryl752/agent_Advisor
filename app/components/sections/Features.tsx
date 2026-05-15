import RevealWrapper from '../ui/RevealWrapper'
import MockupWindow from '../mockups/MockupWindow'
import AlertList from '../mockups/AlertList'
import ScoreCircle from '../mockups/ScoreCircle'
import WorkflowVisualizer from '../mockups/WorkflowVisualizer'
import VSComparison from '../mockups/VSComparison'

const ROI_BARS = [
  { height: 20 }, { height: 35 }, { height: 28 },
  { height: 55 }, { height: 48 }, { height: 70 },
  { height: 65 }, { height: 90 },
]

const ALERTS = [
  { type: 'success' as const, title: 'GPT-4o', message: "just dropped its prices by 50%. Your stack can be optimized.", time: '2 minutes ago' },
  { type: 'warning' as const, title: 'Jasper AI', message: "is being outperformed by Claude Sonnet for your use case.", time: '1 hour ago' },
  { type: 'info' as const, title: 'New recommendation', message: '— Perplexity Pages matches your SEO goal.', time: "Today 09:14" },
  { type: 'success' as const, title: 'Make.com', message: 'launched a native integration with your CRM.', time: 'Yesterday 17:42' },
]

const SCORE_METRICS = [
  { label: 'Task coverage', value: 92 },
  { label: 'Cost efficiency', value: 78 },
  { label: 'Tool compatibility', value: 86 },
  { label: 'Automation', value: 65 },
  { label: 'Scalability', value: 70 },
]

const FEATURES = [
  {
    num: 'Feature 01', title: 'ROI Tracker', tag: 'Core Feature',
    desc: 'A real-time dashboard that calculates exactly how much you save. The number that justifies your subscription on its own.',
    mock: (
      <div className="p-5 flex flex-col gap-[10px]">
        <div className="grid grid-cols-2 gap-[10px]">
          {[
            { label: 'Total savings', value: '+340€', change: '↑ +23% this month', good: true },
            { label: 'Tool spend', value: '112€', change: '─ Stable', good: false },
          ].map((c) => (
            <div key={c.label} className="bg-bg-3 p-3">
              <p className="font-dm-mono text-[0.58rem] text-muted uppercase">{c.label}</p>
              <p className={`font-syne font-extrabold text-[1.6rem] mt-[2px] ${c.good ? 'text-accent' : 'text-cream'}`}>{c.value}</p>
              <span className={`font-dm-mono text-[0.6rem] px-[7px] py-[2px] inline-block mt-1 ${c.good ? 'text-[#3d6e00] bg-accent/8' : 'text-muted bg-bg-3'}`}>{c.change}</span>
            </div>
          ))}
        </div>
        <div className="bg-bg-3 p-[10px] px-[14px]">
          <p className="font-dm-mono text-[0.58rem] text-muted uppercase mb-1">ROI trend</p>
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
    num: 'Feature 02', title: 'Stack Alerts', tag: 'Maximum retention',
    desc: "As soon as a tool in your stack becomes obsolete or a better competitor launches — you get an instant alert. Nobody does this today.",
    mock: <AlertList items={ALERTS} />,
  },
  {
    num: 'Feature 03', title: 'Stack Score', tag: 'Virality',
    desc: "A 0-to-100 score that rates your stack efficiency across 5 criteria. Users optimize to reach 100. Highly shareable.",
    mock: <ScoreCircle score={84} metrics={SCORE_METRICS} />,
  },
  {
    num: 'Feature 04', title: 'Workflow Visualizer', tag: 'Premium',
    desc: "An interactive canvas that maps how your agents interconnect. Visualize bottlenecks, identify what can be automated.",
    mock: <WorkflowVisualizer />,
  },
]

export default function Features() {
  return (
    <section id="features" className="px-[52px] py-[110px]">
      <RevealWrapper><p className="section-label mb-[18px]">Features</p></RevealWrapper>
      <RevealWrapper delay={0.1}>
        <h2 className="section-title text-cream mb-4">Five features.<br />One single goal:<br />your ROI.</h2>
      </RevealWrapper>
      <RevealWrapper delay={0.2}>
        <p className="text-muted-2 text-[0.95rem] font-light leading-[1.8] max-w-[480px] mb-16">
          Every feature was built around one obsession — making every euro spent on AI tools pay back more.
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
              <MockupWindow title={`Raspquery — ${f.title}`}>
                <div className="h-[220px] overflow-hidden">
                  {f.mock}
                </div>
              </MockupWindow>
              <div className="p-8 md:p-9">
                <p className="font-dm-mono text-[0.65rem] text-muted uppercase mb-3">{f.num}</p>
                <h3 className="font-syne font-extrabold text-[1.25rem] tracking-[-0.02em] text-cream mb-[10px]">{f.title}</h3>
                <p className="text-[0.88rem] text-muted-2 leading-[1.75] font-light">{f.desc}</p>
                <span className="inline-block font-dm-mono text-[0.62rem] uppercase
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
            <MockupWindow title="Raspquery — Stack vs Stack">
              <div className="h-[200px] overflow-hidden">
                <VSComparison />
              </div>
            </MockupWindow>
          </div>
          <div className="bg-bg p-9 md:p-10 flex flex-col justify-center">
            <p className="font-dm-mono text-[0.65rem] text-muted uppercase mb-3">Feature 05</p>
            <h3 className="font-syne font-extrabold text-[1.25rem] tracking-[-0.02em] text-cream mb-[10px]">Stack vs Stack</h3>
            <p className="text-[0.88rem] text-muted-2 leading-[1.75] font-light">
              Compare your stack against a competitor&apos;s. See exactly where you&apos;re losing money or efficiency. The most shared feature on LinkedIn.
            </p>
            <span className="inline-block font-dm-mono text-[0.62rem] uppercase
                              text-accent border border-accent/20 px-[10px] py-[3px] mt-4 self-start">
              Growth Hack
            </span>
          </div>
        </div>
      </RevealWrapper>
    </section>
  )
}
