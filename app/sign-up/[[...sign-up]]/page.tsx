import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] flex items-center justify-center relative overflow-hidden">
      {/* Grid pattern matching landing page */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '60px 60px'
          }} />

      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #CAFF32 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <style dangerouslySetInnerHTML={{ __html: `
          .cl-cardBox { background: white !important; border: 1px solid #e4e4e7 !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; border-radius: 1rem !important; overflow: hidden !important; }
          .cl-card { border: none !important; box-shadow: none !important; background: transparent !important; }
          .cl-footer { background: transparent !important; border: none !important; margin-top: 0 !important; box-shadow: none !important; }
          .cl-footerAction { background: transparent !important; border: none !important; padding-top: 0 !important; box-shadow: none !important; }
          .cl-footer > div { border: none !important; box-shadow: none !important; background: transparent !important; }
          .cl-footer::before, .cl-footerAction::before { display: none !important; }
        `}} />
        <a href="/" className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-zinc-900 flex items-center">
          Ras
          <span className="relative flex items-center mx-[1px]">
            <span className="text-zinc-50 px-[3px] py-[1px] rounded-l-md leading-none shadow-sm z-10 text-[0.95em]" style={{ background: '#18181b' }}>p</span>
            <span className="text-zinc-900 px-[3px] py-[1px] rounded-r-md leading-none shadow-sm -ml-[1px] text-[0.95em]" style={{ background: '#CAFF32' }}>q</span>
          </span>
          uery
        </a>
        
        <SignUp
          fallbackRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#CAFF32',
              colorBackground: '#ffffff',
              colorText: '#18181b',
              colorTextSecondary: '#52525b',
              colorInputBackground: '#FAFAF7',
              colorInputText: '#18181b',
              borderRadius: '6px',
            },
            elements: {
              rootBox: 'mx-auto w-full',
              cardBox: 'bg-white shadow-md border border-zinc-200 rounded-2xl overflow-hidden',
              card: 'bg-transparent border-0 shadow-none',
              headerTitle: 'font-black text-2xl text-zinc-900',
              headerSubtitle: 'text-zinc-500 font-medium',
              formButtonPrimary: 'bg-[#CAFF32] text-zinc-900 hover:bg-[#b5e62c] font-bold shadow-sm border border-[#b5e62c] transition-all',
              formFieldInput: 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400 focus:ring-0 shadow-sm',
              formFieldLabel: 'text-zinc-700 font-medium',
              footerActionLink: 'text-zinc-900 hover:text-zinc-600 font-bold',
              dividerLine: 'bg-zinc-200',
              dividerText: 'text-zinc-400 font-medium',
              socialButtonsBlockButton: 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 shadow-sm',
              socialButtonsBlockButtonText: 'font-semibold',
              footerActionText: 'text-zinc-500',
              footer: 'bg-transparent border-0 shadow-none pt-0',
              footerAction: 'bg-transparent border-0 shadow-none pt-0',
              branding: '',
            },
          }}
        />
      </div>
    </main>
  )
}
