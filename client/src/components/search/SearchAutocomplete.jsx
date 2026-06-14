import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, Tag, X, ArrowUpRight, Clock, MapPin, ChevronDown } from 'lucide-react'
import { MOCK_LISTINGS, MOCK_CATEGORIES } from '../../mocks/data'
import { formatPrice } from '../../utils/format'
import api from '../../services/api'
import { getCategoryStyle } from '../../utils/categoryStyles'

const POPULAR = ['iPhone 15', 'Toyota Corolla', 'Laptop', '2 bedroom house', 'Generator', 'Samsung TV', 'Land for sale', 'PS5']
const HISTORY_KEY = 'hoova-search-history'

const CITIES = [
  'Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast',
  'Tema', 'Sekondi', 'Koforidua', 'Ho', 'Bolgatanga', 'Wa', 'Sunyani',
]

function logSearch(query, results_count, source) {
  api.post('/analytics/search', { query, results_count, source }).catch(() => {})
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
function saveHistory(term) {
  if (!term.trim()) return
  const prev = getHistory().filter((h) => h !== term).slice(0, 4)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...prev]))
}

function useDebounce(value, delay = 180) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

async function queryResults(q, city = '') {
  try {
    const params = new URLSearchParams({ q, limit: 5 })
    if (city) params.set('city', city)
    const res = await api.get(`/search?${params}`)
    return res.data.data || []
  } catch {
    return []
  }
}

export default function SearchAutocomplete({ large = false, placeholder = 'What are you looking for?', source = 'hero' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [history, setHistory] = useState(getHistory)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debouncedQuery = useDebounce(query)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    queryResults(debouncedQuery, location).then((r) => { setResults(r); setLoading(false) })
  }, [debouncedQuery, location])

  useEffect(() => { setActiveIndex(-1) }, [results, open])

  const matchedCategories = query.trim()
    ? MOCK_CATEGORIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : []

  const allItems = [
    ...(query.trim() ? results.map((r) => ({ type: 'listing', data: r })) : []),
    ...(query.trim() ? matchedCategories.map((c) => ({ type: 'category', data: c })) : []),
    ...(query.trim() ? [] : history.map((h) => ({ type: 'history', data: h }))),
    ...(query.trim() ? [] : POPULAR.map((p) => ({ type: 'popular', data: p }))),
  ]

  const buildUrl = useCallback((base) => {
    return location ? `${base}&city=${encodeURIComponent(location)}` : base
  }, [location])

  const navigate_to = useCallback((item) => {
    if (item.type === 'listing') {
      logSearch(item.data.title, 1, source)
      saveHistory(item.data.title)
      setHistory(getHistory())
      setOpen(false); setQuery('')
      navigate(`/listing/${item.data.id}`)
    } else if (item.type === 'category') {
      logSearch(item.data.name, item.data.listing_count, source)
      setOpen(false); setQuery('')
      navigate(buildUrl(`/browse?category=${item.data.slug}`))
    } else {
      const term = item.data
      logSearch(term, results.length, source)
      saveHistory(term)
      setHistory(getHistory())
      setOpen(false); setQuery(term)
      navigate(buildUrl(`/browse?q=${encodeURIComponent(term)}`))
    }
  }, [navigate, results.length, source, buildUrl])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (activeIndex >= 0 && allItems[activeIndex]) { navigate_to(allItems[activeIndex]); return }
    if (!query.trim()) {
      if (location) { navigate(`/browse?city=${encodeURIComponent(location)}`); setOpen(false) }
      return
    }
    logSearch(query.trim(), results.length, source)
    saveHistory(query.trim())
    setHistory(getHistory())
    setOpen(false)
    navigate(buildUrl(`/browse?q=${encodeURIComponent(query.trim())}`))
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, -1)) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
    else if (e.key === 'Enter') { handleSubmit() }
  }

  const clearHistory = (e) => {
    e.stopPropagation()
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  const showDropdown = open && (query.trim() ? (loading || results.length > 0 || matchedCategories.length > 0) : true)

  /* ── Large hero variant ─────────────────────────────────── */
  if (large) {
    return (
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSubmit}>
          <div
            className="flex items-center bg-white"
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 32px rgba(0,0,0,0.14), 0 1px 6px rgba(0,0,0,0.08)',
              height: 56,
              overflow: 'hidden',
            }}
          >
            {/* Search icon */}
            <div className="flex items-center pl-4 pr-2 shrink-0">
              <Search className="w-5 h-5" style={{ color: '#B81365' }} strokeWidth={2.5} />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 h-full text-[15px] text-gray-800 bg-transparent outline-none placeholder-gray-400 min-w-0"
              autoComplete="off"
              spellCheck={false}
            />

            {/* Clear */}
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                className="text-gray-300 hover:text-gray-500 transition-colors px-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-7 shrink-0 bg-gray-200 mx-1" />

            {/* Location picker */}
            <div className="relative flex items-center gap-1.5 px-3 shrink-0">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#B81365' }} />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  paddingRight: '1.25rem',
                  maxWidth: 108,
                }}
              >
                <option value="">Anywhere</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" />
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="h-full px-7 text-white font-bold text-[15px] shrink-0 transition-opacity active:opacity-90 hover:opacity-90"
              style={{ background: '#B81365' }}
            >
              Search
            </button>
          </div>
        </form>

        {showDropdown && <Dropdown
          query={query} loading={loading} results={results}
          matchedCategories={matchedCategories} history={history}
          activeIndex={activeIndex} allItems={allItems}
          navigate_to={navigate_to} handleSubmit={handleSubmit}
          clearHistory={clearHistory}
        />}
      </div>
    )
  }

  /* ── Compact navbar variant ─────────────────────────────── */
  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input pl-9 pr-8"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {showDropdown && <Dropdown
        query={query} loading={loading} results={results}
        matchedCategories={matchedCategories} history={history}
        activeIndex={activeIndex} allItems={allItems}
        navigate_to={navigate_to} handleSubmit={handleSubmit}
        clearHistory={clearHistory}
      />}
    </div>
  )
}

