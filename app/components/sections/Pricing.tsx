import RevealWrapper from '../ui/RevealWrapper'
import { PRICING_TIERS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export default function Pricing() {
  return (
    <section id="pricing" className="px-[52px] py-[110px] bg-bg-2
                                      border-t border-b border-border">
      <RevealWrapper><p className="section-label mb-[18px]">Pricing</p></RevealWrapper>
      <RevealWrapper delay={0.1}>
        <h2 className="section-title text-cream mb-16">
          Simple.<br />Transparent.<br />ROI positif dès le 1er mois.
        </h2>
      </RevealWrapper>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
        {PRICING_TIERS.map((tier, i) => (
          <RevealWrapper key={tier.name} delay={i * 0.08}>
            <div className={cn(
              'relative p-[44px_36px] h-full flex flex-col',
              tier.featured ? 'bg-[#0e1500] after:content-[""] after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px] after:bg-accent' : 'bg-bg-2'
            )}>
              {tier.featured && (
                <span className="font-dm-mono text-[0.62rem] text-accent border border-accent/30
                                  px-[10px] py-[3px] tracking-[0.1em] uppercase inline-block mb-5 self-start">
                  ✦ Plus populaire
                </span>
              )}

              <h3 className="font-syne font-extrabold text-[1.1rem] tracking-[-0.02em] text-cream mb-2">
                {tier.name}
              </h3>

              <div className="font-syne font-extrabold text-[3rem] tracking-[-0.04em] text-cream leading-none mb-4">
                {tier.price}€
                <span className="text-[1rem] font-normal text-muted-2">/mois</span>
              </div>

              <p className="text-[0.85rem] text-muted-2 font-light mb-7">{tier.description}</p>

              <ul className="flex flex-col gap-[10px] mb-8 flex-1">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex gap-[10px] text-[0.85rem] text-[#777] font-light">
                    <span className="text-accent text-[0.65rem] mt-[2px] flex-shrink-0">✦</span>
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={cn(
                'w-full py-[14px] font-syne font-bold text-[0.85rem] tracking-[0.03em]',
                'border transition-all duration-200',
                tier.featured
                  ? 'bg-accent text-bg border-accent hover:opacity-85'
                  : 'bg-transparent text-cream border-border-2 hover:border-accent'
              )}>
                {tier.cta}
              </button>
            </div>
          </RevealWrapper>
        ))}
      </div>
    </section>
  )
}
