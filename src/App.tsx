import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo } from 'react'
import { Heart, Search, X, ChevronLeft, ChevronRight, RefreshCw, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface PokemonType {
  type: { name: string }
}

interface Stat {
  base_stat: number
  stat: { name: string }
}

interface Ability {
  ability: { name: string }
  is_hidden: boolean
}

interface Sprites {
  front_default: string | null
  other?: {
    'official-artwork'?: { front_default: string | null }
  }
}

interface Pokemon {
  id: number
  name: string
  types: PokemonType[]
  sprites: Sprites
  height: number
  weight: number
  stats: Stat[]
  abilities: Ability[]
  flavor_text?: string
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: '#A8A77A', text: '#111827' },
  fire: { bg: '#EE8130', text: '#111827' },
  water: { bg: '#6390F0', text: '#fff' },
  electric: { bg: '#F7D02C', text: '#111827' },
  grass: { bg: '#7AC74C', text: '#111827' },
  ice: { bg: '#96D9D6', text: '#111827' },
  fighting: { bg: '#C22E28', text: '#fff' },
  poison: { bg: '#A33EA1', text: '#fff' },
  ground: { bg: '#E2BF65', text: '#111827' },
  flying: { bg: '#A98FF3', text: '#111827' },
  psychic: { bg: '#F95587', text: '#fff' },
  bug: { bg: '#A6B91A', text: '#111827' },
  rock: { bg: '#B6A136', text: '#111827' },
  ghost: { bg: '#735797', text: '#fff' },
  dragon: { bg: '#6F35FC', text: '#fff' },
  dark: { bg: '#705746', text: '#fff' },
  steel: { bg: '#B7B7CE', text: '#111827' },
  fairy: { bg: '#D685AD', text: '#111827' },
}

const ALL_TYPES = Object.keys(TYPE_COLORS)

const GEN_RANGES: Record<string, [number, number]> = {
  '1': [1, 151],
  '2': [152, 251],
  '3': [252, 386],
  '4': [387, 493],
  '5': [494, 649],
  '6': [650, 721],
  '7': [722, 809],
  '8': [810, 905],
  '9': [906, 1025],
}

