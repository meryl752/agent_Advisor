import { InfiniteMovingCards } from "../ui/infinite-moving-cards";

const stats = [
  {
    quote: "127 stacks generated this week",
    name: "Platform Performance",
    title: "Internal Data",
  },
  {
    quote: "Most active sector: E-commerce",
    name: "B2B Trends",
    title: "Market Insight",
  },
  {
    quote: "Average estimated ROI from our stacks: +340%",
    name: "User Average",
    title: "Key Stat",
  },
  {
    quote: "Average time saved: 12h/week per team member",
    name: "User Survey",
    title: "Direct Impact",
  },
  {
    quote: "Over 10,000 tasks automated every day",
    name: "Execution Volume",
    title: "Global Dashboard",
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-white overflow-hidden relative z-10">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="font-black text-zinc-900 leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }}>
          Proof in numbers
        </h2>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto font-medium">
          The real impact of automation on our beta testers this week.
        </p>
      </div>
      
      <div className="flex flex-col antialiased items-center justify-center relative overflow-hidden">
        <InfiniteMovingCards
          items={stats}
          direction="left"
          speed="slow"
        />
      </div>
    </section>
  );
}
