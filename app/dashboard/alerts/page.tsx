export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-zinc-900 dark:text-white tracking-tighter mb-2">Alerts</h1>
        <p className="text-zinc-500 text-sm">Manage your notifications and alerts</p>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-16 text-center">
        <p className="font-syne font-black text-zinc-900 dark:text-white text-xl mb-3">No alerts yet</p>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
          You'll receive notifications here when important events occur
        </p>
      </div>
    </div>
  )
}