/* ── Shared dropdown ────────────────────────────────────────── */
function Dropdown({ query, loading, results, matchedCategories, history, activeIndex, allItems, navigate_to, handleSubmit, clearHistory }) {
  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl overflow-hidden z-50 animate-fade-in"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(34,34,34,0.08)' }}
    >
      {query.trim() ? (
        <>
          {loading && (
            <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <div className="w-3.5 h-3.5 border-2 border-[#B81365] border-t-transparent rounded-full animate-spin" />
              Searching…
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <DropLabel>Listings</DropLabel>
              {results.map((listing, i) => (
                <button
                  key={listing.id}
                  onMouseDown={() => navigate_to({ type: 'listing', data: listing })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                  style={{ background: activeIndex === i ? '#fdf2f5' : 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fdf2f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = activeIndex === i ? '#fdf2f5' : 'transparent'}
                >
                  <img src={listing.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      <Highlight text={listing.title} query={query} />
                    </p>
                    <p className="text-xs text-gray-400 truncate">{listing.location?.city} · {listing.category?.name}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(listing.price)}</p>
                </button>
              ))}
            </div>
          )}

          {!loading && matchedCategories.length > 0 && (
            <div>
              <DropLabel>Categories</DropLabel>
              {matchedCategories.map((cat, i) => {
                const idx = results.length + i
                return (
                  <button
                    key={cat.id}
                    onMouseDown={() => navigate_to({ type: 'category', data: cat })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                    style={{ background: activeIndex === idx ? '#fdf2f5' : 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fdf2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = activeIndex === idx ? '#fdf2f5' : 'transparent'}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: getCategoryStyle(cat.slug).bg,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className={`ti ti-${getCategoryStyle(cat.slug).icon}`}
                        style={{ color: getCategoryStyle(cat.slug).color, fontSize: 15 }}
                      />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800"><Highlight text={cat.name} query={query} /></p>
                      <p className="text-xs text-gray-400">{cat.listing_count.toLocaleString()} listings</p>
                    </div>
                    <Tag className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                )
              })}
            </div>
          )}

          {!loading && results.length === 0 && matchedCategories.length === 0 && (
            <button
              onMouseDown={handleSubmit}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#fdf2f5] transition-colors duration-100"
            >
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-600">
                Search for <span className="font-semibold text-gray-900">"{query}"</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
            </button>
          )}

          {!loading && results.length > 0 && (
            <button
              onMouseDown={handleSubmit}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors duration-100 hover:bg-[#fdf2f5]"
              style={{ borderTop: '1px solid rgba(34,34,34,0.06)', color: '#B81365' }}
            >
              See all results for "{query}" <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      ) : (
        <>
          {history.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <DropLabel inline>Recent</DropLabel>
                <button onMouseDown={clearHistory} className="text-[11px] text-gray-400 hover:text-red-400 transition-colors">
                  Clear
                </button>
              </div>
              {history.map((term, i) => (
                <button
                  key={term}
                  onMouseDown={() => navigate_to({ type: 'history', data: term })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#fdf2f5] transition-colors duration-100"
                  style={{ background: activeIndex === i ? '#fdf2f5' : 'transparent' }}
                >
                  <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  <span className="text-sm text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 pt-3 pb-4">
            <DropLabel inline>Popular searches</DropLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {POPULAR.map((term, i) => {
                const idx = history.length + i
                return (
                  <button
                    key={term}
                    onMouseDown={() => navigate_to({ type: 'popular', data: term })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150"
                    style={
                      activeIndex === idx
                        ? { background: '#B81365', borderColor: '#B81365', color: '#fff' }
                        : { background: '#fafafa', borderColor: '#e5e7eb', color: '#555' }
                    }
                  >
                    <TrendingUp className="w-3 h-3" />
                    {term}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DropLabel({ children, inline = false }) {
  if (inline) return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
  return <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{children}</p>
}

function Highlight({ text, query }) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#F8C0C8] text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
