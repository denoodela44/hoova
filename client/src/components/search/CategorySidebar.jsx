import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { MOCK_CATEGORIES } from '../../mocks/data'

const ICONS = {
  vehicles: '🚗', electronics: '📱', 'real-estate': '🏠', fashion: '👗',
  jobs: '💼', services: '🔧', furniture: '🪑', agriculture: '🌾',
  sports: '⚽', books: '📚', babies: '👶', health: '💊',
  pets: '🐾', food: '🍔', other: '📦',
}

// Subcategories shown on hover/expand
const SUBCATEGORIES = {
  vehicles:     ['Cars', 'Motorcycles', 'Trucks & SUVs', 'Buses & Minivans', 'Auto Parts'],
  electronics:  ['Phones & Tablets', 'Laptops & PCs', 'TVs & Audio', 'Cameras', 'Accessories'],
  'real-estate':['Houses for Sale', 'Houses for Rent', 'Land & Plots', 'Commercial', 'Short Stay'],
  fashion:      ["Women's Clothing", "Men's Clothing", 'Shoes', 'Bags & Accessories'],
  jobs:         ['Accounting', 'IT & Software', 'Sales', 'Healthcare', 'Education'],
  services:     ['Home Services', 'Professional', 'Beauty & Wellness', 'Events', 'Tutoring'],
  furniture:    ['Living Room', 'Bedroom', 'Office', 'Kitchen & Dining'],
  agriculture:  ['Farm Produce', 'Equipment', 'Livestock'],
}

export default function CategorySidebar() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

  const { data: categories = MOCK_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try { return await api.get('/categories').then((r) => r.data.data) }
      catch { return MOCK_CATEGORIES }
    },
    staleTime: Infinity,
  })

  const top = categories.filter((c) => !c.parent_id)

  return (
    <div className="card overflow-hidden select-none">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
        <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">Browse Categories</h2>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-dark-border">
        {top.map((cat) => {
          const subs = SUBCATEGORIES[cat.slug] || []
          const isOpen = expanded === cat.slug

          return (
            <div key={cat.id}>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
                onClick={() => {
                  if (subs.length > 0) {
                    setExpanded(isOpen ? null : cat.slug)
                  } else {
                    navigate(`/browse?category=${cat.slug}`)
                  }
                }}
              >
                {/* Icon */}
                <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                  {ICONS[cat.slug] || '📦'}
                </span>

                {/* Label + count */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{cat.name}</p>
                  {cat.listing_count > 0 && (
                    <p className="text-xs font-semibold text-gray-500">{cat.listing_count.toLocaleString()} ads</p>
                  )}
                </div>

                {/* Arrow */}
                {subs.length > 0
                  ? (isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-brand-500 transition-colors" />)
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-brand-500 transition-colors" />
                }
              </button>

              {/* Subcategories */}
              {isOpen && subs.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-dark-border">
                  {subs.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => navigate(`/browse?category=${cat.slug}&q=${encodeURIComponent(sub)}`)}
                      className="w-full flex items-center gap-2 pl-14 pr-4 py-2 text-left hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group/sub"
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 group-hover/sub:text-brand-700 dark:group-hover/sub:text-brand-400 transition-colors">
                        {sub}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => navigate(`/browse?category=${cat.slug}`)}
                    className="w-full flex items-center gap-2 pl-14 pr-4 py-2 text-left hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">View all {cat.name} →</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
