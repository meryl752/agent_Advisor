'use client'

import { useUser } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'

export default function AccountPage() {
  const t = useTranslations('dashboard.account')
  const { user } = useUser()
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await user.update({
        firstName,
        lastName,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="h-4 w-96 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse mb-8" />
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
            <div className="h-10 bg-zinc-100 dark:bg-zinc-900 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-syne text-zinc-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
        <div className="flex items-start gap-6 mb-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
              {user.imageUrl ? (
                <Image 
                  src={user.imageUrl} 
                  alt="Avatar" 
                  width={80} 
                  height={80} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-300">
                  {user.firstName?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold font-syne text-zinc-900 dark:text-white mb-1">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              {user.emailAddresses[0]?.emailAddress}
            </p>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {user.emailAddresses[0]?.verification?.status === 'verified' ? '✓ Vérifié' : 'Non vérifié'}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {t('name')}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CAFF32] focus:border-transparent transition-all"
                placeholder="Prénom"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#CAFF32] focus:border-transparent transition-all"
                placeholder="Nom"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.emailAddresses[0]?.emailAddress || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">
              Pour modifier votre email, contactez le support
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="px-6 py-2.5 bg-[#CAFF32] hover:bg-[#d4ff50] text-zinc-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : saved ? t('saved') : t('save')}
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span> Modifications enregistrées
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 mb-6">
        <h3 className="text-lg font-bold font-syne text-zinc-900 dark:text-white mb-4">
          Sécurité
        </h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Image 
                  src="/assets/icons svg/lock-password-stroke-rounded.svg" 
                  alt="Password" 
                  width={18} 
                  height={18} 
                  className="opacity-60 dark:invert"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Mot de passe
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Dernière modification il y a 30 jours
                </p>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              →
            </span>
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Image 
                  src="/assets/icons svg/shield-user-stroke-rounded.svg" 
                  alt="2FA" 
                  width={18} 
                  height={18} 
                  className="opacity-60 dark:invert"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Authentification à deux facteurs
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Non activée
                </p>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              →
            </span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-8">
        <h3 className="text-lg font-bold font-syne text-red-900 dark:text-red-400 mb-2">
          Zone dangereuse
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400/80 mb-4">
          {t('confirmDelete')}
        </p>
        <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all">
          {t('deleteAccount')}
        </button>
      </div>
    </div>
  )
}
