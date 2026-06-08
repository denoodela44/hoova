import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings2, Code2, Palette, Save, CheckCircle2,
  Globe, BarChart3, Target, Eye, Tag, Image, Type, Share2,
} from 'lucide-react'
import api from '../../services/api'

const TRACKING_FIELDS = [
  {
    key: 'ga4_id',
    label: 'Google Analytics 4 (GA4)',
    icon: BarChart3,
    placeholder: 'G-XXXXXXXXXX',
    hint: 'Measurement ID from GA4 → Admin → Data Streams',
  },
  {
    key: 'gtm_id',
    label: 'Google Tag Manager',
    icon: Tag,
    placeholder: 'GTM-XXXXXXX',
    hint: 'Container ID — use this instead of GA4 if you manage tags via GTM',
  },
  {
    key: 'google_ads_id',
    label: 'Google Ads Conversion',
    icon: Target,
    placeholder: 'AW-XXXXXXXXXX',
    hint: 'Conversion tracking ID from Google Ads → Tools → Conversions',
  },
  {
    key: 'meta_pixel_id',
    label: 'Meta Pixel (Facebook Ads)',
    icon: Eye,
    placeholder: '1234567890123456',
    hint: 'Pixel ID from Meta Events Manager',
  },
  {
    key: 'gsc_verification',
    label: 'Google Search Console',
    icon: Globe,
    placeholder: 'google1234abcd5678efgh.html  or  content="..."',
    hint: 'Paste the full verification file name (e.g. googleXXXX.html) or the meta content value',
  },
]

const SCRIPT_FIELDS = [
  {
    key: 'custom_head_scripts',
    label: 'Custom <head> Scripts',
    hint: 'Paste as many <script>, <meta>, or <link> tags as you want — stack them one after another.',
    placeholder: `<script async src="https://..."></script>\n\n<script>\n  // second script here\n</script>\n\n<meta name="..." content="..." />`,
    rows: 8,
  },
  {
    key: 'custom_body_scripts',
    label: 'Custom <body> Scripts',
    hint: 'Stack multiple scripts here too. Injected just before </body> — good for chat widgets, heatmaps, etc.',
    placeholder: `<script>\n  // Intercom, Crisp, Hotjar, etc.\n</script>\n\n<script>\n  // another widget\n</script>`,
    rows: 8,
  },
]

const SOCIAL_FIELDS = [
  { key: 'social_facebook',  label: 'Facebook',  color: '#1877f2', placeholder: 'https://facebook.com/yourpage',      hint: 'Full URL to your Facebook page' },
  { key: 'social_instagram', label: 'Instagram', color: '#e1306c', placeholder: 'https://instagram.com/yourhandle',   hint: 'Full URL to your Instagram profile' },
  { key: 'social_tiktok',    label: 'TikTok',    color: '#010101', placeholder: 'https://tiktok.com/@yourhandle',     hint: 'Full URL to your TikTok account' },
  { key: 'social_twitter',   label: 'X (Twitter)',color: '#000000', placeholder: 'https://x.com/yourhandle',          hint: 'Full URL to your X/Twitter profile' },
  { key: 'social_youtube',   label: 'YouTube',   color: '#ff0000', placeholder: 'https://youtube.com/@yourchannel',  hint: 'Full URL to your YouTube channel' },
  { key: 'social_whatsapp',  label: 'WhatsApp',  color: '#25d366', placeholder: '+233200000000',                      hint: 'Your WhatsApp Business number with country code' },
  { key: 'social_linkedin',  label: 'LinkedIn',  color: '#0a66c2', placeholder: 'https://linkedin.com/company/hoova', hint: 'Full URL to your LinkedIn company page' },
]

const BRANDING_FIELDS = [
  { key: 'site_name',          label: 'Site Name',          icon: Type,    placeholder: 'HOOVA', hint: 'Used in page titles and OG tags' },
  { key: 'site_tagline',       label: 'Site Tagline',       icon: Type,    placeholder: "Ghana's best deals, no cap", hint: 'Short tagline shown in meta descriptions' },
  { key: 'brand_primary_color',label: 'Primary Brand Color',icon: Palette, placeholder: '#B81365', hint: 'Hex color for buttons, links, accents' },
  { key: 'brand_logo_url',     label: 'Logo URL',           icon: Image,   placeholder: 'https://...', hint: 'Full URL to your logo image (PNG/SVG)' },
  { key: 'brand_favicon_url',  label: 'Favicon URL',        icon: Image,   placeholder: 'https://...', hint: '32×32 or 64×64 PNG/ICO for browser tab' },
  { key: 'brand_og_image_url', label: 'OG Share Image',     icon: Image,   placeholder: 'https://...', hint: '1200×630 image shown when sharing on social media' },
]

