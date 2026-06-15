import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone, Users, UserX, UserPlus, ShieldOff,
  Download, Send, Search, SlidersHorizontal, X,
  CheckCircle, AlertCircle, Crown, Phone, Mail,
  TrendingUp, ChevronDown,
} from 'lucide-react'
import api from '../../services/api'

const SEGMENTS = [
  {
    id: 'free_sellers',
    label: 'Free Sellers',
    desc: 'On free plan with at least 1 listing — prime upsell targets',
    icon: Crown,
    color: '#B81365',
    bg: '#fdf2f5',
    actionHint: 'Pitch Pro plan benefits',
  },
  {
    id: 'inactive',
    label: 'Inactive Users',
    desc: 'Registered 30+ days ago with zero listings — need activation',
    icon: UserX,
    color: '#c2410c',
    bg: '#fff7ed',
    actionHint: 'Re-engagement campaign',
  },
  {
    id: 'new_users',
    label: 'New Signups',
    desc: 'Joined in the last 7 days — onboard them fast',
    icon: UserPlus,
    color: '#1d4ed8',
    bg: '#eff6ff',
    actionHint: 'Welcome + first listing nudge',
  },
  {
    id: 'unverified_sellers',
    label: 'Unverified Sellers',
    desc: "Have active listings but haven't verified their ID",
    icon: ShieldOff,
    color: '#7e22ce',
    bg: '#f5f3ff',
    actionHint: 'Push ID verification',
  },
]

