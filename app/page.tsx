import Navigation from './components/layout/Navigation'
import Marquee from './components/layout/Marquee'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import Features from './components/sections/Features'
import Pricing from './components/sections/Pricing'
import CTA from './components/sections/CTA'

export default function Home() {
  return (
    <main>
      <Navigation />
      <Marquee />
      <Hero />
      <hr className="border-none border-t border-border mx-[52px]" />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
