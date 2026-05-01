/**
 * Comprehensive translation of ALL French text in the agents database to English.
 * Uses a static map — NO LLM calls.
 *
 * Usage:
 *   node scripts/db-translate-comprehensive.mjs          # dry-run (no writes)
 *   node scripts/db-translate-comprehensive.mjs --apply  # commit updates
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

// ---------------------------------------------------------------------------
// French detection
// ---------------------------------------------------------------------------

export const FRENCH_INDICATORS = [
  /\b(avec|pour|les|des|une|est|dans|sur|par|qui|que|pas|plus|très|aussi|mais|donc|car|ou|et|du|au|aux|ce|se|sa|son|ses|leur|leurs|nous|vous|ils|elles|je|tu|il|elle|on|mon|ton|ma|ta|mes|tes|nos|vos|un|la|le|en|de|à|y|ne|ni)\b/i,
  /[àâäéèêëîïôùûüçœæ]/,
]

export function isFrench(text) {
  if (!text || typeof text !== 'string') return false
  return FRENCH_INDICATORS.some(re => re.test(text))
}


// ---------------------------------------------------------------------------
// Comprehensive static translation map
// ---------------------------------------------------------------------------

export const TRANSLATIONS = {
  // ── Descriptions ──────────────────────────────────────────────────────────
  "LLM polyvalent d'OpenAI, excellent pour la rédaction créative et le brainstorming.":
    "OpenAI's versatile LLM, excellent for creative writing and brainstorming.",
  "Design graphique avec IA intégrée pour les non-designers.":
    "Graphic design with built-in AI for non-designers.",
  "Assistant code IA intégré à VS Code et JetBrains.":
    "AI code assistant integrated with VS Code and JetBrains.",
  "Outil SEO complet — backlinks, mots-clés, audit technique.":
    "Comprehensive SEO tool — backlinks, keywords, technical audit.",
  "CRM tout-en-un avec IA pour sales et marketing.":
    "All-in-one CRM with AI for sales and marketing.",
  "Génération d'images IA de qualité professionnelle.":
    "Professional-quality AI image generation.",
  "IDE IA-first basé sur VS Code, excellent pour le vibe coding.":
    "AI-first IDE based on VS Code, excellent for vibe coding.",
  "Plateforme email/SMS marketing IA pour e-commerce avec segmentation et personnalisation avancée.":
    "AI email/SMS marketing platform for e-commerce with advanced segmentation and personalization.",
  "Email + SMS marketing automation pour e-commerce — flows abandons panier, post-achat, winback.":
    "Email + SMS marketing automation for e-commerce — cart abandonment, post-purchase, winback flows.",
  "Suite marketing digitale — SEO, ads, social, contenu.":
    "Digital marketing suite — SEO, ads, social, content.",
  "Standard analytics web, gratuit et puissant.":
    "Standard web analytics, free and powerful.",
  "Plateforme d'agents IA personnalisables pour automatiser emails, réunions et CRM.":
    "Customizable AI agents platform to automate emails, meetings and CRM.",
  // From db-translate-to-english.mjs (keep all existing ones too)
  "Moteur de recherche IA pour la veille et la recherche en temps réel.":
    "AI-powered search engine for real-time research and competitive intelligence.",
  "Planification de contenu social avec suggestions IA.":
    "Social content scheduling with AI-powered suggestions.",
  "Enrichissement de données et personnalisation d'outreach à l'IA.":
    "AI-powered data enrichment and outreach personalization.",
  "Meilleur modèle LLM pour la rédaction, l'analyse et le code.":
    "Top LLM model for writing, analysis, and code generation.",
  "Modèle open source de génération d'images, auto-hébergeable.":
    "Open-source self-hostable image generation model.",
  "Automatisation open source auto-hébergeable, très flexible.":
    "Open-source self-hostable automation platform, highly flexible.",
  "Outil de prospection et d'enrichissement de données B2B.":
    "B2B prospecting and data enrichment tool.",
  "Plateforme de création de contenu IA pour le copywriting et le marketing.":
    "AI content creation platform for copywriting and marketing.",
  "Outil de planification et d'analyse des réseaux sociaux.":
    "Social media scheduling and analytics tool.",
  "Plateforme d'automatisation du marketing par email.":
    "Email marketing automation platform.",
  "Outil de recherche de mots-clés et d'analyse SEO.":
    "Keyword research and SEO analysis tool.",
  "Plateforme de gestion de la relation client (CRM).":
    "Customer relationship management (CRM) platform.",
  "Outil de création de vidéos IA avec avatars.":
    "AI video creation tool with avatars.",
  "Plateforme d'analyse web et de suivi des conversions.":
    "Web analytics and conversion tracking platform.",
  "Assistant IA pour la gestion de boutique e-commerce.":
    "AI assistant for e-commerce store management.",
  "Outil de support client e-commerce centralisé.":
    "Centralized e-commerce customer support tool.",
  "Plateforme de recherche de contacts B2B en temps réel.":
    "Real-time B2B contact search platform.",
  "Outil d'optimisation de contenu SEO en temps réel.":
    "Real-time SEO content optimization tool.",
  "Modèle de génération d'images par OpenAI.":
    "Image generation model by OpenAI.",
  "Outil de création de vidéos IA multilingues.":
    "Multilingual AI video creation tool.",
  "Plateforme d'analyse web gratuite de Google.":
    "Free web analytics platform by Google.",
  "IDE avec assistance IA pour le développement.":
    "AI-assisted IDE for software development.",
  "API de recherche web optimisée pour les agents IA.":
    "Web search API optimized for AI agents.",

  // ── use_cases ─────────────────────────────────────────────────────────────
  "rédaction de contenu": "content writing",
  "génération de code": "code generation",
  "résumé de documents": "document summarization",
  "brainstorming stratégique": "strategic brainstorming",
  "support client automatisé": "automated customer support",
  "création de visuels marketing": "marketing visual creation",
  "design de posts réseaux sociaux": "social media post design",
  "génération de présentations": "presentation generation",
  "création de logos": "logo creation",
  "templates personnalisés": "custom templates",
  "vidéos courtes": "short videos",
  "suite SEO complète": "complete SEO suite",
  "recherche de mots-clés": "keyword research",
  "audit de site": "site audit",
  "analyse de backlinks": "backlink analysis",
  "suivi de positions": "rank tracking",
  "automatisation de workflows visuels": "visual workflow automation",
  "intégration APIs sans code": "no-code API integration",
  "email": "email marketing",
  "sms": "SMS marketing",
  "prospection B2B automatisée": "automated B2B prospecting",
  "enrichissement de contacts": "contact enrichment",
  "recherche web IA en temps réel": "real-time AI web search",
  "veille concurrentielle": "competitive intelligence",
  "rédiger et affiner des emails, propositions commerciales et contenus marketing variés":
    "write and refine emails, business proposals and varied marketing content",
  "brainstormer des idées de produits, de campagnes et de stratégies business":
    "brainstorm product ideas, campaigns and business strategies",
  "analyser des données textuelles, documents et rapports pour en extraire des insights actionnables":
    "analyze text data, documents and reports to extract actionable insights",
  "automatiser des tâches répétitives en créant des GPTs personnalisés pour son workflow":
    "automate repetitive tasks by creating custom GPTs for your workflow",
  "générer, optimiser et déboguer du code en plusieurs langages de programmation":
    "generate, optimize and debug code in multiple programming languages",
  "traduire et adapter des contenus marketing pour des marchés internationaux":
    "translate and adapt marketing content for international markets",
  "créer des scripts de vente, réponses aux objections et séquences email":
    "create sales scripts, objection responses and email sequences",
  "autocompléter du code en temps réel dans VS Code, JetBrains ou Neovim":
    "autocomplete code in real-time in VS Code, JetBrains or Neovim",
  "générer des fonctions entières à partir d'un commentaire ou d'une description":
    "generate entire functions from a comment or description",
  "rédiger des tests unitaires automatiquement pour du code existant":
    "automatically write unit tests for existing code",
  "refactorer et améliorer la qualité de code avec des suggestions contextuelles":
    "refactor and improve code quality with contextual suggestions",
  "accélérer le développement dans de nouveaux langages ou frameworks inconnus":
    "accelerate development in new or unfamiliar languages and frameworks",
  "générer des images personnalisées en local sans envoi de données dans le cloud":
    "generate custom images locally without sending data to the cloud",
  "fine-tuner un modèle sur des visuels de marque pour une cohérence visuelle parfaite":
    "fine-tune a model on brand visuals for perfect visual consistency",
  "produire des images en masse via API ou pipeline automatisé":
    "produce images at scale via API or automated pipeline",
  "expérimenter des styles artistiques et des LoRA personnalisés":
    "experiment with artistic styles and custom LoRAs",
  "intégrer la génération d'images dans des applications SaaS via des pipelines ComfyUI":
    "integrate image generation into SaaS applications via ComfyUI pipelines",
  "analyser le profil de backlinks d'un site concurrent pour identifier des opportunités de link building":
    "analyze a competitor's backlink profile to identify link building opportunities",
  "trouver des mots-clés à fort potentiel avec un niveau de concurrence faible pour se positionner":
    "find high-potential keywords with low competition to rank for",
  "réaliser un audit SEO technique complet pour identifier les erreurs de crawl et les problèmes d'indexation":
    "perform a complete technical SEO audit to identify crawl errors and indexing issues",
  "suivre le classement de ses mots-clés cibles semaine après semaine dans les SERPs":
    "track target keyword rankings week by week in the SERPs",
  "identifier les pages concurrentes qui génèrent le plus de trafic organique":
    "identify competitor pages generating the most organic traffic",
  "trouver des opportunités de contenu avec l'outil Content Gap (mots-clés des concurrents non couverts)":
    "find content opportunities with the Content Gap tool (uncovered competitor keywords)",
  "analyser les ancre texts et la qualité des backlinks pour éviter les pénalités Google":
    "analyze anchor texts and backlink quality to avoid Google penalties",
  "centraliser les contacts, les deals et les activités commerciales dans un CRM gratuit et structuré":
    "centralize contacts, deals and commercial activities in a free structured CRM",
  "créer des séquences d'emails de prospection automatisées avec suivi des ouvertures et clics":
    "create automated prospecting email sequences with open and click tracking",
  "gérer le pipeline commercial et suivre l'avancement des deals en temps réel":
    "manage the sales pipeline and track deal progress in real time",
  "automatiser les workflows marketing (nurturing, onboarding, relances) selon le comportement utilisateur":
    "automate marketing workflows (nurturing, onboarding, follow-ups) based on user behavior",
  "créer des landing pages et formulaires de capture de leads directement dans l'outil":
    "create landing pages and lead capture forms directly in the tool",
  "analyser les performances commerciales et marketing dans des rapports unifiés":
    "analyze sales and marketing performance in unified reports",
  "intégrer toutes les données CRM avec les outils de vente (Gmail, Outlook, Zoom)":
    "integrate all CRM data with sales tools (Gmail, Outlook, Zoom)",
  "créer des visuels pour les publications Instagram, TikTok et Facebook en quelques minutes":
    "create visuals for Instagram, TikTok and Facebook posts in minutes",
  "concevoir des supports marketing (flyers, bannières, présentations) sans designer":
    "design marketing materials (flyers, banners, presentations) without a designer",
  "générer des images IA pour illustrer des contenus marketing ou des articles de blog":
    "generate AI images to illustrate marketing content or blog articles",
  "analyser le trafic d'un site web et identifier les sources d'acquisition les plus performantes":
    "analyze website traffic and identify the best-performing acquisition sources",
  "suivre les événements e-commerce (vues produit, ajouts panier, transactions) en temps réel":
    "track e-commerce events (product views, cart additions, transactions) in real time",
  "construire des workflows d'automatisation complexes entre outils SaaS via des nœuds visuels":
    "build complex automation workflows between SaaS tools via visual nodes",
  "déployer et héberger des automations en self-hosted pour garder le contrôle des données":
    "deploy and host automations self-hosted to maintain data control",
  "automatiser des flows email e-commerce (abandon panier, post-achat, winback, browse abandonment)":
    "automate e-commerce email flows (cart abandonment, post-purchase, winback, browse abandonment)",
  "segmenter les clients selon leur comportement d'achat, LTV et engagement pour des campagnes ciblées":
    "segment customers by purchase behavior, LTV and engagement for targeted campaigns",
  "créer des visuels de branding et d'identité visuelle originaux et artistiques":
    "create original and artistic branding and visual identity visuals",
  "générer des mises en scène de produits réalistes ou créatives pour le marketing":
    "generate realistic or creative product staging for marketing",
  "générer des fonctionnalités complètes en quelques secondes depuis une description en langage naturel":
    "generate complete features in seconds from a natural language description",
  "déboguer du code complexe en demandant à l'IA d'expliquer et corriger les erreurs":
    "debug complex code by asking the AI to explain and fix errors",
  "enrichir automatiquement des listes de prospects avec des données provenant de 75+ sources":
    "automatically enrich prospect lists with data from 75+ sources",
  "personnaliser des messages d'outreach à grande échelle avec des variables dynamiques IA":
    "personalize outreach messages at scale with AI dynamic variables",
  "automatiser la gestion de boîte mail avec un agent IA qui lit, trie et répond aux emails":
    "automate inbox management with an AI agent that reads, sorts and replies to emails",
  "créer un assistant IA personnel qui gère les prises de rendez-vous et le calendrier":
    "create a personal AI assistant that manages appointments and calendar",
  "synchroniser et mettre à jour automatiquement des données CRM depuis les emails":
    "automatically sync and update CRM data from emails",
  "construire des agents IA sans code pour des tâches récurrentes (reporting, onboarding client)":
    "build no-code AI agents for recurring tasks (reporting, client onboarding)",
  "déléguer des recherches, résumés et tâches administratives à un agent conversationnel":
    "delegate research, summaries and administrative tasks to a conversational agent",

  // ── best_for ───────────────────────────────────────────────────────────────
  "équipes marketing et commerciales cherchant à automatiser leur prospection LinkedIn":
    "marketing and sales teams looking to automate their LinkedIn prospecting",
  "solopreneurs et freelances cherchant à produire du contenu de qualité rapidement":
    "solopreneurs and freelancers looking to produce quality content quickly",
  "développeurs cherchant à accélérer leur workflow de développement":
    "developers looking to accelerate their development workflow",
  "équipes e-commerce cherchant à automatiser leur marketing email et SMS":
    "e-commerce teams looking to automate their email and SMS marketing",
  "agences SEO gérant plusieurs clients":
    "SEO agencies managing multiple clients",
  "équipes commerciales B2B cherchant à automatiser leur prospection":
    "B2B sales teams looking to automate their prospecting",
  "PME cherchant un CRM gratuit et puissant":
    "SMBs looking for a free and powerful CRM",
  "non-designers cherchant à créer des visuels professionnels rapidement":
    "non-designers looking to create professional visuals quickly",
  "développeurs et data scientists cherchant à automatiser des workflows complexes":
    "developers and data scientists looking to automate complex workflows",
  "équipes techniques cherchant une alternative open-source à Zapier":
    "technical teams looking for an open-source alternative to Zapier",
  "marketeurs cherchant à optimiser leurs campagnes email e-commerce":
    "marketers looking to optimize their e-commerce email campaigns",
  "artistes et créatifs cherchant à générer des images IA de haute qualité":
    "artists and creatives looking to generate high-quality AI images",
  "développeurs cherchant un assistant IA puissant pour le code":
    "developers looking for a powerful AI coding assistant",
  "équipes cherchant à analyser leurs données web et optimiser leurs conversions":
    "teams looking to analyze their web data and optimize conversions",
  "executives et entrepreneurs cherchant un chief of staff IA personnel":
    "executives and entrepreneurs looking for a personal AI chief of staff",
  "équipes sales automatisant le suivi CRM et la gestion des relances":
    "sales teams automating CRM follow-up and outreach management",
  "PME cherchant une automatisation IA accessible sans compétences techniques":
    "SMBs looking for accessible AI automation without technical skills",

  // ── not_for ────────────────────────────────────────────────────────────────
  "utilisateurs non techniques cherchant une solution clé en main":
    "non-technical users looking for a turnkey solution",
  "équipes cherchant une solution hébergée sans maintenance":
    "teams looking for a hosted solution without maintenance",
  "petites équipes avec un budget limité":
    "small teams with a limited budget",
  "utilisateurs cherchant une interface simple sans configuration":
    "users looking for a simple interface without configuration",
  "entreprises cherchant une solution enterprise avec support dédié":
    "companies looking for an enterprise solution with dedicated support",

  // ── Short tags / common phrases ────────────────────────────────────────────
  "chercheurs": "researchers",
  "analystes": "analysts",
  "journalistes": "journalists",
  "consultants": "consultants",
  "étudiants": "students",
  "création de contenu": "content creation",
  "design": "design",
  "automatisation": "automation",
  "sites web": "websites",
  "community managers": "community managers",
  "marketeurs sociaux": "social media marketers",
  "agences": "agencies",
  "créateurs de contenu": "content creators",
  "e-commerce": "e-commerce",
  "CRM": "CRM",
  "prospection": "prospecting",
  "équipes sales": "sales teams",
  "growth hackers": "growth hackers",
  "prospecteurs B2B": "B2B prospectors",
  "contenu créatif": "creative content",
  "SEO": "SEO",
  "rédacteurs": "writers",
  "développeurs": "developers",
  "création de sites web": "website creation",
  "design graphique": "graphic design",
  "montage vidéo": "video editing",
  "génération d'images": "image generation",
  "usage intensif": "high-volume usage",
  "équipes techniques": "technical teams",
  "1 jour": "1 day",
  "1 semaine": "1 week",
  "2 semaines": "2 weeks",
  "1 mois": "1 month",
  "Facile": "Easy",
  "Moyen": "Medium",
  "Difficile": "Hard",
  "tous": "all",
  "marketeurs": "marketers",
  "équipes marketing": "marketing teams",
  "PME": "SMBs",
  "grandes entreprises": "large enterprises",
  "startups": "startups",
  "freelances": "freelancers",
  "solopreneurs": "solopreneurs",
  "équipes RH": "HR teams",
  "équipes commerciales": "sales teams",
  "équipes support": "support teams",
  "non-développeurs": "non-developers",
  "utilisateurs non techniques": "non-technical users",
  "petites équipes": "small teams",
  "grandes équipes": "large teams",
  "entreprises B2B": "B2B companies",
  "entreprises B2C": "B2C companies",
  "e-commerçants": "e-commerce merchants",
  "influenceurs": "influencers",
  "créateurs": "creators",
  "fondateurs": "founders",
  "dirigeants": "executives",
  "managers": "managers",
  "commerciaux": "salespeople",
  "recruteurs": "recruiters",
  "formateurs": "trainers",
  "enseignants": "teachers",
  "médecins": "doctors",
  "avocats": "lawyers",
  "comptables": "accountants",
  "ingénieurs": "engineers",
  "designers": "designers",
  "photographes": "photographers",
  "vidéastes": "videographers",
  "podcasters": "podcasters",
  "blogueurs": "bloggers",
  "rédaction": "writing",
  "analyse": "analysis",
  "recherche": "research",
  "automatisation des emails": "email automation",
  "gestion de projet": "project management",
  "service client": "customer service",
  "génération de leads": "lead generation",
  "optimisation SEO": "SEO optimization",
  "création d'images": "image creation",
  "création de vidéos": "video creation",
  "analyse de données": "data analysis",
  "intégration d'outils": "tool integration",
  "personnalisation": "personalization",
  "segmentation": "segmentation",
  "reporting": "reporting",
  "tableau de bord": "dashboard",
  "collaboration": "collaboration",
  "gestion des tâches": "task management",
  "planification": "scheduling",
  "publication": "publishing",
  "suivi": "tracking",
  "optimisation": "optimization",
  "formation": "training",
  "onboarding": "onboarding",
  "support": "support",
  "vente": "sales",
  "marketing": "marketing",
  "finance": "finance",
  "juridique": "legal",
  "ressources humaines": "human resources",
  "opérations": "operations",
  "produit": "product",
  "technique": "technical",
  "créatif": "creative",
  "stratégique": "strategic",
  // Additional common phrases
  "non-designers": "non-designers",
  "équipes e-commerce": "e-commerce teams",
  "agences SEO": "SEO agencies",
  "équipes commerciales B2B": "B2B sales teams",
  "artistes et créatifs": "artists and creatives",
  "executives et entrepreneurs": "executives and entrepreneurs",
  "équipes sales et marketing": "sales and marketing teams",
  "data scientists": "data scientists",
  "growth marketers": "growth marketers",
  "content marketers": "content marketers",
  "product managers": "product managers",
  "chefs de projet": "project managers",
  "responsables marketing": "marketing managers",
  "directeurs commerciaux": "sales directors",
  "entrepreneurs": "entrepreneurs",
  "agences digitales": "digital agencies",
  "agences marketing": "marketing agencies",
  "équipes produit": "product teams",
  "équipes data": "data teams",
  "équipes design": "design teams",
  "équipes contenu": "content teams",
  "équipes SEO": "SEO teams",
  "équipes growth": "growth teams",
  "équipes ops": "ops teams",
  "équipes IT": "IT teams",
  "équipes finance": "finance teams",
  "équipes juridiques": "legal teams",
  "équipes RH": "HR teams",
  "équipes service client": "customer service teams",
  "équipes support client": "customer support teams",
  "équipes vente": "sales teams",
  "équipes acquisition": "acquisition teams",
  "équipes fidélisation": "retention teams",
  "équipes CRM": "CRM teams",
  "équipes automation": "automation teams",
  "équipes analytics": "analytics teams",
  "équipes BI": "BI teams",
  "équipes performance": "performance teams",
  "équipes créatives": "creative teams",
  "équipes éditoriales": "editorial teams",
  "équipes communication": "communication teams",
  "équipes relations publiques": "PR teams",
  "équipes partenariats": "partnership teams",
  "équipes internationales": "international teams",
  "équipes globales": "global teams",
  "équipes distribuées": "distributed teams",
  "équipes remote": "remote teams",
  "équipes hybrides": "hybrid teams",
  "petites et moyennes entreprises": "small and medium businesses",
  "grandes entreprises et ETI": "large enterprises and mid-market",
  "startups en croissance": "growing startups",
  "scale-ups": "scale-ups",
  "indépendants": "independents",
  "consultants indépendants": "independent consultants",
  "agences de communication": "communication agencies",
  "agences de publicité": "advertising agencies",
  "agences de relations publiques": "PR agencies",
  "agences de recrutement": "recruitment agencies",
  "cabinets de conseil": "consulting firms",
  "cabinets d'avocats": "law firms",
  "cabinets comptables": "accounting firms",
  "cliniques et hôpitaux": "clinics and hospitals",
  "établissements d'enseignement": "educational institutions",
  "organisations à but non lucratif": "non-profit organizations",
  "administrations publiques": "public administrations",
  "collectivités territoriales": "local authorities",
}


// ---------------------------------------------------------------------------
// Word-level fallback map for partial translations
// ---------------------------------------------------------------------------

export const WORD_MAP = {
  "avec": "with",
  "pour": "for",
  "les": "the",
  "des": "of",
  "une": "a",
  "est": "is",
  "dans": "in",
  "sur": "on",
  "plus": "more",
  "très": "very",
  "aussi": "also",
  "mais": "but",
  "donc": "so",
  "leur": "their",
  "leurs": "their",
  "nous": "we",
  "vous": "you",
  "ils": "they",
  "elles": "they",
  "cherchant": "looking for",
  "cherchant à": "looking to",
  "équipes": "teams",
  "équipe": "team",
  "outil": "tool",
  "outils": "tools",
  "plateforme": "platform",
  "plateformes": "platforms",
  "solution": "solution",
  "solutions": "solutions",
  "logiciel": "software",
  "logiciels": "software",
  "application": "application",
  "applications": "applications",
  "service": "service",
  "services": "services",
  "assistant": "assistant",
  "assistants": "assistants",
  "agent": "agent",
  "agents": "agents",
  "modèle": "model",
  "modèles": "models",
  "générateur": "generator",
  "générateurs": "generators",
  "créateur": "creator",
  "créateurs": "creators",
  "éditeur": "editor",
  "éditeurs": "editors",
  "gestionnaire": "manager",
  "gestionnaires": "managers",
  "analyseur": "analyzer",
  "analyseurs": "analyzers",
  "optimiseur": "optimizer",
  "optimiseurs": "optimizers",
  "automatiseur": "automator",
  "automatiseurs": "automators",
  "intégrateur": "integrator",
  "intégrateurs": "integrators",
  "connecteur": "connector",
  "connecteurs": "connectors",
  "moteur": "engine",
  "moteurs": "engines",
  "système": "system",
  "systèmes": "systems",
  "réseau": "network",
  "réseaux": "networks",
  "base": "base",
  "bases": "bases",
  "données": "data",
  "contenu": "content",
  "contenus": "content",
  "texte": "text",
  "textes": "texts",
  "image": "image",
  "images": "images",
  "vidéo": "video",
  "vidéos": "videos",
  "audio": "audio",
  "code": "code",
  "codes": "codes",
  "script": "script",
  "scripts": "scripts",
  "rapport": "report",
  "rapports": "reports",
  "tableau": "table",
  "tableaux": "tables",
  "graphique": "chart",
  "graphiques": "charts",
  "présentation": "presentation",
  "présentations": "presentations",
  "document": "document",
  "documents": "documents",
  "fichier": "file",
  "fichiers": "files",
  "dossier": "folder",
  "dossiers": "folders",
  "projet": "project",
  "projets": "projects",
  "tâche": "task",
  "tâches": "tasks",
  "workflow": "workflow",
  "workflows": "workflows",
  "processus": "process",
  "pipeline": "pipeline",
  "pipelines": "pipelines",
  "campagne": "campaign",
  "campagnes": "campaigns",
  "stratégie": "strategy",
  "stratégies": "strategies",
  "objectif": "goal",
  "objectifs": "goals",
  "résultat": "result",
  "résultats": "results",
  "performance": "performance",
  "performances": "performances",
  "analyse": "analysis",
  "analyses": "analyses",
  "rapport": "report",
  "rapports": "reports",
  "statistique": "statistic",
  "statistiques": "statistics",
  "métrique": "metric",
  "métriques": "metrics",
  "indicateur": "indicator",
  "indicateurs": "indicators",
  "tableau de bord": "dashboard",
  "tableaux de bord": "dashboards",
  "interface": "interface",
  "interfaces": "interfaces",
  "fonctionnalité": "feature",
  "fonctionnalités": "features",
  "intégration": "integration",
  "intégrations": "integrations",
  "connexion": "connection",
  "connexions": "connections",
  "synchronisation": "synchronization",
  "synchronisations": "synchronizations",
  "automatisation": "automation",
  "automatisations": "automations",
  "personnalisation": "personalization",
  "personnalisations": "personalizations",
  "segmentation": "segmentation",
  "segmentations": "segmentations",
  "optimisation": "optimization",
  "optimisations": "optimizations",
  "génération": "generation",
  "générations": "generations",
  "création": "creation",
  "créations": "creations",
  "rédaction": "writing",
  "rédactions": "writings",
  "traduction": "translation",
  "traductions": "translations",
  "transcription": "transcription",
  "transcriptions": "transcriptions",
  "résumé": "summary",
  "résumés": "summaries",
  "extraction": "extraction",
  "extractions": "extractions",
  "classification": "classification",
  "classifications": "classifications",
  "détection": "detection",
  "détections": "detections",
  "reconnaissance": "recognition",
  "reconnaissances": "recognitions",
  "prédiction": "prediction",
  "prédictions": "predictions",
  "recommandation": "recommendation",
  "recommandations": "recommendations",
  "suggestion": "suggestion",
  "suggestions": "suggestions",
  "correction": "correction",
  "corrections": "corrections",
  "amélioration": "improvement",
  "améliorations": "improvements",
  "enrichissement": "enrichment",
  "enrichissements": "enrichments",
  "nettoyage": "cleanup",
  "nettoyages": "cleanups",
  "validation": "validation",
  "validations": "validations",
  "vérification": "verification",
  "vérifications": "verifications",
  "test": "test",
  "tests": "tests",
  "débogage": "debugging",
  "déploiement": "deployment",
  "déploiements": "deployments",
  "hébergement": "hosting",
  "hébergements": "hostings",
  "migration": "migration",
  "migrations": "migrations",
  "sauvegarde": "backup",
  "sauvegardes": "backups",
  "sécurité": "security",
  "confidentialité": "privacy",
  "conformité": "compliance",
  "accessibilité": "accessibility",
  "performance": "performance",
  "scalabilité": "scalability",
  "fiabilité": "reliability",
  "disponibilité": "availability",
  "maintenance": "maintenance",
  "support": "support",
  "formation": "training",
  "onboarding": "onboarding",
  "documentation": "documentation",
  "tutoriel": "tutorial",
  "tutoriels": "tutorials",
  "guide": "guide",
  "guides": "guides",
  "aide": "help",
  "assistance": "assistance",
  "conseil": "advice",
  "conseils": "advice",
  "recommandation": "recommendation",
  "recommandations": "recommendations",
  "meilleure pratique": "best practice",
  "meilleures pratiques": "best practices",
  "cas d'usage": "use case",
  "cas d'usages": "use cases",
  "exemple": "example",
  "exemples": "examples",
  "modèle": "template",
  "modèles": "templates",
  "template": "template",
  "templates": "templates",
  "prompt": "prompt",
  "prompts": "prompts",
  "requête": "query",
  "requêtes": "queries",
  "réponse": "response",
  "réponses": "responses",
  "message": "message",
  "messages": "messages",
  "email": "email",
  "emails": "emails",
  "SMS": "SMS",
  "notification": "notification",
  "notifications": "notifications",
  "alerte": "alert",
  "alertes": "alerts",
  "rapport": "report",
  "rapports": "reports",
  "newsletter": "newsletter",
  "newsletters": "newsletters",
  "blog": "blog",
  "blogs": "blogs",
  "article": "article",
  "articles": "articles",
  "post": "post",
  "posts": "posts",
  "publication": "publication",
  "publications": "publications",
  "commentaire": "comment",
  "commentaires": "comments",
  "avis": "review",
  "note": "note",
  "notes": "notes",
  "évaluation": "evaluation",
  "évaluations": "evaluations",
  "score": "score",
  "scores": "scores",
  "classement": "ranking",
  "classements": "rankings",
  "position": "position",
  "positions": "positions",
  "rang": "rank",
  "rangs": "ranks",
  "trafic": "traffic",
  "visiteur": "visitor",
  "visiteurs": "visitors",
  "utilisateur": "user",
  "utilisateurs": "users",
  "client": "customer",
  "clients": "customers",
  "prospect": "prospect",
  "prospects": "prospects",
  "lead": "lead",
  "leads": "leads",
  "contact": "contact",
  "contacts": "contacts",
  "abonné": "subscriber",
  "abonnés": "subscribers",
  "membre": "member",
  "membres": "members",
  "partenaire": "partner",
  "partenaires": "partners",
  "fournisseur": "supplier",
  "fournisseurs": "suppliers",
  "concurrent": "competitor",
  "concurrents": "competitors",
  "marché": "market",
  "marchés": "markets",
  "secteur": "sector",
  "secteurs": "sectors",
  "industrie": "industry",
  "industries": "industries",
  "niche": "niche",
  "niches": "niches",
  "segment": "segment",
  "segments": "segments",
  "audience": "audience",
  "audiences": "audiences",
  "cible": "target",
  "cibles": "targets",
  "persona": "persona",
  "personas": "personas",
  "profil": "profile",
  "profils": "profiles",
  "compte": "account",
  "comptes": "accounts",
  "entreprise": "company",
  "entreprises": "companies",
  "organisation": "organization",
  "organisations": "organizations",
  "équipe": "team",
  "équipes": "teams",
  "département": "department",
  "départements": "departments",
  "service": "department",
  "services": "departments",
  "division": "division",
  "divisions": "divisions",
  "filiale": "subsidiary",
  "filiales": "subsidiaries",
  "groupe": "group",
  "groupes": "groups",
  "réseau": "network",
  "réseaux": "networks",
  "communauté": "community",
  "communautés": "communities",
  "forum": "forum",
  "forums": "forums",
  "groupe de discussion": "discussion group",
  "groupes de discussion": "discussion groups",
  "canal": "channel",
  "canaux": "channels",
  "plateforme": "platform",
  "plateformes": "platforms",
  "marketplace": "marketplace",
  "marketplaces": "marketplaces",
  "boutique": "store",
  "boutiques": "stores",
  "magasin": "store",
  "magasins": "stores",
  "site web": "website",
  "sites web": "websites",
  "application web": "web application",
  "applications web": "web applications",
  "application mobile": "mobile application",
  "applications mobiles": "mobile applications",
  "extension": "extension",
  "extensions": "extensions",
  "plugin": "plugin",
  "plugins": "plugins",
  "add-on": "add-on",
  "add-ons": "add-ons",
  "API": "API",
  "APIs": "APIs",
  "webhook": "webhook",
  "webhooks": "webhooks",
  "SDK": "SDK",
  "SDKs": "SDKs",
  "bibliothèque": "library",
  "bibliothèques": "libraries",
  "framework": "framework",
  "frameworks": "frameworks",
  "infrastructure": "infrastructure",
  "cloud": "cloud",
  "serveur": "server",
  "serveurs": "servers",
  "base de données": "database",
  "bases de données": "databases",
  "stockage": "storage",
  "stockages": "storages",
  "cache": "cache",
  "caches": "caches",
  "index": "index",
  "indexes": "indexes",
  "vecteur": "vector",
  "vecteurs": "vectors",
  "embedding": "embedding",
  "embeddings": "embeddings",
  "modèle de langage": "language model",
  "modèles de langage": "language models",
  "grand modèle de langage": "large language model",
  "grands modèles de langage": "large language models",
  "intelligence artificielle": "artificial intelligence",
  "apprentissage automatique": "machine learning",
  "apprentissage profond": "deep learning",
  "réseau de neurones": "neural network",
  "réseaux de neurones": "neural networks",
  "traitement du langage naturel": "natural language processing",
  "vision par ordinateur": "computer vision",
  "génération augmentée par récupération": "retrieval-augmented generation",
  "agent IA": "AI agent",
  "agents IA": "AI agents",
  "chatbot": "chatbot",
  "chatbots": "chatbots",
  "assistant virtuel": "virtual assistant",
  "assistants virtuels": "virtual assistants",
  "copilote": "copilot",
  "copilotes": "copilots",
  "automatisation robotisée des processus": "robotic process automation",
  "flux de travail": "workflow",
  "flux de travaux": "workflows",
  "orchestration": "orchestration",
  "orchestrations": "orchestrations",
  "chaîne": "chain",
  "chaînes": "chains",
  "nœud": "node",
  "nœuds": "nodes",
  "déclencheur": "trigger",
  "déclencheurs": "triggers",
  "action": "action",
  "actions": "actions",
  "condition": "condition",
  "conditions": "conditions",
  "filtre": "filter",
  "filtres": "filters",
  "transformation": "transformation",
  "transformations": "transformations",
  "mappage": "mapping",
  "mappages": "mappings",
  "routage": "routing",
  "routages": "routings",
  "boucle": "loop",
  "boucles": "loops",
  "itération": "iteration",
  "itérations": "iterations",
  "récursion": "recursion",
  "récursions": "recursions",
  "parallélisme": "parallelism",
  "concurrence": "concurrency",
  "asynchrone": "asynchronous",
  "synchrone": "synchronous",
  "temps réel": "real-time",
  "en temps réel": "in real time",
  "en direct": "live",
  "en ligne": "online",
  "hors ligne": "offline",
  "local": "local",
  "distant": "remote",
  "hébergé": "hosted",
  "auto-hébergé": "self-hosted",
  "open source": "open source",
  "propriétaire": "proprietary",
  "gratuit": "free",
  "payant": "paid",
  "freemium": "freemium",
  "abonnement": "subscription",
  "abonnements": "subscriptions",
  "licence": "license",
  "licences": "licenses",
  "essai gratuit": "free trial",
  "essais gratuits": "free trials",
  "plan gratuit": "free plan",
  "plans gratuits": "free plans",
  "plan payant": "paid plan",
  "plans payants": "paid plans",
  "plan entreprise": "enterprise plan",
  "plans entreprise": "enterprise plans",
  "tarification": "pricing",
  "tarifications": "pricings",
  "prix": "price",
  "coût": "cost",
  "coûts": "costs",
  "budget": "budget",
  "budgets": "budgets",
  "retour sur investissement": "return on investment",
  "ROI": "ROI",
  "valeur": "value",
  "valeurs": "values",
  "bénéfice": "benefit",
  "bénéfices": "benefits",
  "avantage": "advantage",
  "avantages": "advantages",
  "inconvénient": "disadvantage",
  "inconvénients": "disadvantages",
  "limitation": "limitation",
  "limitations": "limitations",
  "contrainte": "constraint",
  "contraintes": "constraints",
  "prérequis": "prerequisite",
  "prérequis": "prerequisites",
  "dépendance": "dependency",
  "dépendances": "dependencies",
  "compatibilité": "compatibility",
  "compatibilités": "compatibilities",
  "interopérabilité": "interoperability",
  "interopérabilités": "interoperabilities",
  "standard": "standard",
  "standards": "standards",
  "protocole": "protocol",
  "protocoles": "protocols",
  "format": "format",
  "formats": "formats",
  "structure": "structure",
  "structures": "structures",
  "schéma": "schema",
  "schémas": "schemas",
  "modèle de données": "data model",
  "modèles de données": "data models",
  "entité": "entity",
  "entités": "entities",
  "attribut": "attribute",
  "attributs": "attributes",
  "relation": "relation",
  "relations": "relations",
  "association": "association",
  "associations": "associations",
  "lien": "link",
  "liens": "links",
  "référence": "reference",
  "références": "references",
  "identifiant": "identifier",
  "identifiants": "identifiers",
  "clé": "key",
  "clés": "keys",
  "valeur": "value",
  "valeurs": "values",
  "champ": "field",
  "champs": "fields",
  "colonne": "column",
  "colonnes": "columns",
  "ligne": "row",
  "lignes": "rows",
  "enregistrement": "record",
  "enregistrements": "records",
  "entrée": "entry",
  "entrées": "entries",
  "sortie": "output",
  "sorties": "outputs",
  "résultat": "result",
  "résultats": "results",
  "réponse": "response",
  "réponses": "responses",
  "erreur": "error",
  "erreurs": "errors",
  "avertissement": "warning",
  "avertissements": "warnings",
  "information": "information",
  "informations": "information",
  "log": "log",
  "logs": "logs",
  "journal": "log",
  "journaux": "logs",
  "trace": "trace",
  "traces": "traces",
  "débogage": "debugging",
  "profilage": "profiling",
  "surveillance": "monitoring",
  "observabilité": "observability",
  "métriques": "metrics",
  "alertes": "alerts",
  "tableau de bord": "dashboard",
  "tableaux de bord": "dashboards",
  "rapport": "report",
  "rapports": "reports",
  "visualisation": "visualization",
  "visualisations": "visualizations",
  "graphique": "chart",
  "graphiques": "charts",
  "diagramme": "diagram",
  "diagrammes": "diagrams",
  "carte": "map",
  "cartes": "maps",
  "heatmap": "heatmap",
  "heatmaps": "heatmaps",
  "entonnoir": "funnel",
  "entonnoirs": "funnels",
  "cohorte": "cohort",
  "cohortes": "cohorts",
  "segment": "segment",
  "segments": "segments",
  "filtre": "filter",
  "filtres": "filters",
  "dimension": "dimension",
  "dimensions": "dimensions",
  "mesure": "measure",
  "mesures": "measures",
  "agrégation": "aggregation",
  "agrégations": "aggregations",
  "calcul": "calculation",
  "calculs": "calculations",
  "formule": "formula",
  "formules": "formulas",
  "requête": "query",
  "requêtes": "queries",
  "SQL": "SQL",
  "NoSQL": "NoSQL",
  "JSON": "JSON",
  "CSV": "CSV",
  "XML": "XML",
  "YAML": "YAML",
  "Markdown": "Markdown",
  "HTML": "HTML",
  "CSS": "CSS",
  "JavaScript": "JavaScript",
  "TypeScript": "TypeScript",
  "Python": "Python",
  "Ruby": "Ruby",
  "PHP": "PHP",
  "Java": "Java",
  "Go": "Go",
  "Rust": "Rust",
  "Swift": "Swift",
  "Kotlin": "Kotlin",
  "React": "React",
  "Vue": "Vue",
  "Angular": "Angular",
  "Node.js": "Node.js",
  "Next.js": "Next.js",
  "Nuxt.js": "Nuxt.js",
  "Django": "Django",
  "Flask": "Flask",
  "FastAPI": "FastAPI",
  "Spring": "Spring",
  "Laravel": "Laravel",
  "Rails": "Rails",
  "Express": "Express",
  "GraphQL": "GraphQL",
  "REST": "REST",
  "gRPC": "gRPC",
  "WebSocket": "WebSocket",
  "OAuth": "OAuth",
  "JWT": "JWT",
  "SAML": "SAML",
  "SSO": "SSO",
  "MFA": "MFA",
  "2FA": "2FA",
  "GDPR": "GDPR",
  "RGPD": "GDPR",
  "CCPA": "CCPA",
  "SOC 2": "SOC 2",
  "ISO 27001": "ISO 27001",
  "HIPAA": "HIPAA",
  "PCI DSS": "PCI DSS",
}


// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

/**
 * Stronger French detection: requires accented characters OR unambiguous
 * French verbs/words. Avoids false positives on English text.
 */
