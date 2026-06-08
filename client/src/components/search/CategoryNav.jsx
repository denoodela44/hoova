import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { MOCK_CATEGORIES } from '../../mocks/data'
import { getCategoryStyle } from '../../utils/categoryStyles'

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
        <CategoryChip label="All" slug="all" to="/browse" active={!active} />
        {top.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            slug={cat.slug}
            to={`/browse?category=${cat.slug}`}
            active={active === cat.slug}
          />
        ))}
      </div>
    </nav>
  )
}

function CategoryChip({ label, slug, to, active }) {
  const style = slug === 'all' ? { icon: 'layout-grid', color: '#6B7280' } : getCategoryStyle(slug)

  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
        ${active
          ? 'bg-brand-500 text-white'
          : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-brand-300 hover:text-brand-700'
        }`}
    >
      <i
        className={`ti ti-${style.icon}`}
        style={{ color: active ? '#fff' : style.color, fontSize: 15 }}
      />
      {label}
    </Link>
  )
}
