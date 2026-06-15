import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X, XCircle } from 'lucide-react'
import api from '../../services/api'
import ConfirmModal from '../../components/ui/ConfirmModal'

const MOCK_CATS = [
  { id: 'c1', name: 'Vehicles',     slug: 'vehicles',     icon_name: '🚗', _count: { listings: 14200 }, children: [
    { id: 'c1a', name: 'Cars',       slug: 'cars',       icon_name: null, _count: { listings: 9800 }, children: [] },
    { id: 'c1b', name: 'Motorbikes', slug: 'motorbikes', icon_name: null, _count: { listings: 2400 }, children: [] },
    { id: 'c1c', name: 'Trucks',     slug: 'trucks',     icon_name: null, _count: { listings: 2000 }, children: [] },
  ]},
  { id: 'c2', name: 'Electronics',  slug: 'electronics',  icon_name: '💻', _count: { listings: 11800 }, children: [
    { id: 'c2a', name: 'Laptops',    slug: 'laptops',    icon_name: null, _count: { listings: 4200 }, children: [] },
    { id: 'c2b', name: 'TVs',        slug: 'tvs',        icon_name: null, _count: { listings: 3100 }, children: [] },
  ]},
  { id: 'c3', name: 'Property',     slug: 'property',     icon_name: '🏠', _count: { listings: 9400 }, children: [] },
  { id: 'c4', name: 'Phones',       slug: 'phones',       icon_name: '📱', _count: { listings: 5800 }, children: [] },
  { id: 'c5', name: 'Fashion',      slug: 'fashion',      icon_name: '👗', _count: { listings: 6200 }, children: [] },
  { id: 'c6', name: 'Appliances',   slug: 'appliances',   icon_name: '🏡', _count: { listings: 3100 }, children: [] },
  { id: 'c7', name: 'Agriculture',  slug: 'agriculture',  icon_name: '🌾', _count: { listings: 1900 }, children: [] },
  { id: 'c8', name: 'Furniture',    slug: 'furniture',    icon_name: '🛋️', _count: { listings: 2700 }, children: [] },
]

