import SEO from '../../components/seo/SEO'

const LAST_UPDATED = 'June 2025'

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO
        title="Terms of Service"
        description="HOOVA Ghana Terms of Service — rules for buyers and sellers on Ghana's #1 classifieds marketplace."
        url="/terms"
        noindex={false}
      />

      <h1 className="text-2xl font-black text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
        Terms of Service
      </h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-6">

        <Section title="1. Acceptance">
          By accessing or using hoova.com.gh you agree to these Terms. If you do not agree, do not use the platform.
        </Section>

        <Section title="2. Eligibility">
          You must be at least 18 years old and capable of entering into a binding contract under Ghanaian law.
          Business sellers must be legally registered in Ghana.
        </Section>

        <Section title="3. Your Account">
          You are responsible for all activity under your account. Keep your password secure. Notify us immediately at{' '}
          <a href="mailto:hello@hoova.com.gh" className="text-[#B81365]">hello@hoova.com.gh</a> if you suspect unauthorised access.
        </Section>

        <Section title="4. Listing Rules">
          You may not list:
          <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-gray-600">
            <li>Stolen or counterfeit goods.</li>
            <li>Illegal weapons, drugs, or controlled substances.</li>
            <li>Items that infringe intellectual property rights.</li>
            <li>Human trafficking or exploitative services.</li>
            <li>Fake, misleading, or duplicate listings.</li>
            <li>Any item prohibited under Ghanaian law.</li>
          </ul>
          Violations result in immediate listing removal and account suspension.
        </Section>

        <Section title="5. Transactions">
          HOOVA Ghana is a marketplace platform. We do not participate in, guarantee, or take responsibility for
          transactions between buyers and sellers. All disputes are between the parties involved.
          <strong> Never send money before inspecting an item.</strong>
        </Section>

        <Section title="6. Fees">
          Posting standard ads is free. Spotlight and Featured boosts, and Seller Intelligence subscriptions,
          are paid services. Prices are displayed in GHS at the time of purchase. All fees are non-refundable
          unless required by Ghanaian consumer law.
        </Section>

        <Section title="7. Content Ownership">
          You retain ownership of photos and descriptions you post. You grant HOOVA Ghana a worldwide,
          royalty-free licence to display and promote your listings on the platform and in search engine results.
        </Section>

        <Section title="8. Prohibited Conduct">
          You may not: scrape the platform, send spam or unsolicited messages, circumvent safety features,
          or attempt to defraud other users.
        </Section>

        <Section title="9. Limitation of Liability">
          To the fullest extent permitted by Ghanaian law, HOOVA Ghana is not liable for any indirect, incidental,
          or consequential damages arising from your use of the platform.
        </Section>

        <Section title="10. Governing Law">
          These Terms are governed by the laws of the Republic of Ghana. Disputes shall be resolved in
          the courts of Ghana.
        </Section>

        <Section title="11. Contact">
          HOOVA Ghana · Accra, Greater Accra, Ghana ·{' '}
          <a href="mailto:hello@hoova.com.gh" className="text-[#B81365]">hello@hoova.com.gh</a>
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
