import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Save, CheckCircle2, Zap, Crown, RefreshCw } from 'lucide-react'
import api from '../../services/api'

function Field({ label, hint, prefix = 'GHS', value, onChange, disabled, type = 'number', min }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white focus-within:border-[#B81365] transition-colors">
        {prefix && (
          <span className="px-3 py-2.5 text-xs font-bold text-gray-400 bg-gray-50 border-r border-gray-200 shrink-0">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Card({ icon: Icon, title, color, children }) {
  return (
    <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid #e9e6e0' }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function AdminPricing() {
  const qc = useQueryClient()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pricing'],
    queryFn: () => api.get('/settings/pricing').then((r) => r.data.data),
  })

  useEffect(() => {
    if (data && !form) setForm({ ...data })
  }, [data])

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/settings/admin', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Pricing</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set subscription plan prices and boost tier rates. Changes take effect immediately.
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: '#B81365' }}
        >
          {saved
            ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
            : saveMutation.isPending
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Subscription Plans */}
      <Card icon={Crown} title="Subscription Plans" color="#B81365">
        {/* Free — locked */}
        <div className="rounded-xl p-4" style={{ background: '#f9f8f6', border: '1px dashed #e2dfd9' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-500">Free Plan</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#f3f4f6', color: '#6b7280' }}>
              Always free
            </span>
          </div>
          <p className="text-xs text-gray-400">GHS 0 — cannot be changed. All users start here.</p>
        </div>

        {/* Pro */}
        <div className="rounded-xl p-4" style={{ background: '#fdf2f5', border: '1px solid #f9ccd9' }}>
          <p className="text-xs font-bold text-[#B81365] mb-3 uppercase tracking-wide">Pro Seller</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly Price" value={form.price_plan_pro} onChange={set('price_plan_pro')} min={0} />
            <Field label="Listings / Month" prefix="#" value={form.limit_plan_pro_listings} onChange={set('limit_plan_pro_listings')} hint="Max listings a Pro seller can post per month" min={1} />
            <Field label="Photos / Listing" prefix="#" value={form.limit_plan_pro_photos} onChange={set('limit_plan_pro_photos')} min={1} />
            <Field label="Free Boost Credits" prefix="#" value={form.limit_plan_pro_credits} onChange={set('limit_plan_pro_credits')} min={0} />
          </div>
        </div>

        {/* Business */}
        <div className="rounded-xl p-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <p className="text-xs font-bold text-orange-700 mb-3 uppercase tracking-wide">Business</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly Price" value={form.price_plan_business} onChange={set('price_plan_business')} min={0} />
            <div className="flex items-end">
              <p className="text-xs text-gray-400">Business always gets <strong>unlimited listings</strong>. Only photos and credits are configurable.</p>
            </div>
            <Field label="Photos / Listing" prefix="#" value={form.limit_plan_biz_photos} onChange={set('limit_plan_biz_photos')} min={1} />
            <Field label="Free Boost Credits" prefix="#" value={form.limit_plan_biz_credits} onChange={set('limit_plan_biz_credits')} min={0} />
          </div>
        </div>
      </Card>

      {/* Boost Tiers */}
      <Card icon={Zap} title="Boost Tiers" color="#7e22ce">
        <p className="text-xs text-gray-400 -mt-2">
          One-time fees sellers pay to promote a listing above organic results.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {/* Featured */}
          <div className="rounded-xl p-4" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
            <p className="text-xs font-bold text-purple-700 mb-3 uppercase tracking-wide">Featured</p>
            <Field label="Price" value={form.price_boost_featured} onChange={set('price_boost_featured')} min={0} />
            <p className="text-[10px] text-purple-400 mt-2">Appears in Featured section on browse</p>
          </div>

          {/* Spotlight */}
          <div className="rounded-xl p-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <p className="text-xs font-bold text-orange-700 mb-3 uppercase tracking-wide">Spotlight</p>
            <Field label="Price" value={form.price_boost_spotlight} onChange={set('price_boost_spotlight')} min={0} />
            <p className="text-[10px] text-orange-400 mt-2">Pinned to top of category results</p>
          </div>

          {/* Top */}
          <div className="rounded-xl p-4" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
            <p className="text-xs font-bold text-yellow-700 mb-3 uppercase tracking-wide">Top Ad</p>
            <Field label="Price" value={form.price_boost_top} onChange={set('price_boost_top')} min={0} />
            <p className="text-[10px] text-yellow-500 mt-2">Highest priority — homepage + search</p>
          </div>
        </div>
      </Card>

      {/* Info note */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <DollarSign className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Prices are stored in your site settings and read live by the subscriptions API. Existing subscribers keep their current plan until renewal — no retroactive changes.
          Boost prices are shown to sellers at checkout. Update them here and they reflect immediately.
        </p>
      </div>
    </div>
  )
}
