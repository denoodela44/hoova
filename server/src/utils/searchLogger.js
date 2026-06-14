const prisma = require('./prisma')

// In-memory dedup: normalised query → timestamp of last log
// 10s window kills race conditions / double-submit without blocking real repeat searches
const recentSearchCache = new Map()
const DEDUP_MS = 10 * 1000 // 10 seconds

// Evict stale entries every 5 minutes so the Map doesn't grow forever
setInterval(() => {
  const cutoff = Date.now() - DEDUP_MS
  for (const [key, ts] of recentSearchCache) {
    if (ts < cutoff) recentSearchCache.delete(key)
  }
}, 5 * 60 * 1000)

// ── Category auto-detection ────────────────────────────────────
const CATEGORY_MAP = {
  vehicles:                ['car', 'toyota', 'honda', 'nissan', 'hyundai', 'kia', 'ford', 'mercedes', 'bmw', 'lexus', 'truck', 'suv', 'pickup', 'bus', 'motorbike', 'motorcycle', 'bike', 'tyre', 'engine', 'vehicle', 'corolla', 'highlander', 'prado', 'rav4', 'fortuner', 'tricycle'],
  'phones-tablets':        ['iphone', 'samsung', 'phone', 'mobile', 'tablet', 'ipad', 'android', 'xiaomi', 'tecno', 'infinix', 'itel', 'oppo', 'airtime', 'data bundle', 'sim card'],
  electronics:             ['laptop', 'tv', 'television', 'macbook', 'computer', 'desktop', 'ps5', 'playstation', 'xbox', 'gaming', 'headphone', 'speaker', 'camera', 'printer', 'router', 'drone', 'monitor', 'projector'],
  'home-appliances':       ['generator', 'inverter', 'solar', 'fridge', 'refrigerator', 'washing machine', 'ac', 'air condition', 'fan', 'blender', 'microwave', 'sofa', 'chair', 'table', 'bed', 'desk', 'wardrobe', 'shelf', 'cabinet', 'mattress', 'couch', 'furniture', 'home decor'],
  'real-estate':           ['house', 'apartment', 'bedroom', 'land', 'plot', 'flat', 'room', 'office', 'shop', 'estate', 'bungalow', 'mansion', 'duplex', 'compound', 'rent', 'lease', 'property', 'storey', 'airbnb', 'short stay'],
  fashion:                 ['dress', 'shoe', 'cloth', 'bag', 'shirt', 'trouser', 'jean', 'kente', 'fabric', 'sneaker', 'heel', 'sandal', 'hat', 'cap', 'jacket', 'suit', 'gown', 'skirt', 'blouse', 'bead', 'wax print', 'ankara'],
  'health-beauty':         ['skincare', 'cream', 'lotion', 'wig', 'hair', 'weave', 'lace front', 'cosmetic', 'makeup', 'perfume', 'medical', 'wheelchair', 'crutch', 'pharmacy', 'supplement', 'vitamin', 'fitness', 'gym', 'treadmill'],
  'babies-kids':           ['baby', 'toddler', 'kids', 'children', 'diaper', 'stroller', 'pram', 'toy', 'school bag', 'nursery'],
  'building-construction': ['cement', 'sand', 'iron rod', 'roofing', 'tiles', 'paint', 'plumbing', 'electrical', 'drill', 'hammer', 'scaffolding', 'aluminum', 'glass', 'door', 'window', 'building material'],
  agriculture:             ['farm', 'seed', 'tractor', 'cocoa', 'crop', 'fertilizer', 'cassava', 'maize', 'poultry', 'cattle', 'tilapia', 'fish', 'livestock', 'pepper', 'tomato', 'plantain', 'yam'],
  services:                ['plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'cleaning', 'tutor', 'mechanic', 'welder', 'tailor', 'photographer', 'driver', 'delivery', 'catering', 'fumigation', 'event'],
  jobs:                    ['job', 'vacancy', 'hiring', 'internship', 'employ', 'wanted', 'teacher', 'nurse', 'engineer', 'accountant', 'full time', 'part time', 'freelance'],
  sports:                  ['football', 'jersey', 'gym equipment', 'dumbbell', 'bicycle', 'tennis', 'basketball', 'sport', 'guitar', 'keyboard instrument', 'drum', 'trumpet', 'musical'],
  pets:                    ['dog', 'cat', 'puppy', 'kitten', 'parrot', 'rabbit', 'fish tank', 'pet', 'bird', 'aquarium'],
  food:                    ['food', 'drink', 'beverage', 'snack', 'juice', 'wine', 'beer', 'packaged', 'grocery', 'bread', 'rice', 'cooking oil'],
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

  // Deduplication: atomic in-memory check (no await between get+set, so no race condition)
  const lastLogged = recentSearchCache.get(normalised)
  if (lastLogged && Date.now() - lastLogged < DEDUP_MS) return
  recentSearchCache.set(normalised, Date.now())

  // 1. Raw log entry (every search, keeps full history)
  prisma.searchLog.create({
    data: {
      query: normalised,
      user_id: userId || null,
      results_count: Number(resultsCount) || 0,
      category_slug: detectedCategory,
      source,
    },
  }).catch((e) => console.error('[searchLogger] searchLog.create failed:', e.message))

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
      last_searched_at: new Date(),
    },
  }).catch((e) => console.error('[searchLogger] searchTrend.upsert failed:', e.message))
}

module.exports = { logSearch, normaliseQuery, detectCategory }
