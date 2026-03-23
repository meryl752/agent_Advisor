import { currentUser } from '@clerk/nextjs/server'
import DashboardCard from '../components/mockups/DashboardCard'
import BarChart from '../components/mockups/BarChart'
import StackList from '../components/mockups/StackList'
import AlertList from '../components/mockups/AlertList'

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? 'toi'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-dm-mono text-[0.7rem] text-muted tracking-[0.12em] uppercase mb-2">
          Bienvenue,
        </p>
        <h1 className="font-syne font-extrabold text-3xl tracking-[-0.03em] text-cream">
          {firstName} <span className="text-accent">✦</span>
        </h1>
        <p className="font-dm-sans text-sm text-muted-2 mt-1 font-light">
          Voici l&apos;état de ton stack IA ce mois-ci.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-[2px] bg-border mb-[2px]">
        <DashboardCard label="ROI ce mois" value="+340€" sub="↑ 23% vs mois dernier" variant="green" />
        <DashboardCard label="Outils actifs" value="7" sub="sur 12 recommandés" />
        <DashboardCard label="Stack Score" value="84/100" sub="↑ +6 cette semaine" variant="orange" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-[2px] bg-border mb-[2px]">
        <BarChart />
        <div className="bg-bg-3 border border-border p-4">
          <p className="font-dm-mono text-[0.6rem] text-muted tracking-[0.08em] uppercase mb-3">
            Prochaine action recommandée
          </p>
          <p className="font-syne font-bold text-cream text-sm mb-2">
            Remplace Jasper par Claude Sonnet
          </p>
          <p className="font-dm-sans text-[0.82rem] text-muted-2 font-light leading-relaxed">
            Tu économises 46€/mois. Claude fait exactement la même chose pour ton cas d&apos;usage copywriting.
          </p>
          <button className="mt-4 bg-accent text-bg font-syne font-bold text-[0.75rem] px-4 py-2
                             tracking-[0.03em] hover:opacity-85 transition-opacity">
            Voir le détail →
          </button>
        </div>
      </div>

      {/* Stack + Alerts */}
      <div className="grid grid-cols-2 gap-[2px] bg-border">
        <StackList />
        <div className="bg-bg">
          <AlertList />
        </div>
      </div>

      {/* CTA — Recommandation */}
      <div className="mt-6 border border-dashed border-accent/30 p-6 flex items-center justify-between">
        <div>
          <p className="font-syne font-bold text-cream mb-1">
            Tu n&apos;as pas encore défini ton objectif
          </p>
          <p className="font-dm-sans text-sm text-muted-2 font-light">
            Décris ce que tu veux accomplir — StackAI construit ton stack optimal en 30 secondes.
          </p>
        </div>
        <a
          href="/dashboard/recommend"
          className="flex-shrink-0 ml-6 bg-accent text-bg font-syne font-bold
                     text-[0.85rem] px-6 py-3 tracking-[0.03em] hover:opacity-85 transition-opacity"
        >
          Obtenir mon stack →
        </a>
      </div>
    </div>
  )
}
