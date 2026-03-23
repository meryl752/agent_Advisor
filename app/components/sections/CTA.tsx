import RevealWrapper from '../ui/RevealWrapper'
import WaitlistForm from '../ui/WaitlistForm'

export default function CTA() {
  return (
    <section id="cta" className="px-[52px] py-[130px] flex flex-col items-center
                                   text-center relative overflow-hidden">
      {/* Bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                       pointer-events-none"
           style={{ background: 'radial-gradient(ellipse, rgba(200,241,53,0.06) 0%, transparent 70%)' }} />

      <RevealWrapper><p className="section-label mb-5">Early Access</p></RevealWrapper>

      <RevealWrapper delay={0.1}>
        <h2 className="font-syne font-extrabold tracking-[-0.035em] leading-[0.95] text-cream mb-5"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
          Ton stack.<br />Ton{' '}
          <span className="text-accent">avantage.</span>
        </h2>
      </RevealWrapper>

      <RevealWrapper delay={0.2}>
        <p className="text-muted-2 text-[1rem] font-light mb-11">
          Les 50 premiers accèdent gratuitement à la bêta privée.
        </p>
      </RevealWrapper>

      <RevealWrapper delay={0.3}>
        <WaitlistForm id="cta-email" centered />
      </RevealWrapper>
    </section>
  )
}
