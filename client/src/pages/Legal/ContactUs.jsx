import { useState } from 'react'
import { Mail, MessageSquare, MapPin, CheckCircle } from 'lucide-react'
import SEO from '../../components/seo/SEO'
import api from '../../services/api'

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/contact', form)
    } catch (_) {}
    setSent(true)
    setSending(false)
  }

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact HOOVA Ghana',
    url: 'https://hoova.com.gh/contact',
    description: 'Get in touch with HOOVA Ghana support team.',
    mainEntity: {
      '@type': 'Organization',
      name: 'HOOVA Ghana',
      email: 'hello@hoova.com.gh',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Accra',
        addressRegion: 'Greater Accra',
        addressCountry: 'GH',
      },
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO
        title="Contact Us"
        description="Get help from the HOOVA Ghana team. Contact us by email or WhatsApp — we respond within 24 hours."
        url="/contact"
      />
      <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>

      <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Contact Us
      </h1>
      <p className="text-sm text-gray-500 mb-10">We respond within 24 hours on business days.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Contact channels */}
        <div className="space-y-4">
          <ContactCard
            icon={<Mail className="w-5 h-5" style={{ color: '#B81365' }} />}
            title="Email"
            body="hello@hoova.com.gh"
            href="mailto:hello@hoova.com.gh"
          />
          <ContactCard
            icon={<MessageSquare className="w-5 h-5 text-green-500" />}
            title="WhatsApp"
            body="+233 XX XXX XXXX"
            href="https://wa.me/233XXXXXXXXX"
          />
          <ContactCard
            icon={<MapPin className="w-5 h-5" style={{ color: '#B81365' }} />}
            title="Office"
            body="Accra, Greater Accra, Ghana"
          />
        </div>

        {/* Contact form */}
        <div className="md:col-span-2 card p-6">
          {sent ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="font-bold text-gray-900 mb-1">Message sent!</p>
              <p className="text-sm text-gray-500">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                  <input
                    required
                    className="input"
                    placeholder="Kofi Mensah"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    className="input"
                    placeholder="kofi@email.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                <select
                  required
                  className="input"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                >
                  <option value="">Select a topic…</option>
                  <option value="account">Account issue</option>
                  <option value="listing">Listing / posting help</option>
                  <option value="scam">Report a scam</option>
                  <option value="billing">Billing / boost</option>
                  <option value="seller-intelligence">Seller Intelligence plans</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  className="input h-auto py-2.5 resize-none"
                  placeholder="Describe your issue or question…"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full"
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function ContactCard({ icon, title, body, href }) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="card p-4 flex items-start gap-3 transition-all hover:shadow-md"
    >
      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{body}</p>
      </div>
    </Tag>
  )
}