export function isFrenchStrong(text) {
  if (!text || typeof text !== 'string') return false
  // Accented characters are a very strong signal
  if (/[\u00C0-\u024F]/i.test(text)) return true
  // Unambiguous French verbs and words (not found in English)
  const strongWords = /\b(avec|pour|dans|sur|par|très|aussi|mais|donc|car|leurs|nous|vous|ils|elles|est|sont|était|avait|sera|serait|avoir|être|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir|falloir|prendre|mettre|donner|trouver|chercher|utiliser|créer|générer|analyser|automatiser|optimiser|améliorer|développer|construire|déployer|héberger|synchroniser|personnaliser|segmenter|enrichir|produire|intégrer|concevoir|réaliser|suivre|gérer|centraliser|déléguer|déboguer|refactorer|accélérer|expérimenter|brainstormer|rédiger|traduire|adapter|affiner)\b/i
  return strongWords.test(text)
}

/**
 * Translate a single string using the TRANSLATIONS map first,
 * then fall back to word-by-word replacement using WORD_MAP.
 * Word-by-word fallback only applies to strings with strong French signals
 * to avoid corrupting English text.
 */
export function translateField(value) {
  if (!value || typeof value !== 'string') return value

  // Exact match first
  if (TRANSLATIONS[value] !== undefined) return TRANSLATIONS[value]

  // Word-by-word fallback: only apply if the string has strong French signals
  if (!isFrenchStrong(value)) return value

  let result = value
  // Sort by length descending so longer phrases match before shorter words
  const sortedEntries = Object.entries(WORD_MAP).sort((a, b) => b[0].length - a[0].length)
  for (const [fr, en] of sortedEntries) {
    // Escape special regex chars in the French phrase
    const escaped = fr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const re = new RegExp('(?<![\\w\\u00C0-\\u024F])' + escaped + '(?![\\w\\u00C0-\\u024F])', 'gi')
    result = result.replace(re, en)
  }
  return result
}

