const prisma = require('./prisma')

// ─── Score components ────────────────────────────────────────────

// Listings decay to ~50% of their score after 21 days
function freshness(createdAt) {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86400000
  return Math.exp(-ageDays / 21)
}

// Paid boost multiplier — only applied while boost is active
function boostMultiplier(tier, endsAt) {
  if (!tier) return 1.0
  if (endsAt && new Date(endsAt) < new Date()) return 1.0
  return { featured: 1.5, spotlight: 2.5, top: 4.0 }[tier] || 1.0
}

// How complete and trustworthy the listing looks (0–35)
function qualityScore(listing, imageCount) {
  let s = 0
  s += Math.min(imageCount * 5, 20) // up to 20 pts for 4+ photos
  const dl = listing.description?.length || 0
  if (dl > 300) s += 10
  else if (dl > 100) s += 5
  if (listing.category_id) s += 3
  if (listing.city) s += 2
  return s
}

// Buyer interest signals — log-scaled so viral listings don't dominate (0–~55)
function engagementScore(views, saves, convos) {
  return (
    Math.log10(Math.max(views, 0) + 1) * 8 + // max ~16 at 10M views
    Math.min(saves * 5, 20) +
    Math.min(convos * 8, 24)
  )
}

// Seller reputation signals (0–20)
function sellerScore(seller) {
  if (!seller) return 0
  let s = 0
  if (seller.id_verified) s += 10
  if (seller.rating_avg >= 4) s += 5
  if (seller.review_count > 3) s += 3
  const ageDays = (Date.now() - new Date(seller.created_at).getTime()) / 86400000
  if (ageDays > 30) s += 2
  return s
}

function computeScore(listing) {
  const { _count, seller } = listing
  const base =
    qualityScore(listing, _count.images) +
    engagementScore(listing.views_count, _count.saves, _count.conversations) +
    sellerScore(seller)

  return parseFloat(
    (base * freshness(listing.created_at) * boostMultiplier(listing.boost_tier, listing.boost_ends_at)).toFixed(4)
  )
}

// ─── Public API ──────────────────────────────────────────────────

const INCLUDE = {
  where: { status: 'active' },
  select: {
    id: true, created_at: true, description: true,
    category_id: true, city: true, views_count: true,
    boost_tier: true, boost_ends_at: true,
    seller: { select: { id_verified: true, rating_avg: true, review_count: true, created_at: true } },
    _count: { select: { images: true, saves: true, conversations: true } },
  },
}

async function updateAllScores() {
  const listings = await prisma.listing.findMany(INCLUDE)

  for (let i = 0; i < listings.length; i += 50) {
    await Promise.all(
      listings.slice(i, i + 50).map((l) =>
        prisma.listing.update({ where: { id: l.id }, data: { score: computeScore(l) } })
      )
    )
  }
  console.log(`[scoreEngine] scored ${listings.length} listings`)
}

async function updateOneScore(listingId) {
  const l = await prisma.listing.findUnique({ where: { id: listingId }, ...INCLUDE })
  if (!l || l.status !== 'active') return
  await prisma.listing.update({ where: { id: listingId }, data: { score: computeScore(l) } })
}

module.exports = { updateAllScores, updateOneScore }
