const prisma = require('./prisma')

// ── Category auto-detection ────────────────────────────────────
const CATEGORY_MAP = {
  vehicles:     ['car', 'toyota', 'honda', 'nissan', 'hyundai', 'kia', 'ford', 'mercedes', 'bmw', 'lexus', 'truck', 'suv', 'pickup', 'bus', 'motorbike', 'motorcycle', 'bike', 'tyre', 'engine', 'vehicle', 'corolla', 'highlander', 'prado', 'rav4', 'fortuner'],
  electronics:  ['iphone', 'samsung', 'laptop', 'phone', 'tv', 'television', 'macbook', 'computer', 'tablet', 'ipad', 'ps5', 'playstation', 'xbox', 'headphone', 'speaker', 'camera', 'printer', 'router', 'generator', 'inverter', 'solar', 'fridge', 'washing machine', 'ac', 'air condition'],
  'real-estate':['house', 'apartment', 'bedroom', 'land', 'plot', 'flat', 'room', 'office', 'shop', 'estate', 'bungalow', 'mansion', 'duplex', 'compound', 'rent', 'lease', 'property', 'storey'],
  fashion:      ['dress', 'shoe', 'cloth', 'bag', 'shirt', 'trouser', 'jean', 'kente', 'fabric', 'sneaker', 'heel', 'sandal', 'hat', 'cap', 'jacket', 'suit', 'gown', 'skirt', 'blouse'],
  furniture:    ['sofa', 'chair', 'table', 'bed', 'desk', 'wardrobe', 'shelf', 'cabinet', 'mattress', 'drawer', 'bookshelf', 'couch', 'dining'],
  agriculture:  ['farm', 'seed', 'tractor', 'cocoa', 'crop', 'fertilizer', 'cassava', 'maize', 'poultry', 'cattle', 'fish', 'tilapia'],
  jobs:         ['job', 'vacancy', 'hiring', 'internship', 'employ', 'driver wanted', 'teacher', 'nurse', 'engineer'],
  services:     ['plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'tutor', 'mechanic', 'welder', 'tailor'],
  pets:         ['dog', 'cat', 'puppy', 'kitten', 'parrot', 'rabbit', 'fish tank', 'pet'],
  health:       ['wheelchair', 'crutch', 'medical', 'pharmacy', 'supplement', 'vitamin', 'mask'],
}

function detectCategory(query) {
  const q = query.toLowerCase()
  for (const [slug, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => q.includes(kw))) return slug
  }
  return null
}

/**
 * Normalise a raw query string into a canonical lookup key.
 * "iPhone 15 Pro!!" → "iphone 15 pro"
 */
function normaliseQuery(raw) {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim()
    .slice(0, 100)
}

/**
 * Log a search and update the aggregated SearchTrend table.
 * Fire-and-forget — never throws, never blocks the caller.
 *
 * @param {string}  rawQuery      The query as typed by the user
 * @param {number}  resultsCount  How many listings were returned
 * @param {string}  [source]      'hero' | 'navbar' | 'browse'
 * @param {string}  [userId]      Optional logged-in user ID
 * @param {string}  [categorySlug] Category context if known
 */
async function logSearch(rawQuery, resultsCount, source = 'browse', userId = null, categorySlug = null) {
  const q = (rawQuery || '').trim()
  if (!q || q.length < 2) return

  const normalised = normaliseQuery(q)
  const detectedCategory = categorySlug || detectCategory(normalised)
  const hasResults = resultsCount > 0

  // 1. Raw log entry (every search, keeps full history)
  prisma.searchLog.create({
    data: {
      query: normalised,
      user_id: userId || null,
      results_count: Number(resultsCount) || 0,
      category_slug: detectedCategory,
      source,
    },
  }).catch(() => {})

  // 2. Upsert into SearchTrend (the grouped/aggregated table)
  //    If the normalised query already exists → increment count.
  //    If not → create new row. This is the core of the grouping engine.
  prisma.searchTrend.upsert({
    where: { query: normalised },
    create: {
      query: normalised,
      display_query: q,           // preserve original capitalisation
      count: 1,
      zero_results_count: hasResults ? 0 : 1,
      category_slug: detectedCategory,
      last_searched_at: new Date(),
    },
    update: {
      count: { increment: 1 },
      zero_results_count: hasResults ? undefined : { increment: 1 },
      // Update display_query only if count is low (keep the cleanest version)
      last_searched_at: new Date(),
    },
  }).catch(() => {})
}

module.exports = { logSearch, normaliseQuery, detectCategory }
