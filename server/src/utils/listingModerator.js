const prisma = require('./prisma')

// ── Auto-approve window (minutes) ────────────────────────────────────
const AUTO_APPROVE_MINUTES = 30

// ── Prohibited / suspicious keyword lists ────────────────────────────
const PROHIBITED_KEYWORDS = [
  'cocaine', 'heroin', 'marijuana', 'weed', 'drug', 'pistol', 'rifle',
  'gun for sale', 'ak47', 'ammunition', 'ammo', 'explosives', 'bomb',
  'fake id', 'forged', 'stolen', 'hacked account', 'money laundering',
]

const SCAM_KEYWORDS = [
  'send money first', 'western union', 'moneygram', 'pay before viewing',
  'overseas seller', 'god bless', 'in jesus name', 'ship to you',
  'bitcoin payment only', 'transfer fee', 'delivery agent',
  'whatsapp only', 'no calls', 'trust me', 'very urgent',
]

const SUSPICIOUS_PRICE_BY_CATEGORY = {
  vehicles:    { min: 500,   max: 2000000 },
  property:    { min: 1000,  max: 50000000 },
  electronics: { min: 10,    max: 500000 },
  phones:      { min: 10,    max: 100000 },
  appliances:  { min: 50,    max: 200000 },
  fashion:     { min: 1,     max: 50000 },
  furniture:   { min: 20,    max: 300000 },
  agriculture: { min: 1,     max: 500000 },
}

// ── Run all rules against a listing ──────────────────────────────────
async function moderateListing({ title, description, price, category_slug, images, user_id, created_at }) {
  const flags = []
  const text  = `${title} ${description || ''}`.toLowerCase()

  // Rule 1: Prohibited items
  const hitProhibited = PROHIBITED_KEYWORDS.find((kw) => text.includes(kw))
  if (hitProhibited) {
    flags.push({
      rule:        'prohibited_item',
      label:       'Prohibited Item',
      description: `Keyword detected: "${hitProhibited}"`,
      severity:    'high',
    })
  }

  // Rule 2: Scam indicators
  const hitScam = SCAM_KEYWORDS.find((kw) => text.includes(kw))
  if (hitScam) {
    flags.push({
      rule:        'scam_indicator',
      label:       'Scam Indicator',
      description: `Suspicious phrase detected: "${hitScam}"`,
      severity:    'high',
    })
  }

  // Rule 3: Zero or negative price
  if (price <= 0) {
    flags.push({
      rule:        'zero_price',
      label:       'Zero / Negative Price',
      description: `Price is ${price} — likely a data entry error or attempt to hide real price`,
      severity:    'medium',
    })
  }

  // Rule 4: Suspiciously low price for category
  const priceRange = SUSPICIOUS_PRICE_BY_CATEGORY[category_slug]
  if (priceRange && (price < priceRange.min || price > priceRange.max)) {
    flags.push({
      rule:        'suspicious_price',
      label:       'Suspicious Price',
      description: `GHS ${price?.toLocaleString()} is outside the expected range for ${category_slug} (GHS ${priceRange.min.toLocaleString()}–${priceRange.max.toLocaleString()})`,
      severity:    'medium',
    })
  }

  // Rule 5: No images
  if (!images || images.length === 0) {
    flags.push({
      rule:        'no_images',
      label:       'No Images',
      description: 'Listings without images get significantly fewer inquiries and may indicate low-quality posts',
      severity:    'low',
    })
  }

  // Rule 6: New account bulk posting (< 7 days old, > 3 listings today)
  if (user_id) {
    const accountAge = (Date.now() - new Date(created_at || Date.now()).getTime()) / 86400000
    if (accountAge < 7) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayCount = await prisma.listing.count({
        where: { user_id, created_at: { gte: today } },
      })
      if (todayCount >= 3) {
        flags.push({
          rule:        'new_account_spam',
          label:       'New Account Bulk Post',
          description: `Account is ${Math.floor(accountAge)} day(s) old and has posted ${todayCount} listings today`,
          severity:    'high',
        })
      }
    }
  }

  // Rule 7: Duplicate title (same user, same title in last 24h)
  if (user_id) {
    const yesterday = new Date(Date.now() - 86400000)
    const duplicate = await prisma.listing.findFirst({
      where: {
        user_id,
        title: { equals: title, mode: 'insensitive' },
        created_at: { gte: yesterday },
      },
      select: { id: true },
    })
    if (duplicate) {
      flags.push({
        rule:        'duplicate_title',
        label:       'Duplicate Listing',
        description: `Identical title posted by the same seller within the last 24 hours`,
        severity:    'medium',
      })
    }
  }

  const is_flagged       = flags.length > 0
  const auto_approve_at  = new Date(Date.now() + AUTO_APPROVE_MINUTES * 60 * 1000)

  return { is_flagged, flag_reasons: is_flagged ? flags : null, auto_approve_at }
}

module.exports = { moderateListing, AUTO_APPROVE_MINUTES }