const SORT_OPTIONS = [
  { value: 'id-asc', label: 'ID (Low to High)' },
  { value: 'id-desc', label: 'ID (High to Low)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'hp', label: 'Highest HP' },
] as const

type SortKey = typeof SORT_OPTIONS[number]['value']

function getTypeBadge(type: string, interactive?: boolean, onClick?: () => void) {
  const color = TYPE_COLORS[type] || { bg: '#64748b', text: '#fff' }
  return (
    <span
      onClick={interactive && onClick ? onClick : undefined}
      className={`type-badge ${interactive ? 'cursor-pointer hover:brightness-105 active:scale-[0.96]' : ''}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {type}
    </span>
  )
}

const PokemonCard = memo(function PokemonCard({ pokemon, isFavorite, onClick, onToggleFavorite }: {
  pokemon: Pokemon
  isFavorite: boolean
  onClick: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
}) {
  const sprite = pokemon.sprites.other?.['official-artwork']?.front_default ||
    pokemon.sprites.front_default ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`

  return (
    <div onClick={onClick} className="pokedex-card group bg-[#111827] rounded-3xl overflow-hidden cursor-pointer flex flex-col touch-manipulation">
      <div className="relative bg-[#0a0c14] px-3 sm:px-4 pt-4 sm:pt-5 pb-2 sm:pb-3 flex justify-center items-center h-[120px] sm:h-[138px]">
        <img
          src={sprite}
          className="pokemon-img max-h-[100px] max-w-[100px] sm:max-h-[118px] sm:max-w-[118px] object-contain drop-shadow-xl select-none"
          alt={pokemon.name}
          loading="lazy"
        />
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all ${isFavorite ? 'text-red-400' : 'text-white/30 group-hover:text-white/60'}`}
        >
          <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <div className="absolute top-3 left-4">
          <span className="font-mono text-[10px] font-medium tracking-[1.5px] text-red-400/90">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
        </div>
      </div>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0.5 sm:pt-1 flex-1 flex flex-col">
        <div className="font-semibold text-sm sm:text-[15px] capitalize tracking-[-0.2px] mb-1.5 sm:mb-2">{pokemon.name}</div>
        <div className="flex gap-1 sm:gap-1.5 mt-auto">
          {pokemon.types.map(t => getTypeBadge(t.type.name))}
        </div>
      </div>
    </div>
  )
})

const StatBar = memo(function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(Math.max((value / 255) * 100, 8), 100)
  return (
    <div className="stat-row">
      <div className="stat-name text-[10px] sm:text-xs w-12 sm:w-[58px]">{label}</div>
      <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#ef4444]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
        />
      </div>
      <div className="w-8 font-mono text-right font-semibold tabular-nums text-sm text-white/90">{value}</div>
    </div>
  )
})

function App() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set())
  const [currentGen, setCurrentGen] = useState<'all' | string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('id-asc')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [modalPokemon, setModalPokemon] = useState<Pokemon | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const totalAvailable = 1025

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pokedex-favorites')
      if (saved) setFavorites(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('pokedex-favorites', JSON.stringify([...favorites]))
  }, [favorites])

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPokemon) {
        closeModal()
      } else if (e.key === '/' && !selectedPokemon) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPokemon])

  const cacheRef = useRef(new Map<number | string, Pokemon>())

  const fetchDetail = useCallback(async (id: number): Promise<Pokemon | null> => {
    const cache = cacheRef.current
    if (cache.has(id)) return cache.get(id)!

    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      if (!res.ok) return null
      const data: any = await res.json()

      let flavor = ''
      try {
        const sp = await fetch(data.species.url)
        if (sp.ok) {
          const species = await sp.json()
          const entry = species.flavor_text_entries?.find((e: any) => e.language.name === 'en')
          if (entry) flavor = entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ')
        }
      } catch {}

      const full: Pokemon = {
        id: data.id,
        name: data.name,
        types: data.types,
        sprites: data.sprites,
        height: data.height,
        weight: data.weight,
        stats: data.stats,
        abilities: data.abilities,
        flavor_text: flavor || undefined,
      }
      cache.set(full.id, full)
      cache.set(full.name, full)
      return full
    } catch {
      return null
    }
  }, [])

  const loadBatch = useCallback(async (startOffset: number, count: number) => {
    const listRes = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${count}&offset=${startOffset}`)
    if (!listRes.ok) throw new Error('Failed to load list')
    const list = await listRes.json()

    const ids = list.results.map((_: any, i: number) => startOffset + i + 1)
    const details = await Promise.all(ids.map((id: number) => fetchDetail(id)))

    return details.filter((p): p is Pokemon => p !== null)
  }, [fetchDetail])

  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const batch = await loadBatch(0, 240)
      setAllPokemon(batch)
      setOffset(240)
      setHasMore(batch.length > 0 && 240 < totalAvailable)
    } catch {
      setError('Failed to load Pokémon. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [loadBatch])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const loadMore = async () => {
    if (isLoading || !hasMore) return
    const currentOffset = offset
    setIsLoading(true)
    try {
      const nextCount = Math.min(72, totalAvailable - currentOffset)
      const batch = await loadBatch(currentOffset, nextCount)
      if (batch.length > 0) {
        setAllPokemon(prev => [...prev, ...batch])
        const newOffset = currentOffset + batch.length
        setOffset(newOffset)
        setHasMore(newOffset < totalAvailable)
      } else {
        setHasMore(false)
      }
    } catch {
      toast.error('Failed to load more Pokémon')
    } finally {
      setIsLoading(false)
    }
  }

  const ensureDataForGen = async (gen: string) => {
    const range = GEN_RANGES[gen]
    if (!range) return
    const target = range[0]
    if (offset >= target) return

    setIsLoading(true)
    try {
      let current = offset
      while (current < target && current < totalAvailable) {
        const count = Math.min(60, target - current)
        const batch = await loadBatch(current, count)
        if (batch.length === 0) break
        setAllPokemon(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const unique = batch.filter(p => !existingIds.has(p.id))
          return [...prev, ...unique]
        })
        current += batch.length
        setOffset(current)
        setHasMore(current < totalAvailable)
        await new Promise(r => setTimeout(r, 30))
      }
    } catch {
      // silent, user can still use load more
    } finally {
      setIsLoading(false)
    }
  }

  const toggleType = (type: string) => {
    const next = new Set(activeTypes)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    setActiveTypes(next)
  }

  const clearTypes = () => setActiveTypes(new Set())

  const toggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = new Set(favorites)
    const wasFav = next.has(id)
    if (wasFav) next.delete(id)
    else next.add(id)
    setFavorites(next)

    if (!wasFav) {
      toast.success('Added to favorites', { description: `#${String(id).padStart(3, '0')}` })
    }
  }

  const toggleFavoritesView = () => {
    setShowFavoritesOnly(!showFavoritesOnly)
    if (!showFavoritesOnly) {
      setSearch('')
      setActiveTypes(new Set())
      setCurrentGen('all')
    }
  }

  const changeSort = () => {
    const currentIdx = SORT_OPTIONS.findIndex(o => o.value === sortKey)
    const next = SORT_OPTIONS[(currentIdx + 1) % SORT_OPTIONS.length].value
    setSortKey(next)
  }

  const filtered = useMemo(() => {
    let result = [...allPokemon]

    const range = GEN_RANGES[currentGen]
    if (range) {
      result = result.filter(p => p.id >= range[0] && p.id <= range[1])
    }

    if (deferredSearch) {
      const term = deferredSearch.trim().toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        String(p.id).includes(term)
      )
    }

    if (activeTypes.size > 0) {
      result = result.filter(p => {
        const types = p.types.map(t => t.type.name)
        return Array.from(activeTypes).every(t => types.includes(t))
      })
    }

    if (showFavoritesOnly) {
      result = result.filter(p => favorites.has(p.id))
    }

    result.sort((a, b) => {
      if (sortKey === 'id-asc') return a.id - b.id
      if (sortKey === 'id-desc') return b.id - a.id
      if (sortKey === 'name-asc') return a.name.localeCompare(b.name)
      if (sortKey === 'name-desc') return b.name.localeCompare(a.name)
      if (sortKey === 'hp') {
        const ha = a.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
        const hb = b.stats.find(s => s.stat.name === 'hp')?.base_stat || 0
        return hb - ha
      }
      return 0
    })

    return result
  }, [allPokemon, deferredSearch, activeTypes, currentGen, sortKey, showFavoritesOnly, favorites])

  const openModal = async (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon)
    setModalPokemon(pokemon)

    if (!pokemon.flavor_text || pokemon.stats.length === 0) {
      const full = await fetchDetail(pokemon.id)
      if (full) {
        setModalPokemon(full)
        setAllPokemon(prev => {
          const idx = prev.findIndex(p => p.id === full.id)
          if (idx !== -1) {
            const copy = [...prev]
            copy[idx] = full
            return copy
          }
          return prev
        })
      }
    }
  }

  const closeModal = () => {
    setSelectedPokemon(null)
    setModalPokemon(null)
  }

  const navigateModal = (dir: number) => {
    if (!selectedPokemon) return
    const pool = showFavoritesOnly
      ? filtered
      : filtered.length > 0 ? filtered : allPokemon

    const idx = pool.findIndex(p => p.id === selectedPokemon.id)
    if (idx === -1) return
    let nextIdx = idx + dir
    if (nextIdx < 0) nextIdx = pool.length - 1
    if (nextIdx >= pool.length) nextIdx = 0
    openModal(pool[nextIdx])
  }

  const retry = () => {
    setError(null)
    loadInitial()
  }

  const displayed = filtered
  const isFavView = showFavoritesOnly
  const resultLabel = isFavView
    ? `${displayed.length} favorite${displayed.length === 1 ? '' : 's'}`
    : `${displayed.length} Pokémon`

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortKey)?.label

  const canShowLoadMore = !showFavoritesOnly && hasMore

  const updateGen = (gen: string) => {
    setCurrentGen(gen as any)
    setShowFavoritesOnly(false)
    if (gen !== 'all') {
      void ensureDataForGen(gen)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setActiveTypes(new Set())
    setCurrentGen('all')
    setShowFavoritesOnly(false)
    setSortKey('id-asc')
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0c14]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-x-2 sm:gap-x-3 cursor-pointer min-w-0" onClick={resetFilters} aria-label="Reset all filters">
            <div className="pokeball" />
            <span className="text-2xl sm:text-3xl font-semibold tracking-tighter">Pokédex</span>
          </div>

          <div className="flex-1 max-w-[180px] sm:max-w-md mx-2 sm:mx-4 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5 sm:left-4 sm:top-3 sm:w-4 sm:h-4" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or #"
                className="search-input w-full bg-[#111827] border border-white/10 focus:border-red-500/50 pl-8 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-2xl text-sm placeholder:text-gray-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-x-1 sm:gap-x-2">
            <button
              onClick={toggleFavoritesView}
              aria-label={showFavoritesOnly ? 'Show all Pokémon' : 'Show favorites only'}
              className={`flex items-center gap-x-1.5 sm:gap-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm font-medium border transition-colors ${showFavoritesOnly ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'border-white/10 hover:bg-white/5'}`}
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
              <span>{favorites.size}</span>
            </button>

            <div className="relative">
              <select
                value={currentGen}
                onChange={(e) => updateGen(e.target.value)}
                aria-label="Filter by generation"
                className="appearance-none bg-[#111827] border border-white/10 text-xs sm:text-sm rounded-2xl px-2 sm:px-4 py-1 sm:py-2 pr-6 sm:pr-9 font-medium cursor-pointer hover:border-white/20 focus:outline-none focus:border-red-500/40 max-w-[110px] sm:max-w-none"
              >
                <option value="all">National Dex</option>
                <option value="1">Kanto (1–151)</option>
                <option value="2">Johto (152–251)</option>
                <option value="3">Hoenn (252–386)</option>
                <option value="4">Sinnoh (387–493)</option>
                <option value="5">Unova (494–649)</option>
                <option value="6">Kalos (650–721)</option>
                <option value="7">Alola (722–809)</option>
                <option value="8">Galar (810–905)</option>
                <option value="9">Paldea (906–1025)</option>
              </select>
              <ChevronRight className="w-3 h-3 absolute right-3.5 top-3 rotate-90 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
          <div className="uppercase text-[10px] sm:text-xs tracking-[1.5px] font-semibold text-gray-400">Types</div>
          {activeTypes.size > 0 && (
            <button onClick={clearTypes} aria-label="Clear type filters" className="text-[10px] sm:text-xs text-gray-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {ALL_TYPES.map(type => {
            const active = activeTypes.has(type)
            const color = TYPE_COLORS[type]
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`type-filter px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-2xl border border-transparent ${active ? 'active' : ''}`}
                style={{
                  backgroundColor: active ? color.bg : '#111827',
                  color: active ? color.text : '#d1d5db'
                }}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-x-2 sm:gap-x-3 text-gray-400">
          <div className="font-medium text-white">{resultLabel}</div>
          <div className="w-px h-3 bg-white/10" />
          <div className="text-[10px] sm:text-xs">{allPokemon.length} / {totalAvailable} loaded</div>
        </div>

        <button
          onClick={changeSort}
          aria-label="Change sort order"
          className="flex items-center gap-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#111827] hover:bg-[#1f2937] border border-white/10 rounded-2xl text-[10px] sm:text-xs font-medium transition-colors"
        >
          <span>{currentSortLabel}</span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
        {error && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-red-400 mb-3">{error}</div>
            <button onClick={retry} className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {!error && displayed.length === 0 && !isLoading && (
          <div className="text-center py-10 sm:py-16">
            <div className="text-gray-500 mb-2 text-sm">No results found</div>
            {currentGen !== 'all' && (
              <div className="text-[10px] sm:text-xs text-gray-600 mb-3">Load more to reveal this generation</div>
            )}
            <button onClick={resetFilters} className="text-sm text-red-400 hover:text-red-300">Reset filters</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
          {isLoading && allPokemon.length === 0 ? (
            Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="bg-[#111827] rounded-3xl overflow-hidden border border-white/5">
                <div className="h-[138px] skeleton" />
                <div className="px-4 pb-4 pt-3">
                  <div className="h-4 w-20 skeleton rounded mb-3" />
                  <div className="flex gap-1.5">
                    <div className="h-4 w-12 skeleton rounded-full" />
                    <div className="h-4 w-12 skeleton rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            displayed.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                isFavorite={favorites.has(pokemon.id)}
                onClick={() => openModal(pokemon)}
                onToggleFavorite={(e) => toggleFavorite(pokemon.id, e)}
              />
            ))
          )}
        </div>

        {canShowLoadMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="flex items-center gap-x-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-[#111827] hover:bg-white/5 border border-white/10 rounded-3xl text-sm font-semibold transition-all active:scale-[0.985] disabled:opacity-60"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{isLoading ? 'Loading...' : 'Load more Pokémon'}</span>
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {modalPokemon && selectedPokemon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={closeModal}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Pokémon details"
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.985 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[95vw] sm:max-w-[460px] mx-auto bg-[#111827] rounded-3xl border border-white/10 shadow-2xl overflow-hidden pokemon-modal"
            >
              <div className="relative px-6 pt-6 pb-2 bg-gradient-to-b from-black/40 to-transparent">
                <div className="flex items-center justify-between">
                  <button onClick={closeModal} aria-label="Close details" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex gap-x-1">
                    <button onClick={() => navigateModal(-1)} aria-label="Previous Pokémon" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigateModal(1)} aria-label="Next Pokémon" className="modal-close w-9 h-9 flex items-center justify-center rounded-2xl text-white/70 hover:text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 pb-5 sm:pb-6 -mt-1">
                <div className="flex justify-center -mt-2 mb-2">
                  <div className="relative w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center bg-[#0a0c14] rounded-[2.5rem] sm:rounded-[3rem]">
                    <img
                      src={modalPokemon.sprites.other?.['official-artwork']?.front_default || modalPokemon.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${modalPokemon.id}.png`}
                      className="max-h-[130px] max-w-[130px] sm:max-h-[190px] sm:max-w-[190px] drop-shadow-2xl select-none"
                      alt={modalPokemon.name}
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-mono text-xs tracking-[2px] text-red-400 font-semibold">
                      #{String(modalPokemon.id).padStart(3, '0')}
                    </div>
                    <div className="text-4xl font-semibold tracking-tighter capitalize">{modalPokemon.name}</div>
                  </div>
                  <button
                    onClick={(e) => { toggleFavorite(modalPokemon.id, e); }}
                    aria-label={favorites.has(modalPokemon.id) ? 'Remove from favorites' : 'Add to favorites'}
                    className="mt-1 w-11 h-11 flex items-center justify-center text-3xl text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <Heart fill={favorites.has(modalPokemon.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex gap-2 mb-6">
                  {modalPokemon.types.map(t => getTypeBadge(t.type.name, true, () => { closeModal(); toggleType(t.type.name) }))}
                </div>

                {modalPokemon.flavor_text && (
                  <div className="text-sm leading-relaxed text-gray-300 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-6">
                    {modalPokemon.flavor_text}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Height</div>
                    <div className="text-xl font-semibold tabular-nums">{(modalPokemon.height / 10).toFixed(1)} m</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-px">Weight</div>
                    <div className="text-xl font-semibold tabular-nums">{(modalPokemon.weight / 10).toFixed(1)} kg</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-3 px-1">Base Stats</div>
                  <div className="space-y-2">
                    {modalPokemon.stats.map(s => {
                      const label = s.stat.name === 'hp' ? 'HP' :
                        s.stat.name === 'attack' ? 'Attack' :
                        s.stat.name === 'defense' ? 'Defense' :
                        s.stat.name === 'special-attack' ? 'Sp. Atk' :
                        s.stat.name === 'special-defense' ? 'Sp. Def' : 'Speed'
                      return <StatBar key={s.stat.name} label={label} value={s.base_stat} />
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[1px] font-semibold text-gray-400 mb-2.5 px-1">Abilities</div>
                  <div className="flex flex-wrap gap-2">
                    {modalPokemon.abilities.map((a) => (
                      <div key={`${a.ability.name}-${a.is_hidden}`} className={`px-3 py-1 text-xs rounded-2xl border ${a.is_hidden ? 'border-white/20 bg-white/5 text-gray-300' : 'border-white/10 bg-white/5'}`}>
                        <span className="capitalize">{a.ability.name.replace('-', ' ')}</span>
                        {a.is_hidden && <span className="ml-1 text-[9px] text-gray-400">(hidden)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 bg-[#0a0c14]/60 flex items-center justify-between text-xs">
                <div className="text-gray-400">Data from PokéAPI</div>
                <button onClick={closeModal} className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-medium">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 pb-8 pt-4 text-center text-[10px] text-gray-600">
        Production-ready Pokédex • React + TypeScript + Tailwind • Powered by PokéAPI
      </footer>
    </div>
  )
}

export default App