export default function AdminCategories() {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState({})
  const [editing, setEditing]   = useState(null)
  const [adding, setAdding]     = useState(null)
  const [form, setForm]         = useState({ name: '', slug: '', icon_name: '' })
  const [confirmState, setConfirmState] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const { data: categories = MOCK_CATS, isError: queryFailed } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      try { return await api.get('/admin/categories').then((r) => r.data.data) } catch { return MOCK_CATS }
    },
  })

  const { mutate: createCat, isPending: creating } = useMutation({
    mutationFn: (data) => api.post('/admin/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setAdding(null)
      setForm({ name: '', slug: '', icon_name: '' })
      setSaveError(null)
    },
    onError: (err) => setSaveError(err.response?.data?.message || 'Failed to save — check slug is unique'),
  })

  const { mutate: updateCat, isPending: updating } = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setEditing(null)
      setSaveError(null)
    },
    onError: (err) => setSaveError(err.response?.data?.message || 'Failed to update category'),
  })

  const { mutate: deleteCat } = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
    onError: (err) => setSaveError(err.response?.data?.message || 'Failed to delete category'),
  })

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const totalListings = categories.reduce((s, c) => s + (c._count?.listings || 0), 0)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} parent categories · {totalListings.toLocaleString()} total listings</p>
        </div>
        <button onClick={() => { setAdding('root'); setForm({ name: '', slug: '', icon_name: '' }); setSaveError(null) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: '#B81365' }}>
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-700" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <XCircle className="w-4 h-4 shrink-0" />
          {saveError}
          <button onClick={() => setSaveError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add root category form */}
      {adding === 'root' && (
        <CategoryForm
          form={form} setForm={setForm} autoSlug={autoSlug}
          label="New Category"
          loading={creating}
          onSave={() => createCat({ ...form, parent_id: null })}
          onCancel={() => { setAdding(null); setSaveError(null) }}
        />
      )}

      {/* Category tree */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>
        {categories.map((cat, i) => (
          <div key={cat.id} style={{ borderBottom: i < categories.length - 1 ? '1px solid #f0eeeb' : 'none' }}>
            {/* Parent row */}
            {editing?.id === cat.id ? (
              <div className="p-4">
                <CategoryForm
                  form={editing} setForm={setEditing} autoSlug={autoSlug}
                  label="Edit Category"
                  loading={updating}
                  onSave={() => updateCat({ id: cat.id, name: editing.name, slug: editing.slug, icon_name: editing.icon_name })}
                  onCancel={() => { setEditing(null); setSaveError(null) }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                <button onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))}
                  className="text-gray-400 hover:text-gray-700 shrink-0">
                  {cat.children?.length > 0
                    ? (expanded[cat.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
                    : <span className="w-4" />}
                </button>
                <span className="text-lg shrink-0">{cat.icon_name || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{cat.name}</p>
                  <p className="text-[10px] text-gray-400">/{cat.slug} · {cat._count?.listings?.toLocaleString()} listings</p>
                </div>
                {cat.children?.length > 0 && (
                  <span className="text-[10px] text-gray-400">{cat.children.length} sub</span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setAdding(cat.id); setForm({ name: '', slug: '', icon_name: '' }) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Add subcategory">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing({ id: cat.id, name: cat.name, slug: cat.slug, icon_name: cat.icon_name || '' })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmState({ message: `Delete "${cat.name}" and all its subcategories?`, onConfirm: () => deleteCat(cat.id) })}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Add subcategory form */}
            {adding === cat.id && (
              <div className="px-4 pb-3 pl-11">
                <CategoryForm
                  form={form} setForm={setForm} autoSlug={autoSlug}
                  label={`Add subcategory to ${cat.name}`}
                  loading={creating}
                  onSave={() => createCat({ ...form, parent_id: cat.id })}
                  onCancel={() => { setAdding(null); setSaveError(null) }}
                />
              </div>
            )}

            {/* Children */}
            {expanded[cat.id] && cat.children?.map((sub, j) => (
              <div key={sub.id}>
                {editing?.id === sub.id ? (
                  <div className="pl-11 pr-4 pb-3">
                    <CategoryForm
                      form={editing} setForm={setEditing} autoSlug={autoSlug}
                      label="Edit Subcategory"
                      loading={updating}
                      onSave={() => updateCat({ id: sub.id, name: editing.name, slug: editing.slug })}
                      onCancel={() => { setEditing(null); setSaveError(null) }}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 pl-11 pr-4 py-2.5 hover:bg-gray-50 group"
                    style={{ borderTop: '1px solid #f9f9f9' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-medium">{sub.name}</p>
                      <p className="text-[10px] text-gray-400">/{sub.slug} · {sub._count?.listings?.toLocaleString()} listings</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditing({ id: sub.id, name: sub.name, slug: sub.slug, icon_name: sub.icon_name || '' })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmState({ message: `Delete subcategory "${sub.name}"?`, onConfirm: () => deleteCat(sub.id) })}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={() => { confirmState.onConfirm(); setConfirmState(null) }}
          onCancel={() => setConfirmState(null)}
        />
      )}
      </div>
    </div>
  )
}

function CategoryForm({ form, setForm, autoSlug, label, onSave, onCancel, loading }) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: '#ECEAE6' }}>
      <p className="text-xs font-bold text-gray-600">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
          placeholder="Name" className="px-3 py-2 rounded-xl text-xs border focus:outline-none bg-white" style={{ border: '1px solid #e5e7eb' }} />
        <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="slug" className="px-3 py-2 rounded-xl text-xs border focus:outline-none font-mono bg-white" style={{ border: '1px solid #e5e7eb' }} />
        <input value={form.icon_name || ''} onChange={(e) => setForm((f) => ({ ...f, icon_name: e.target.value }))}
          placeholder="Icon (emoji)" className="px-3 py-2 rounded-xl text-xs border focus:outline-none bg-white" style={{ border: '1px solid #e5e7eb' }} />
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} disabled={!form.name || !form.slug || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-40"
          style={{ background: '#B81365' }}>
          <Save className="w-3 h-3" /> {loading ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-white">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  )
}
