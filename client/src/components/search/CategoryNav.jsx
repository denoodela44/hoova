import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { MOCK_CATEGORIES } from '../../mocks/data'

const ICONS = {
  vehicles: '🚗', electronics: '📱', 'real-estate': '🏠', fashion: '👗',
  jobs: '💼', services: '🔧', furniture: '🪑', agriculture: '🌾',
  sports: '⚽', books: '📚', babies: '👶', health: '💊',
  pets: '🐾', food: '🍔', other: '📦',
}

export default function CategoryNav() {
  const [params] = useSearchParams()
  const active = params.get('category') || ''

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        return await api.get('/categories').then((r) => r.data.data)
      } catch {
        return MOCK_CATEGORIES
      }
    },
    staleTime: Infinity,
  })

  const top = categories.filter((c) => !c.parent_id)

  return (
    <nav className="overflow-x-auto scrollbar-none">
      <div className="flex gap-2 py-1 min-w-max">
        <CategoryChip
          label="All"
          icon="🏷️"
          to="/browse"
          active={!active}
        />
        {top.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            icon={ICONS[cat.slug] || '📦'}
            to={`/browse?category=${cat.slug}`}
            active={active === cat.slug}
          />
        ))}
      </div>
    </nav>
  )
}

function CategoryChip({ label, icon, to, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
        ${active
          ? 'bg-brand-500 text-white'
          : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-brand-300 hover:text-brand-700'
        }`}
    >
      <span>{icon}</span>
      {label}
    </Link>
  )
}
