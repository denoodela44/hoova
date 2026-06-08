import SEO from '../../components/seo/SEO'

const LAST_UPDATED = 'June 2025'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO
        title="Privacy Policy"
        description="HOOVA Ghana Privacy Policy — how we collect, use and protect your personal data in accordance with Ghana's Data Protection Act."
        url="/privacy"
        noindex={false}
      />

      <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Privacy Policy
      </h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">

        <Section title="1. Who We Are">
          HOOVA Ghana ("HOOVA", "we", "us") operates the online classifieds marketplace at hoova.com.gh.
          We are registered in Ghana and comply with the Data Protection Act, 2012 (Act 843).
          Questions about this policy: <a href="mailto:privacy@hoova.com.gh" className="text-[#B81365]">privacy@hoova.com.gh</a>.
        </Section>

        <Section title="2. Data We Collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> name, email address, phone number, profile photo.</li>
            <li><strong>Listings:</strong> item descriptions, photos, price, location (city / region).</li>
            <li><strong>Usage data:</strong> pages visited, search queries, listing views, device type, IP address.</li>
            <li><strong>Communications:</strong> in-app messages between buyers and sellers.</li>
            <li><strong>Verification data:</strong> Ghana Card number (hashed, not stored in plain text).</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate and improve the marketplace.</li>
            <li>To verify seller identity and build trust signals.</li>
            <li>To send transactional notifications (new message, listing approved).</li>
            <li>To detect and prevent fraud and scams.</li>
            <li>To generate anonymised search analytics (which may be sold to sellers as business intelligence — no personal data is included).</li>
            <li>To comply with legal obligations in Ghana.</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          We do not sell your personal data. We share data only with:
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Cloudinary</strong> — image hosting and optimisation.</li>
            <li><strong>Google Analytics</strong> — aggregated site analytics.</li>
            <li><strong>Twilio / Africa's Talking</strong> — SMS notifications.</li>
            <li>Law enforcement when required by Ghanaian law.</li>
          </ul>
        </Section>

        <Section title="5. Your Rights">
          Under Ghana's Data Protection Act you have the right to:
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for marketing communications at any time.</li>
          </ul>
          To exercise these rights email <a href="mailto:privacy@hoova.com.gh" className="text-[#B81365]">privacy@hoova.com.gh</a>.
        </Section>

        <Section title="6. Cookies">
          We use essential cookies to keep you logged in, and analytics cookies (Google Analytics) to understand site usage.
          You can disable analytics cookies via your browser settings.
        </Section>

        <Section title="7. Data Retention">
          Active account data is retained for the life of your account plus 12 months after deletion.
          Anonymised analytics data may be retained indefinitely.
        </Section>

        <Section title="8. Children">
          HOOVA is intended for users aged 18 and above. We do not knowingly collect data from minors.
        </Section>

        <Section title="9. Changes to This Policy">
          We will notify registered users by email of material changes. Continued use after notice constitutes acceptance.
        </Section>

        <Section title="10. Contact">
          HOOVA Ghana · Accra, Greater Accra, Ghana ·{' '}
          <a href="mailto:privacy@hoova.com.gh" className="text-[#B81365]">privacy@hoova.com.gh</a>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  )
}
