import { NAV_LINKS } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="border-t border-border px-[52px] py-7
                        flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="font-syne font-extrabold text-[0.9rem] text-cream">
        Stack<span className="text-accent">AI</span>
      </div>

      <div className="hidden md:flex gap-7">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="font-dm-mono text-[0.65rem] text-muted
                       uppercase hover:text-accent transition-colors"
          >
            {link.label}
          </a>
        ))}
        <a href="#" className="font-dm-mono text-[0.65rem] text-muted
                               uppercase hover:text-accent transition-colors">
          Contact
        </a>
      </div>

      <p className="font-dm-mono text-[0.62rem] text-muted">
        © 2025 Raspquery — Tous droits réservés
      </p>
    </footer>
  )
}