export default function AdminSettings() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data: settings = {} } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/settings/admin').then((r) => r.data.data),
  })

  const [form, setForm] = useState({})

  const values = { ...settings, ...form }
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/settings/admin', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setForm({})
    },
  })

  const dirty = Object.keys(form).length > 0

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.02em' }}
          >
            Site Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tracking codes, branding, and custom scripts</p>
        </div>
        <button
          onClick={() => save()}
          disabled={!dirty || isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{ background: saved ? '#15803d' : '#B81365' }}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Tracking Codes ─────────────────────────────────────────── */}
      <Section icon={<BarChart3 className="w-4 h-4" style={{ color: '#B81365' }} />} title="Tracking & Analytics">
        <div className="space-y-4">
          {TRACKING_FIELDS.map(({ key, label, icon: Icon, placeholder, hint }) => (
            <Field key={key}>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                {label}
              </label>
              <input
                type="text"
                value={values[key] || ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm border font-mono focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e5e7eb', focusRingColor: '#B81365' }}
              />
              <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
            </Field>
          ))}
        </div>
      </Section>

      {/* ── Custom Scripts ─────────────────────────────────────────── */}
      <Section icon={<Code2 className="w-4 h-4" style={{ color: '#B81365' }} />} title="Custom Scripts">
        <div className="space-y-4">
          {SCRIPT_FIELDS.map(({ key, label, hint, placeholder, rows }) => (
            <Field key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">{label}</label>
                {values[key] && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
                    {(values[key].match(/<script/gi) || []).length + (values[key].match(/<meta/gi) || []).length} tag(s) saved
                  </span>
                )}
              </div>
              <textarea
                rows={rows}
                value={values[key] || ''}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl text-xs border font-mono leading-relaxed resize-y focus:outline-none"
                style={{ border: '1px solid #e5e7eb', background: '#fafaf9' }}
              />
              <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
            </Field>
          ))}
        </div>
      </Section>

      {/* ── Branding ───────────────────────────────────────────────── */}
      <Section icon={<Palette className="w-4 h-4" style={{ color: '#B81365' }} />} title="Branding">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BRANDING_FIELDS.map(({ key, label, icon: Icon, placeholder, hint }) => (
            <Field key={key} className={key === 'site_tagline' ? 'sm:col-span-2' : ''}>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                {label}
              </label>
              {key === 'brand_primary_color' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={values[key] || '#B81365'}
                    onChange={(e) => set(key, e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border p-0.5"
                    style={{ border: '1px solid #e5e7eb' }}
                  />
                  <input
                    type="text"
                    value={values[key] || ''}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 rounded-xl text-sm border font-mono focus:outline-none"
                    style={{ border: '1px solid #e5e7eb' }}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={values[key] || ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ border: '1px solid #e5e7eb' }}
                />
              )}
              <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
              {/* Preview for image URLs */}
              {(key === 'brand_logo_url' || key === 'brand_og_image_url' || key === 'brand_favicon_url') && values[key] && (
                <img
                  src={values[key]}
                  alt=""
                  className="mt-2 rounded-lg max-h-16 object-contain border"
                  style={{ border: '1px solid #f0eeeb' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
            </Field>
          ))}
        </div>
      </Section>

      {/* ── Social Media ───────────────────────────────────────────── */}
      <Section icon={<Share2 className="w-4 h-4" style={{ color: '#B81365' }} />} title="Social Media">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SOCIAL_FIELDS.map(({ key, label, color, placeholder, hint }) => (
            <Field key={key}>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                {label}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={values[key] || ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none pr-10"
                  style={{ border: `1px solid ${values[key] ? color + '55' : '#e5e7eb'}`, background: values[key] ? color + '08' : 'white' }}
                />
                {values[key] && (
                  <a
                    href={values[key].startsWith('http') ? values[key] : `https://wa.me/${values[key].replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    title="Open link"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
            </Field>
          ))}
        </div>

        {/* Connected platforms preview */}
        {SOCIAL_FIELDS.some(({ key }) => values[key]) && (
          <div className="mt-2 pt-4" style={{ borderTop: '1px solid #f0eeeb' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Connected</p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_FIELDS.filter(({ key }) => values[key]).map(({ key, label, color }) => (
                <span
                  key={key}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: color + '15', color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Status chips */}
      <div className="rounded-2xl p-5" style={{ background: '#ECEAE6' }}>
        <p className="text-xs font-bold text-gray-600 mb-3">Active Integrations</p>
        <div className="flex flex-wrap gap-2">
          {TRACKING_FIELDS.map(({ key, label }) =>
            values[key] ? (
              <span
                key={key}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#dcfce7', color: '#15803d' }}
              >
                <CheckCircle2 className="w-3 h-3" />
                {label}
              </span>
            ) : null
          )}
          {!TRACKING_FIELDS.some(({ key }) => values[key]) && (
            <span className="text-xs text-gray-400">No tracking codes configured yet</span>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 space-y-4" style={{ border: '1px solid #f0eeeb' }}>
      <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid #f0eeeb' }}>
        {icon}
        <p className="text-sm font-bold text-gray-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Field({ children, className = '' }) {
  return <div className={className}>{children}</div>
}
