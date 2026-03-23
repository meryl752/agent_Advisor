import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none
                      bg-[radial-gradient(circle,rgba(200,241,53,0.05)_0%,transparent_65%)]
                      top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <a href="/" className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-cream">
          Stack<span className="text-accent">AI</span>
        </a>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#C8F135',
              colorBackground: '#0d0d0d',
              colorText: '#f0ede6',
              colorTextSecondary: '#666666',
              colorInputBackground: '#111111',
              colorInputText: '#f0ede6',
              borderRadius: '0px',
              fontFamily: 'var(--font-dm-sans)',
            },
            elements: {
              card: 'bg-bg-2 border border-border shadow-none',
              headerTitle: 'font-syne font-extrabold text-cream',
              headerSubtitle: 'font-dm-mono text-muted-2 text-xs',
              formButtonPrimary: 'bg-accent text-bg font-syne font-bold hover:opacity-85 rounded-none',
              formFieldInput: 'bg-bg-3 border-border text-cream rounded-none focus:border-accent',
              footerActionLink: 'text-accent hover:text-accent/80',
              dividerLine: 'bg-border',
              dividerText: 'text-muted font-dm-mono text-xs',
              socialButtonsBlockButton: 'border-border bg-bg-3 text-cream hover:bg-bg-2',
            },
          }}
        />
      </div>
    </main>
  )
}
