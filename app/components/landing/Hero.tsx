'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getLogoUrl } from '@/lib/utils/logo'

const TOOLS = [
    { name: 'Claude', domain: 'claude.ai', color: '#FF6B35' },
    { name: 'Make', domain: 'make.com', color: '#6B4FFF' },
    { name: 'Midjourney', domain: 'midjourney.com', color: '#000' },
    { name: 'Notion', domain: 'notion.so', color: '#000' },
    { name: 'Shopify', domain: 'shopify.com', color: '#96BF48' },
    { name: 'HubSpot', domain: 'hubspot.com', color: '#FF7A59' },
    { name: 'Taplio', domain: 'taplio.com', color: '#4F8EF7' },
    { name: 'Perplexity', domain: 'perplexity.ai', color: '#20B8CD' },
    { name: 'Jasper', domain: 'jasper.ai', color: '#6B4FFF' },
    { name: 'Copy.ai', domain: 'copy.ai', color: '#20B8CD' },
    { name: 'Synthesia', domain: 'synthesia.io', color: '#FF6B35' },
    { name: 'ElevenLabs', domain: 'elevenlabs.io', color: '#000' },
    { name: 'Klaviyo', domain: 'klaviyo.com', color: '#20B8CD' },
    { name: 'Zapier', domain: 'zapier.com', color: '#FF6B35' },
    { name: 'Gorgias', domain: 'gorgias.com', color: '#4F8EF7' },
    { name: 'Tidio', domain: 'tidio.com', color: '#4F8EF7' },
    { name: 'Figma', domain: 'figma.com', color: '#FF6B35' },
    { name: 'Vercel', domain: 'vercel.com', color: '#000' },
    { name: 'Supabase', domain: 'supabase.com', color: '#3ECF8E' },
    { name: 'Stripe', domain: 'stripe.com', color: '#6B4FFF' },
    { name: 'OpenAI', domain: 'openai.com', color: '#10A37F' },
    { name: 'Mistral', domain: 'mistral.ai', color: '#FF6B35' },
    { name: 'Groq', domain: 'groq.com', color: '#FF6B35' },
    { name: 'Gumroad', domain: 'gumroad.com', color: '#000' },
    { name: 'Manychat', domain: 'manychat.com', color: '#4F8EF7' },
    { name: 'Minea', domain: 'minea.com', color: '#6B4FFF' },
    { name: 'Zendrop', domain: 'zendrop.com', color: '#6B4FFF' },
    { name: 'DSers', domain: 'dsers.com', color: '#FF6B35' },
    { name: 'Triple Whale', domain: 'triplewhale.com', color: '#20B8CD' },
    { name: 'Canva', domain: 'canva.com', color: '#4F8EF7' },
    { name: 'CapCut', domain: 'capcut.com', color: '#000' },
    { name: 'Mailchimp', domain: 'mailchimp.com', color: '#FFE01B' },
    { name: 'Airtable', domain: 'airtable.com', color: '#FF6B35' },
    { name: 'Linear', domain: 'linear.app', color: '#5E6AD2' },
    { name: 'Intercom', domain: 'intercom.com', color: '#4F8EF7' },
]

const WORDS = ['Shopify', 'LinkedIn', 'Prospection', 'YouTube', 'SAV', 'SEO', 'SaaS']

function RawLogo({ tool }: { tool: typeof TOOLS[0] }) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <div className="w-16 h-16 flex items-center justify-center shrink-0 opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-default">
            {!imgErr ? (
                <img
                    src={getLogoUrl(tool.domain)}
                    alt={tool.name}
                    className="w-12 h-12 object-contain"
                    onError={() => setImgErr(true)}
                />
            ) : (
                <span className="text-3xl font-black" style={{ color: tool.color }}>
                    {tool.name[0]}
                </span>
            )}
        </div>
    )
}

