# Feature: Sélection Multiple de Stacks

## Résumé
Ajout de checkboxes pour sélectionner plusieurs stacks et les supprimer en masse.

## Modifications à faire dans `StacksClient.tsx`

### 1. Ajouter les états
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [isDeleting, setIsDeleting] = useState(false)
```

### 2. Ajouter les fonctions
```typescript
const toggleSelect = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}

const toggleSelectAll = () => {
  if (selectedIds.size === filteredStacks.length) {
    setSelectedIds(new Set())
  } else {
    setSelectedIds(new Set(filteredStacks.map(s => s.id)))
  }
}

async function handleDeleteSelected() {
  setIsDeleting(true)
  setError(null)
  try {
    await Promise.all(
      Array.from(selectedIds).map(id =>
        fetch(`/api/stacks/${id}`, { method: 'DELETE' })
      )
    )
    setStacks(prev => prev.filter(s => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
  } catch (e: any) {
    setError('Erreur lors de la suppression')
  } finally {
    setIsDeleting(false)
  }
}
```

### 3. Ajouter la barre d'actions en haut
Après la barre de recherche, ajouter:
```tsx
{selectedIds.size > 0 && (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-2 px-2 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
    <span className="text-sm text-zinc-500">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
    <button
      onClick={handleDeleteSelected}
      disabled={isDeleting}
      className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'Suppression...' : 'Supprimer'}
    </button>
    <button
      onClick={() => setSelectedIds(new Set())}
      className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
    >
      Annuler
    </button>
  </motion.div>
)}
```

### 4. Ajouter checkbox "Tout sélectionner"
```tsx
{filteredStacks.length > 0 && (
  <div className="flex items-center gap-2 px-2">
    <input
      type="checkbox"
      checked={selectedIds.size === filteredStacks.length && filteredStacks.length > 0}
      onChange={toggleSelectAll}
      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#CAFF32] focus:ring-[#CAFF32] focus:ring-offset-0"
    />
    <span className="text-sm text-zinc-500">Tout sélectionner</span>
  </div>
)}
```

### 5. Ajouter checkbox sur chaque card
Au début de chaque card, ajouter:
```tsx
<div className="flex-shrink-0 pt-1" onClick={e => e.stopPropagation()}>
  <input
    type="checkbox"
    checked={selectedIds.has(stack.id)}
    onChange={() => toggleSelect(stack.id)}
    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-[#CAFF32] focus:ring-[#CAFF32] focus:ring-offset-0"
  />
</div>
```

### 6. Modifier le style de la card quand sélectionnée
```tsx
className={`rounded-2xl border bg-white dark:bg-zinc-900/50 p-5 transition-all cursor-pointer ${
  selectedIds.has(stack.id)
    ? 'border-[#CAFF32] ring-2 ring-[#CAFF32]/20' 
    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'
}`}
```

## Résultat
- ✅ Checkbox sur chaque stack
- ✅ Checkbox "Tout sélectionner" en haut
- ✅ Barre d'actions qui apparaît quand des stacks sont sélectionnés
- ✅ Bouton "Supprimer" pour supprimer tous les stacks sélectionnés en une fois
- ✅ Highlight visuel des stacks sélectionnés (bordure verte)

## Test
1. Cochez quelques stacks
2. Cliquez sur "Supprimer"
3. Tous les stacks sélectionnés sont supprimés en une fois
