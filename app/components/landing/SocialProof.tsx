import { InfiniteMovingCards } from "../ui/infinite-moving-cards";

const stats = [
  {
    quote: "127 stacks générés cette semaine",
    name: "Performances Plateforme",
    title: "Data Interne",
  },
  {
    quote: "Secteur le plus actif : E-commerce",
    name: "Tendances B2B",
    title: "Insight Marché",
  },
  {
    quote: "ROI moyen estimé par nos stacks : +340%",
    name: "Moyenne Utilisateurs",
    title: "Statistique Clé",
  },
  {
    quote: "Gain de temps moyen : 12h/semaine par collaborateur",
    name: "Enquête Utilisateurs",
    title: "Impact Direct",
  },
  {
    quote: "Plus de 10.000 tâches automatisées chaque jour",
    name: "Volume d'Exécution",
    title: "Dashboard Monde",
  },
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-white overflow-hidden relative z-10">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h2 className="font-black text-zinc-900 leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }}>
          La preuve en chiffres
        </h2>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto font-medium">
          L'impact réel de l'automatisation sur nos beta-testeurs cette semaine.
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
