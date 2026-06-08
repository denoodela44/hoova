import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ShieldCheck } from 'lucide-react'

const CONDITIONS = ['any', 'new', 'used']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Viewed' },
]

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti',
]

export default function FilterPanel({ onClose }) {
  const [params, setParams] = useSearchParams()

  const get = (key, fallback = '') => params.get(key) || fallback

  const set = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const clearAll = () => {
    const q = params.get('q')
    const cat = params.get('category')
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (cat) next.set('category', cat)
    setParams(next)
  }

  const hasFilters = params.has('min_price') || params.has('max_price') ||
    params.has('condition') || params.has('region') || params.has('sort') ||
    params.has('verified_seller')

  return (
    <div className="card p-4 space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
          <SlidersHorizontal className="w-4 h-4 text-brand-500" />
          Filters
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-600">
              Clear all
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="btn-ghost p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sort by</label>
        <select
          value={get('sort', 'newest')}
          onChange={(e) => set('sort', e.target.value)}
          className="input"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Price (GHS)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={get('min_price')}
            onChange={(e) => set('min_price', e.target.value)}
            className="input"
            min="0"
          />
          <input
            type="number"
            placeholder="Max"
            value={get('max_price')}
            onChange={(e) => set('max_price', e.target.value)}
            className="input"
            min="0"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Condition</label>
        <div className="flex gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              onClick={() => set('condition', c === 'any' ? '' : c)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all
                ${(get('condition') || 'any') === c
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                  : 'border-gray-200 dark:border-dark-border text-gray-500 hover:border-gray-300'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Region */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Region</label>
        <select
          value={get('region')}
          onChange={(e) => set('region', e.target.value)}
          className="input"
        >
          <option value="">All Regions</option>
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Verified sellers */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Seller</label>
        <button
          onClick={() => set('verified_seller', params.get('verified_seller') === 'true' ? '' : 'true')}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
            params.get('verified_seller') === 'true'
              ? 'border-[#B81365] text-[#B81365] bg-[#fdf2f5]'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <ShieldCheck className={`w-4 h-4 shrink-0 ${params.get('verified_seller') === 'true' ? 'text-[#B81365]' : 'text-gray-400'}`} />
          Verified Sellers Only
          {params.get('verified_seller') === 'true' && (
            <span className="ml-auto w-2 h-2 rounded-full bg-[#B81365]" />
          )}
        </button>
      </div>
    </div>
  )
}
