export default function AlertsPage() {
  const ALERTS = [
    { type: 'success', text: 'GPT-4o a baissé ses prix de 50%', time: 'Il y a 2 min', color: '#CAFF32', icon: '✦', detail: 'Le coût par token a été réduit de moitié. Tes stacks utilisant GPT-4o sont maintenant plus rentables.' },
    { type: 'warning', text: 'Jasper remplaçable par Claude Sonnet', time: 'Il y a 1h', color: '#FF6B35', icon: '⚠', detail: 'Claude Sonnet offre des performances similaires à 46€/mois de moins. Migration recommandée.' },
    { type: 'info', text: 'Nouveau: Perplexity Pages disponible', time: 'Il y a 9h', color: '#38bdf8', icon: '◎', detail: 'Perplexity lance une nouvelle fonctionnalité de création de pages. Pertinent pour les stacks de recherche.' },
    { type: 'info', text: 'Mise à jour: Notion AI v2.0', time: 'Il y a 2j', color: '#38bdf8', icon: '◎', detail: 'Notion AI intègre maintenant des capacités de génération de bases de données automatiques.' },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">Stack Alerts</h1>
        <p className="text-zinc-500 text-sm">Notifications en temps réel sur les outils de ton stack.</p>
      </div>

      <div className="flex flex-col gap-3">
        {ALERTS.map((alert, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 flex items-center justify-center font-bold text-sm flex-shrink-0 border"
                style={{ color: alert.color, borderColor: `${alert.color}30`, backgroundColor: `${alert.color}08` }}>
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-zinc-200 text-sm font-semibold">{alert.text}</p>
                  <span className="font-dm-mono text-[10px] text-zinc-600 ml-4 flex-shrink-0">{alert.time}</span>
                </div>
                <p className="text-zinc-500 text-xs leading-relaxed">{alert.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-zinc-900/30 border border-zinc-800/50 border-dashed p-6 text-center">
        <p className="font-dm-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-2">Fonctionnalité Pro</p>
        <p className="text-zinc-400 text-sm">Alertes personnalisées sur tes outils spécifiques et notifications email disponibles avec le plan Pro.</p>
      </div>
    </div>
  )
}
