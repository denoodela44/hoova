const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const CATEGORY_MAP = {
  adults:                  ['sex toy', 'adult toy', 'rose toy', 'vibrator', 'dildo', 'womanizer', 'fleshlight', 'lingerie', 'butt plug', 'handcuff', 'bondage', 'lubricant', 'lube', 'condom', 'intimate', 'bdsm'],
  vehicles:                ['car', 'toyota', 'honda', 'nissan', 'hyundai', 'kia', 'ford', 'mercedes', 'bmw', 'lexus', 'truck', 'suv', 'pickup', 'bus', 'motorbike', 'motorcycle', 'bike', 'tyre', 'engine', 'vehicle', 'corolla', 'highlander', 'prado', 'rav4', 'fortuner', 'tricycle'],
  'phones-tablets':        ['iphone', 'samsung', 'phone', 'mobile', 'tablet', 'ipad', 'android', 'xiaomi', 'tecno', 'infinix', 'itel', 'oppo', 'airtime', 'data bundle', 'sim card'],
  electronics:             ['laptop', 'tv', 'television', 'macbook', 'computer', 'desktop', 'ps5', 'playstation', 'xbox', 'gaming', 'headphone', 'speaker', 'camera', 'printer', 'router', 'drone', 'monitor', 'projector'],
  'home-appliances':       ['generator', 'inverter', 'solar', 'fridge', 'refrigerator', 'washing machine', 'ac', 'air condition', 'fan', 'blender', 'microwave', 'sofa', 'chair', 'table', 'bed', 'desk', 'wardrobe', 'shelf', 'cabinet', 'mattress', 'couch', 'home decor'],
  furniture:               ['furniture', 'sofa set', 'dining set', 'lounge'],
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

function parseVolume(raw) {
  if (!raw) return 10
  const s = raw.toString().replace(/[+/mo\s]/gi, '')
  const lower = s.toLowerCase()
  if (lower.endsWith('k')) return Math.floor(parseFloat(lower) * 1000)
  return parseInt(s, 10) || 10
}

function scaleCount(volume) {
  if (volume >= 10000) return Math.floor(volume / 70) + Math.floor(Math.random() * 30)
  if (volume >= 5000)  return Math.floor(volume / 50) + Math.floor(Math.random() * 20)
  if (volume >= 1000)  return Math.floor(volume / 20) + Math.floor(Math.random() * 10)
  return Math.max(2, Math.floor(volume / 10) + Math.floor(Math.random() * 5))
}

function randomDate(from, to) {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim())
  return lines.slice(1).map((line) => {
    const fields = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
      else cur += ch
    }
    fields.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, (fields[i] || '').replace(/"/g, '')]))
  })
}

async function main() {
  const CSV_PATH = path.resolve(__dirname, '../../../../niches_cleaned.csv')
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV not found at:', CSV_PATH)
    console.error('   Copy niches_cleaned.csv to:', CSV_PATH)
    process.exit(1)
  }

  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'))
  console.log(`📊 Loaded ${rows.length} rows from CSV`)

  const APR_START = new Date('2025-04-01')
  const MAY_END   = new Date('2025-05-31T23:59:59')

  let seeded = 0, skipped = 0

  // ── 1. Seed SearchTrend entries ────────────────────────────────────
  for (const row of rows) {
    const name = (row.name || '').trim().toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
    if (!name || name.length < 2) { skipped++; continue }

    const rawVol     = parseVolume(row.volume)
    const count      = scaleCount(rawVol)
    const catSlug    = detectCategory(name)
    const searchedAt = randomDate(APR_START, MAY_END)
    const displayQ   = (row.name || '').trim().slice(0, 100)

    try {
      await prisma.searchTrend.upsert({
        where: { query: name },
        create: {
          query: name,
          display_query: displayQ || name,
          count,
          zero_results_count: 0,
          category_slug: catSlug,
          last_searched_at: searchedAt,
        },
        update: {
          count: { increment: count },
          last_searched_at: searchedAt,
          ...(catSlug ? { category_slug: catSlug } : {}),
        },
      })
      seeded++
    } catch {
      skipped++
    }
  }
  console.log(`✅ Seeded ${seeded} search trends (${skipped} skipped)`)

  // ── 2. Generate daily SearchLog entries for Apr–May 2025 ───────────
  console.log('📅 Generating daily search logs for April–May 2025…')

  const sampleTerms = await prisma.searchTrend.findMany({
    where: { last_searched_at: { lte: MAY_END } },
    orderBy: { count: 'desc' },
    take: 400,
    select: { query: true, category_slug: true },
  })

  if (sampleTerms.length === 0) {
    console.log('⚠️  No trend terms found — skipping log generation')
    return
  }

  const SOURCES = ['hero', 'navbar', 'browse']
  let logTotal = 0

  for (let d = 0; d < 61; d++) {
    const day = new Date('2025-04-01')
    day.setDate(day.getDate() + d)
    const dow      = day.getDay()
    const isWknd   = dow === 0 || dow === 6
    const dayCount = isWknd
      ? 70  + Math.floor(Math.random() * 40)
      : 120 + Math.floor(Math.random() * 60)

    const logs = []
    for (let i = 0; i < dayCount; i++) {
      const term = sampleTerms[Math.floor(Math.random() * Math.min(sampleTerms.length, 150))]
      const roll = Math.random()
      const hour = roll < 0.3 ? 8  + Math.random() * 3
                 : roll < 0.6 ? 17 + Math.random() * 3
                 : Math.random() * 24
      const ts   = new Date(day)
      ts.setHours(Math.floor(hour), Math.floor(Math.random() * 60), 0, 0)

      logs.push({
        query:         term.query,
        results_count: Math.floor(Math.random() * 20),
        category_slug: term.category_slug,
        source:        SOURCES[Math.floor(Math.random() * 3)],
        created_at:    ts,
      })
    }

    await prisma.searchLog.createMany({ data: logs, skipDuplicates: false })
    logTotal += logs.length
  }

  console.log(`✅ Created ${logTotal} search log entries (Apr–May 2025)`)
  console.log('🎉 Niche seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