const SORT_OPTIONS = [
  { value: 'listings', label: 'Most Listings' },
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
]

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function Marketing() {
  const [activeSegment, setActiveSegment] = useState('free_sellers')
  const [minListings, setMinListings] = useState('')
  const [sort, setSort] = useState('listings')
  const [days, setDays] = useState(30)
  const [search, setSearch] = useState('')
  const [showCampaign, setShowCampaign] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [campaignBody, setCampaignBody] = useState('')
  const [campaignLink, setCampaignLink] = useState('')
  const [sentResult, setSentResult] = useState(null)
  const queryClient = useQueryClient()

  const seg = SEGMENTS.find((s) => s.id === activeSegment)

  // Segment counts
  const { data: counts } = useQuery({
    queryKey: ['admin', 'marketing', 'segments'],
    queryFn: () => api.get('/admin/marketing/segments').then((r) => r.data.data),
    refetchInterval: 60000,
  })

  // Leads for active segment
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['admin', 'marketing', 'leads', activeSegment, minListings, sort, days],
    queryFn: () =>
      api.get('/admin/marketing/leads', {
        params: { segment: activeSegment, min_listings: minListings || 0, sort, days, limit: 200 },
      }).then((r) => r.data),
    keepPreviousData: true,
  })

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post('/admin/marketing/notify', {
        segment: activeSegment,
        min_listings: minListings || 0,
        days,
        title: campaignTitle,
        body: campaignBody,
        link: campaignLink || undefined,
      }).then((r) => r.data),
    onSuccess: (data) => {
      setSentResult(data)
      setCampaignTitle('')
      setCampaignBody('')
      setCampaignLink('')
    },
  })

  const allLeads = leadsData?.data || []
  const filtered = search
    ? allLeads.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
      )
    : allLeads

  function exportCSV() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Listings', 'Plan', 'ID Verified', 'Phone Verified', 'Joined'],
      ...filtered.map((u) => [
        `"${(u.name || '').replace(/"/g, '""')}"`,
        u.email || '',
        u.phone || '',
        u.listing_count,
        u.subscription_tier,
        u.id_verified ? 'Yes' : 'No',
        u.phone_verified ? 'Yes' : 'No',
        new Date(u.created_at).toISOString().slice(0, 10),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `hoova-${activeSegment}-leads-${new Date().toISOString().slice(0, 10)}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const defaultMessages = {
    free_sellers: { title: '🚀 Unlock more with Hoova Pro', body: 'You\'ve been selling on Hoova — go Pro to list more items, get a Promoted badge, and stand out from the crowd. First month offer inside.' },
    inactive: { title: '👋 Your buyers are waiting on Hoova', body: 'You\'re registered on Hoova but haven\'t listed anything yet. It takes 2 minutes — post your first item today and reach thousands of buyers in Ghana.' },
    new_users: { title: '🎉 Welcome to Hoova — let\'s get you started', body: 'Thanks for joining! Post your first listing today and start reaching buyers across Ghana. It\'s free and takes 2 minutes.' },
    unverified_sellers: { title: '✅ Verify your ID to sell with confidence', body: 'Your listings are live! Verify your ID to earn a Verified Seller badge — buyers trust verified sellers 3× more.' },
  }

  function prefill() {
    const msg = defaultMessages[activeSegment]
    setCampaignTitle(msg.title)
    setCampaignBody(msg.body)
  }

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}>
            Marketing
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Segment your users, export leads, and send targeted campaigns.</p>
        </div>
        <button
          onClick={() => { setShowCampaign(true); setSentResult(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: '#B81365' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#9e1057'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#B81365'}
        >
          <Send className="w-4 h-4" />
          Send Campaign
        </button>
      </div>

      {/* Segment cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SEGMENTS.map((s) => {
          const Icon = s.icon
          const count = counts?.[s.id] ?? '—'
          const isActive = activeSegment === s.id
          return (
            <button
              key={s.id}
              onClick={() => { setActiveSegment(s.id); setSearch(''); setMinListings('') }}
              className="text-left rounded-2xl p-4 transition-all"
              style={{
                background: isActive ? s.bg : 'white',
                border: isActive ? `2px solid ${s.color}` : '1px solid #f0eeeb',
                boxShadow: isActive ? `0 0 0 3px ${s.color}22` : 'none',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color: s.color }}>
                  {count}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-800">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Lead table */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #f0eeeb' }}>

        {/* Toolbar */}
        <div className="px-4 pt-4 pb-3 flex flex-wrap items-center gap-2" style={{ borderBottom: '1px solid #f5f4f2' }}>
          {/* Segment label */}
          <div className="flex items-center gap-2 mr-2">
            {(() => { const Icon = seg.icon; return <Icon className="w-4 h-4" style={{ color: seg.color }} /> })()}
            <span className="text-sm font-bold text-gray-800">{seg.label}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: seg.bg, color: seg.color }}>
              {filtered.length} leads
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none bg-white"
              style={{ border: '1px solid #e5e7eb' }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input type="number" value={minListings} onChange={(e) => setMinListings(e.target.value)}
              placeholder="Min listings"
              className="w-24 text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none"
              style={{ border: '1px solid #e5e7eb' }} />
            {(activeSegment === 'inactive' || activeSegment === 'new_users') && (
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none bg-white"
                style={{ border: '1px solid #e5e7eb' }}>
                {[7,14,30,60,90].map((d) => <option key={d} value={d}>Last {d}d</option>)}
              </select>
            )}
          </div>

          {/* Actions */}
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40"
            style={{ background: '#dcfce7', color: '#15803d' }}>
            <Download className="w-3 h-3" />
            Export CSV
          </button>
          <button
            onClick={() => { setShowCampaign(true); setSentResult(null); prefill() }}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40"
            style={{ background: '#fdf2f5', color: '#B81365' }}>
            <Send className="w-3 h-3" />
            Send to {filtered.length}
          </button>
        </div>

        {/* Hint */}
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: seg.bg, borderBottom: '1px solid #f0eeeb' }}>
          <TrendingUp className="w-3 h-3 shrink-0" style={{ color: seg.color }} />
          <p className="text-[10px] font-semibold" style={{ color: seg.color }}>
            Campaign idea: <span className="font-normal">{seg.actionHint}</span>
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#B81365', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">No leads in this segment</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fafaf9', borderBottom: '1px solid #f0eeeb' }}>
                  {['#', 'User', 'Email', 'Phone', 'Plan', 'Listings', 'Verified', 'Joined'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f5f4f2' : 'none' }}>
                    <td className="px-4 py-3 text-xs font-black text-gray-300">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                          style={{ background: seg.color }}>
                          {u.avatar
                            ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            : u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-28">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3 shrink-0 text-gray-300" />
                        {u.email || <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3 shrink-0 text-gray-300" />
                        {u.phone || <span className="text-gray-300">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: u.subscription_tier === 'pro' ? '#fdf2f5' : u.subscription_tier === 'business' ? '#fff7ed' : '#f3f4f6',
                          color: u.subscription_tier === 'pro' ? '#B81365' : u.subscription_tier === 'business' ? '#c2410c' : '#6b7280',
                        }}>
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-black" style={{ fontFamily: "'Poppins', sans-serif", color: u.listing_count > 0 ? '#B81365' : '#9ca3af' }}>
                        {u.listing_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.id_verified
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <AlertCircle className="w-3.5 h-3.5 text-gray-300" />}
                        {u.phone_verified
                          ? <Phone className="w-3 h-3 text-green-500" />
                          : <Phone className="w-3 h-3 text-gray-300" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign modal */}
      {showCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" style={{ border: '1px solid #f0eeeb' }}>
            <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f0eeeb' }}>
              <div>
                <p className="text-sm font-black text-gray-900">Send Notification Campaign</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  To: <strong style={{ color: seg.color }}>{seg.label}</strong> · {filtered.length} users
                </p>
              </div>
              <button onClick={() => { setShowCampaign(false); setSentResult(null) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {sentResult ? (
              <div className="px-6 py-10 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-lg font-black text-gray-900">Campaign sent!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Notification delivered to <strong>{sentResult.sent}</strong> users in the {seg.label} segment.
                </p>
                <button onClick={() => { setShowCampaign(false); setSentResult(null) }}
                  className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#B81365' }}>
                  Done
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div className="flex justify-end">
                  <button onClick={prefill}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                    style={{ background: seg.bg, color: seg.color }}>
                    ✨ Use suggested message
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Notification Title</label>
                  <input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="e.g. 🚀 Unlock more with Hoova Pro"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid #e5e7eb' }} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Message Body</label>
                  <textarea value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)}
                    placeholder="Write your message here…"
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                    style={{ border: '1px solid #e5e7eb' }} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Link (optional)</label>
                  <input value={campaignLink} onChange={(e) => setCampaignLink(e.target.value)}
                    placeholder="/pricing or /post"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid #e5e7eb' }} />
                </div>

                <div className="pt-1 flex gap-3">
                  <button onClick={() => setShowCampaign(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid #e5e7eb' }}>
                    Cancel
                  </button>
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={!campaignTitle || !campaignBody || sendMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: '#B81365' }}>
                    {sendMutation.isPending ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send to {filtered.length} users</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