/**
 * Translate an array of strings.
 */
export function translateArray(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => {
    if (!item || typeof item !== 'string') return item
    const translated = translateField(item)
    return translated && translated.length > 0 ? translated : item
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🌐 Running COMPREHENSIVE translation in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, description, use_cases, best_for, not_for')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  console.log(`Loaded ${agents.length} agents from database.\n`)

  let totalRowsUpdated = 0
  let totalFieldsTranslated = 0
  let hasErrors = false

  const BATCH_SIZE = 20
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE)

    for (const agent of batch) {
      const updatedFields = []
      const updates = {}

      // Check description
      if (isFrench(agent.description)) {
        const translated = translateField(agent.description)
        if (translated !== agent.description) {
          updates.description = translated
          updatedFields.push('description')
        }
      }

      // Check use_cases array
      if (Array.isArray(agent.use_cases)) {
        const hasFrench = agent.use_cases.some(v => isFrench(v))
        if (hasFrench) {
          const translated = translateArray(agent.use_cases)
          if (JSON.stringify(translated) !== JSON.stringify(agent.use_cases)) {
            updates.use_cases = translated
            updatedFields.push('use_cases')
          }
        }
      }

      // Check best_for array
      if (Array.isArray(agent.best_for)) {
        const hasFrench = agent.best_for.some(v => isFrench(v))
        if (hasFrench) {
          const translated = translateArray(agent.best_for)
          if (JSON.stringify(translated) !== JSON.stringify(agent.best_for)) {
            updates.best_for = translated
            updatedFields.push('best_for')
          }
        }
      }

      // Check not_for array
      if (Array.isArray(agent.not_for)) {
        const hasFrench = agent.not_for.some(v => isFrench(v))
        if (hasFrench) {
          const translated = translateArray(agent.not_for)
          if (JSON.stringify(translated) !== JSON.stringify(agent.not_for)) {
            updates.not_for = translated
            updatedFields.push('not_for')
          }
        }
      }

      if (updatedFields.length === 0) continue

      console.log(
        `${PREFIX} UPDATE id=${agent.id} name="${agent.name}" fields=[${updatedFields.join(', ')}]`
      )

      // Show what would change in dry-run
      if (DRY_RUN) {
        for (const field of updatedFields) {
          const original = agent[field]
          const translated = updates[field]
          if (typeof original === 'string') {
            console.log(`  ${field}: "${original}" → "${translated}"`)
          } else if (Array.isArray(original)) {
            const changed = original.filter((v, idx) => v !== translated[idx])
            if (changed.length > 0) {
              console.log(`  ${field} (${changed.length} items changed):`)
              original.forEach((v, idx) => {
                if (v !== translated[idx]) {
                  console.log(`    "${v}" → "${translated[idx]}"`)
                }
              })
            }
          }
        }
      }

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('agents')
          .update(updates)
          .eq('id', agent.id)

        if (error) {
          console.error(`ERROR: Failed to update "${agent.name}": ${error.message}`)
          hasErrors = true
        } else {
          totalRowsUpdated++
          totalFieldsTranslated += updatedFields.length
        }
      } else {
        totalRowsUpdated++
        totalFieldsTranslated += updatedFields.length
      }
    }

    // Rate limit protection
    if (!DRY_RUN && i + BATCH_SIZE < agents.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(
    `\n✅ Translation complete: ${totalRowsUpdated} agent rows ${DRY_RUN ? 'would be updated' : 'updated'}, ${totalFieldsTranslated} fields translated`
  )
  if (DRY_RUN) {
    console.log('   Run with --apply to commit changes.')
  }

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
