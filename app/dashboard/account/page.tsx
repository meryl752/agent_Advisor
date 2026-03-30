import { UserProfile } from '@clerk/nextjs'

export default function AccountPage() {
  return (
    <div className="w-full flex justify-center py-4">
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full max-w-2xl',
            card: 'bg-zinc-900 border border-zinc-800 shadow-none rounded-none',
            navbar: 'bg-zinc-900 border-r border-zinc-800',
            navbarButton: 'text-zinc-400 hover:text-white hover:bg-zinc-800',
            navbarButtonActive: 'text-white bg-zinc-800',
            pageScrollBox: 'bg-zinc-900',
            formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
            formButtonPrimary: 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50]',
            headerTitle: 'text-white font-syne',
            headerSubtitle: 'text-zinc-400',
            profileSectionTitle: 'text-zinc-300',
            profileSectionContent: 'text-zinc-400',
            dividerLine: 'bg-zinc-800',
            badge: 'bg-zinc-800 text-zinc-400',
          },
        }}
      />
    </div>
  )
}