export default function Hero() {
    const [wordIdx, setWordIdx] = useState(0)
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setWordIdx(i => (i + 1) % WORDS.length)
                setVisible(true)
            }, 300)
        }, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative min-h-screen bg-[#FAFAF7] flex items-center overflow-hidden pt-20">

            {/* Gradient mesh background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, #CAFF32 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
                <div className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6B4FFF 0%, transparent 70%)', transform: 'translate(-50%, -50%)' }} />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

            {/* Aceternity Vertical Marquee - Left Side */}
            <div className="absolute left-0 top-0 bottom-0 w-64 hidden xl:flex justify-end gap-12 py-10 px-8 mask-vertical-faded pointer-events-auto z-20">
                {/* Colonne 1 : Défilement vers le haut */}
                <div className="flex flex-col gap-12 h-max animate-marquee-vertical mt-10">
                    {[...TOOLS, ...TOOLS, ...TOOLS, ...TOOLS].map((tool, i) => (
                        <RawLogo key={i} tool={tool} />
                    ))}
                </div>

                {/* Colonne 2 : Défilement vers le bas */}
                <div className="flex flex-col gap-12 h-max animate-marquee-vertical-reverse -mt-32">
                    {[...TOOLS, ...TOOLS, ...TOOLS, ...TOOLS].map((tool, i) => (
                        <RawLogo key={i} tool={tool} />
                    ))}
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full
                        px-4 py-2 mb-8 shadow-sm animate-fadeUp">
                    <div className="w-2 h-2 rounded-full bg-[#CAFF32] animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">
                        200+ agents IA validés · Benchmark en temps réel
                    </span>
                </div>

                {/* Headline */}
                <h1 className="font-black text-zinc-900 leading-[1] tracking-tight mb-6 animate-fadeUp"
                    style={{ fontSize: 'clamp(3.5rem, 8vw, 7rem)', animationDelay: '0.1s' }}>
                    Lance ton projet{' '}
                    <br />
                    <span className="relative inline-block px-6 py-3 mt-1">
                        {/* Torn paper background */}
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundColor: '#AAEE00',
                                clipPath: 'polygon(0% 18%, 3% 4%, 7% 20%, 13% 2%, 20% 17%, 27% 1%, 34% 15%, 42% 0%, 50% 14%, 58% 0%, 65% 16%, 72% 1%, 79% 14%, 86% 0%, 92% 13%, 97% 3%, 100% 18%, 100% 82%, 97% 97%, 92% 83%, 86% 100%, 79% 84%, 72% 99%, 65% 83%, 58% 100%, 50% 85%, 42% 100%, 34% 84%, 27% 99%, 20% 82%, 13% 97%, 7% 80%, 3% 96%, 0% 82%)',
                            }}
                        />
                        {/* Rotating word */}
                        <span className="relative z-10 text-zinc-900 font-black">
                            <span className={cn(
                                'inline-block transition-all duration-300',
                                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                            )}>
                                {WORDS[wordIdx]}
                            </span>
                        </span>
                    </span>
                    <br />
                    avec les bons agents IA
                </h1>

                {/* Subheadline */}
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-fadeUp"
                    style={{ animationDelay: '0.2s' }}>
                    Décris ton objectif en une phrase. Raspquery analyse 200+ outils IA et t'assemble
                    le <strong className="text-zinc-700 font-semibold">combo exact</strong> — avec les coûts,
                    le ROI et le workflow clé en main.
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fadeUp"
                    style={{ animationDelay: '0.3s' }}>
                    <Link href="/sign-up"
                        className="group relative bg-zinc-900 text-white font-bold text-base px-8 py-4 rounded-full
                       hover:bg-zinc-800 transition-all hover:scale-105 hover:shadow-2xl
                       flex items-center gap-2">
                        <span>Obtenir mon stack gratuit</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ boxShadow: '0 0 30px rgba(202,255,50,0.3)' }} />
                    </Link>
                    <a href="#features"
                        className="text-zinc-600 hover:text-zinc-900 font-medium flex items-center gap-2 transition-colors">
                        <span>Voir une démo</span>
                        <span className="text-zinc-400">↓</span>
                    </a>
                </div>

                {/* Demo card */}
                <div className="relative max-w-3xl mx-auto animate-fadeUp" style={{ animationDelay: '0.4s' }}>
                    <div className="bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
                        {/* Browser bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div suppressHydrationWarning className="flex-1 bg-white border border-zinc-200 rounded-md py-1 px-3
                              text-xs text-zinc-400 font-mono text-center">
                                app.stackai.co — Construis ton stack
                            </div>
                        </div>

                        {/* Demo content */}
                        <div className="p-6">
                            {/* Objective input */}
                            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-4 text-left">
                                <p className="text-xs font-mono text-zinc-400 mb-1">Ton objectif</p>
                                <p className="text-zinc-700 font-medium">
                                    "Je veux lancer une boutique Shopify et automatiser mon service client"
                                </p>
                            </div>

                            {/* Result cards */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { name: 'Claude Sonnet', role: 'Fiches produits', price: '0€', color: '#FF6B35', domain: 'claude.ai' },
                                    { name: 'Midjourney', role: 'Visuels produits', price: '10€', color: '#000', domain: 'midjourney.com' },
                                    { name: 'Tidio AI', role: 'Chatbot SAV', price: '29€', color: '#4F8EF7', domain: 'tidio.com' },
                                    { name: 'Make.com', role: 'Automation', price: '9€', color: '#6B4FFF', domain: 'make.com' },
                                ].map((tool, i) => (
                                    <DemoCard key={tool.name} tool={tool} delay={i * 100} />
                                ))}
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400">Coût total</p>
                                    <p className="font-black text-zinc-900">48€/mois</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400">ROI estimé</p>
                                    <p className="font-black text-[#22c55e]">+380%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400">Temps économisé</p>
                                    <p className="font-black text-zinc-900">8h/sem</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-zinc-400">Agents</p>
                                    <p className="font-black text-zinc-900">4 outils</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shadow glow */}
                    <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl pointer-events-none -z-10"
                        style={{ background: 'linear-gradient(135deg, #CAFF32, #FF6B35)' }} />
                </div>

                {/* Trusted by logos */}
                <div className="mt-16 animate-fadeUp" style={{ animationDelay: '0.5s' }}>
                    <p className="text-sm text-zinc-400 mb-6 font-medium">
                        Alimenté par les meilleurs modèles IA
                    </p>
                    <div className="flex items-center justify-center gap-8 flex-wrap opacity-40 grayscale">
                        {['openai.com', 'anthropic.com', 'google.com', 'groq.com', 'mistral.ai'].map(domain => (
                            <img key={domain}
                                src={getLogoUrl(domain)}
                                alt={domain}
                                className="h-6 object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

function DemoCard({ tool, delay }: { tool: { name: string; role: string; price: string; color: string; domain: string }, delay: number }) {
    const [imgErr, setImgErr] = useState(false)
    return (
        <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-center
                    hover:border-zinc-300 hover:shadow-md transition-all duration-200
                    hover:-translate-y-0.5">
            <div className="w-9 h-9 bg-white rounded-lg shadow-sm border border-zinc-100
                      flex items-center justify-center mx-auto mb-2">
                {!imgErr ? (
                    <img
                        src={getLogoUrl(tool.domain)}
                        alt={tool.name}
                        className="w-6 h-6 object-contain"
                        onError={() => setImgErr(true)}
                    />
                ) : (
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: tool.color }}>
                        {tool.name[0]}
                    </div>
                )}
            </div>
            <p className="text-xs font-bold text-zinc-800 leading-tight">{tool.name}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{tool.role}</p>
            <p className="text-[10px] font-semibold text-[#22c55e] mt-1">{tool.price}</p>
        </div>
    )
}