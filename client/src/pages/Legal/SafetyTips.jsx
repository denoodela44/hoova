import { ShieldCheck, AlertTriangle, MapPin, Phone, CreditCard, Eye } from 'lucide-react'
import SEO from '../../components/seo/SEO'

const TIPS = [
  {
    icon: <MapPin className="w-5 h-5" style={{ color: '#B81365' }} />,
    title: 'Meet in a public place',
    body: 'Always meet at a busy, well-lit location — a shopping mall, bank forecourt, or police station. Never agree to meet at a private home for a first meeting.',
  },
  {
    icon: <Eye className="w-5 h-5" style={{ color: '#B81365' }} />,
    title: 'Inspect before you pay',
    body: 'Test electronics, start vehicles, and verify documents before handing over any money. A genuine seller will always allow inspection.',
  },
  {
    icon: <CreditCard className="w-5 h-5" style={{ color: '#B81365' }} />,
    title: 'Never pay upfront remotely',
    body: 'Do not send mobile money (MTN MoMo, Telecel Cash, AirtelTigo Money) to "hold" or "reserve" an item you haven\'t seen. This is the most common scam in Ghana.',
  },
  {
    icon: <Phone className="w-5 h-5" style={{ color: '#B81365' }} />,
    title: 'Use in-app chat',
    body: 'Keep conversations on the HOOVA platform. Scammers often try to move communication to WhatsApp or SMS to avoid detection.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    title: 'Too-good-to-be-true prices',
    body: 'If a brand-new iPhone 15 Pro is listed for GHS 500 or a car for GHS 2,000, it is almost certainly a scam. Compare prices on HOOVA before buying.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
    title: 'Check seller trust signals',
    body: 'Look for Ghana Card Verified badges, positive reviews, and account age. New accounts with no reviews and no verification warrant extra caution.',
  },
]

const SCAM_TYPES = [
  { name: 'Advance fee', desc: 'Seller asks for a deposit or fee before you can see the item. Always a scam.' },
  { name: 'Fake photos', desc: 'Photos stolen from the internet. Reverse image search on Google to verify.' },
  { name: 'Overpayment cheque', desc: 'Buyer sends a cheque for more than the price, asks for change. Cheque bounces after you send money.' },
  { name: 'Fake escrow', desc: 'Scammer claims to use HOOVA escrow. HOOVA does not currently offer escrow — do not trust such claims.' },
  { name: 'Urgency pressure', desc: '"I have 3 other buyers" — scammers create artificial urgency to prevent you from thinking clearly.' },
]

const safetySchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: TIPS.map((t) => ({
    '@type': 'Question',
    name: t.title,
    acceptedAnswer: { '@type': 'Answer', text: t.body },
  })),
}

export default function SafetyTips() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO
        title="Safety Tips — Buy and Sell Safely in Ghana"
        description="How to avoid scams on HOOVA Ghana. Tips for safe buying and selling — never pay upfront, meet in public, check seller trust signals."
        url="/safety"
        keywords="avoid scams Ghana, safe buying Ghana, online marketplace safety, MoMo scam Ghana, classifieds safety tips"
      />
      <script type="application/ld+json">{JSON.stringify(safetySchema)}</script>

      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-7 h-7 shrink-0" style={{ color: '#B81365' }} />
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Safety Tips
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-10">
        HOOVA Ghana is committed to keeping buyers and sellers safe. Read these tips before your first transaction.
      </p>

      {/* Tips grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {TIPS.map((tip) => (
          <div key={tip.title} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                {tip.icon}
              </div>
              <h2 className="font-bold text-sm text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {tip.title}
              </h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{tip.body}</p>
          </div>
        ))}
      </div>

      {/* Common scams */}
      <h2 className="text-lg font-black text-gray-900 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Common Scams to Watch For
      </h2>
      <div className="space-y-3 mb-10">
        {SCAM_TYPES.map((s) => (
          <div key={s.name} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#fdf2f5', border: '1px solid #F8C0C8' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B81365' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#B81365' }}>{s.name}</p>
              <p className="text-sm text-gray-600 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report CTA */}
      <div className="rounded-2xl px-6 py-5 text-center" style={{ background: '#B81365' }}>
        <p className="text-white font-black text-base mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Spotted a scam?
        </p>
        <p className="text-pink-100 text-sm mb-4">
          Report suspicious listings using the "Report listing" button on any ad. Our team reviews reports within 24 hours.
        </p>
        <a
          href="mailto:safety@hoova.com.gh"
          className="inline-flex items-center gap-2 bg-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ color: '#B81365' }}
        >
          <ShieldCheck className="w-4 h-4" />
          Email safety@hoova.com.gh
        </a>
      </div>
    </div>
  )
}
