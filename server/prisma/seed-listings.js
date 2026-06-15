const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const img = (seed, w = 600, h = 450) => `https://picsum.photos/seed/${seed}/${w}/${h}`

// ── Sellers ───────────────────────────────────────────────────────────────────
const SELLERS = [
  {
    name: 'Kwame Asante',
    email: 'kwame@hoova.test',
    phone: '+233244100001',
    bio: 'Accra-based electronics dealer. All items tested and working.',
    subscription_tier: 'pro',
    phone_verified: true,
    id_verified: true,
    rating_avg: 4.7,
    review_count: 23,
    store_slug: 'kwame-asante-electronics',
    store_name: 'Kwame Asante Electronics',
  },
  {
    name: 'Abena Mensah',
    email: 'abena@hoova.test',
    phone: '+233244100002',
    bio: 'Fashion & lifestyle. Premium quality Ankara, kente and accessories.',
    subscription_tier: 'business',
    phone_verified: true,
    id_verified: true,
    rating_avg: 4.9,
    review_count: 41,
    store_slug: 'abena-fashion-house',
    store_name: 'Abena Fashion House',
  },
  {
    name: 'Kofi Boateng',
    email: 'kofi@hoova.test',
    phone: '+233244100003',
    bio: 'Certified mechanic. Trusted car dealer in Kumasi for over 10 years.',
    subscription_tier: 'pro',
    phone_verified: true,
    id_verified: true,
    rating_avg: 4.5,
    review_count: 17,
    store_slug: 'kofi-motors',
    store_name: 'Kofi Motors Kumasi',
  },
  {
    name: 'Ama Osei',
    email: 'ama@hoova.test',
    phone: '+233244100004',
    bio: 'Real estate consultant. Residential & commercial properties in Greater Accra.',
    subscription_tier: 'business',
    phone_verified: true,
    id_verified: true,
    rating_avg: 4.8,
    review_count: 29,
    store_slug: 'ama-osei-realty',
    store_name: 'Ama Osei Realty',
  },
]

// ── Listing data by category slug ────────────────────────────────────────────
const LISTINGS = [
  // ── PHONES & TABLETS ──────────────────────────────────────────────────────
  {
    cat: 'phones-tablets', seller: 0,
    title: 'iPhone 15 Pro Max 256GB — Space Black',
    description: 'Brand new, sealed in box. Apple warranty valid. Comes with original charger and cable. Never used. Bought from iStore Accra.',
    price: 9800, condition: 'new', negotiable: false, views_count: 312, boost_tier: 'spotlight',
    location: 'East Legon',
    images: ['phone1', 'phone2', 'phone3'],
  },
  {
    cat: 'phones-tablets', seller: 0,
    title: 'Samsung Galaxy S24 Ultra — Titanium Gray',
    description: 'Used for 3 months. Excellent condition, no scratches. 512GB storage, original box and accessories included. S-Pen fully functional.',
    price: 7200, condition: 'used', negotiable: true, views_count: 198,
    location: 'Osu',
    images: ['phone3', 'phone4'],
  },
  {
    cat: 'phones-tablets', seller: 0,
    title: 'Tecno Camon 30 Pro 5G — 256GB',
    description: 'New in box. 5G-ready, 50MP triple camera, 5000mAh battery. Perfect for content creators on a budget.',
    price: 2650, condition: 'new', negotiable: false, views_count: 87,
    location: 'Madina',
    images: ['phone5', 'phone6'],
  },
  {
    cat: 'phones-tablets', seller: 0,
    title: 'iPad Pro 12.9" M2 — 256GB WiFi + Cellular',
    description: 'Barely used iPad Pro with Apple Pencil (2nd gen) and Magic Keyboard. All accessories in perfect condition.',
    price: 8500, condition: 'used', negotiable: true, views_count: 143, boost_tier: 'featured',
    location: 'Cantonments',
    images: ['tablet1', 'tablet2', 'tablet3'],
  },

  // ── LAPTOPS & PCs ─────────────────────────────────────────────────────────
  {
    cat: 'laptops-pcs', seller: 0,
    title: 'MacBook Pro 14" M3 Pro — 18GB RAM, 512GB',
    description: 'Purchased 6 months ago. Space Grey. Excellent condition, no dents or scratches. Comes with original charger. Productivity beast.',
    price: 12500, condition: 'used', negotiable: false, views_count: 267, boost_tier: 'spotlight',
    location: 'Airport Residential',
    images: ['laptop1', 'laptop2'],
  },
  {
    cat: 'laptops-pcs', seller: 0,
    title: 'Dell XPS 15 — Core i7, 16GB RAM, RTX 4060',
    description: 'High-performance laptop for design, video editing and gaming. 1TB SSD. OLED display. Selling because relocating.',
    price: 7800, condition: 'used', negotiable: true, views_count: 189,
    location: 'Spintex',
    images: ['laptop3', 'laptop4'],
  },
  {
    cat: 'laptops-pcs', seller: 0,
    title: 'HP EliteBook 840 G10 — Business Laptop',
    description: 'Brand new, sealed. Core i5 13th Gen, 16GB RAM, 512GB SSD, Windows 11 Pro. Corporate grade with 3-year warranty.',
    price: 5200, condition: 'new', negotiable: false, views_count: 94,
    location: 'Tema',
    images: ['laptop5', 'laptop6'],
  },

  // ── CARS ──────────────────────────────────────────────────────────────────
  {
    cat: 'cars', seller: 2,
    title: '2020 Toyota Corolla — 1.8L, Low Mileage',
    description: 'Accident-free. 42,000km on the clock. Full service history from Toyota Ghana. One owner. Silver colour. Customs cleared.',
    price: 98000, condition: 'used', negotiable: true, views_count: 542, boost_tier: 'top',
    location: 'Adum',
    images: ['car1', 'car2', 'car3', 'car4'],
  },
  {
    cat: 'cars', seller: 2,
    title: '2019 Hyundai Elantra — 2.0L Automatic',
    description: 'White colour. Very clean interior. Cold AC. New tyres installed. Duty paid. No hidden faults. Test drive available in Kumasi.',
    price: 72000, condition: 'used', negotiable: true, views_count: 389,
    location: 'Bantama',
    images: ['car5', 'car6', 'car7'],
  },
  {
    cat: 'cars', seller: 2,
    title: '2022 Toyota RAV4 XLE — AWD, Sunroof',
    description: 'Clean carfax, AWD. Push start, heated seats, apple carplay. Pearl white. Recently imported. Registration included.',
    price: 195000, condition: 'used', negotiable: false, views_count: 721, boost_tier: 'spotlight',
    location: 'Asokwa',
    images: ['car8', 'car9', 'car10'],
  },
  {
    cat: 'cars', seller: 2,
    title: '2021 Honda Civic — 1.5T Sport',
    description: 'Sport trim with 18" alloys. Backup camera, lane assist. Red/black interior. 58,000km. Extremely clean body.',
    price: 115000, condition: 'used', negotiable: true, views_count: 298,
    location: 'Nhyiaeso',
    images: ['car11', 'car12'],
  },

  // ── TRUCKS & SUVs ─────────────────────────────────────────────────────────
  {
    cat: 'trucks-suvs', seller: 2,
    title: '2018 Ford F-150 XLT — 4x4, V8 Engine',
    description: 'Heavy duty pickup. Used for farm and business. Good condition, strong engine. Customs cleared. Located in Kumasi.',
    price: 165000, condition: 'used', negotiable: true, views_count: 211,
    location: 'Suame',
    images: ['truck1', 'truck2'],
  },

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  {
    cat: 'houses-sale', seller: 3,
    title: '4-Bedroom House — East Legon, Gated Estate',
    description: 'Elegant 4-bed, 4-bath detached house in a secure gated community. BQ, 2-car garage, fitted kitchen, back garden. Quiet neighbourhood, 5 mins from American Embassy.',
    price: 1950000, condition: 'new', negotiable: true, views_count: 834, boost_tier: 'top',
    location: 'East Legon',
    images: ['house1', 'house2', 'house3', 'house4'],
  },
  {
    cat: 'houses-sale', seller: 3,
    title: '3-Bedroom Townhouse — Cantonments',
    description: 'Modern townhouse in prime location. All en-suite. 24-hr security, generator, water tank. Walking distance to Alisa Hotel.',
    price: 1250000, condition: 'used', negotiable: false, views_count: 567,
    location: 'Cantonments',
    images: ['house5', 'house6', 'house7'],
  },
  {
    cat: 'houses-rent', seller: 3,
    title: '2-Bedroom Apartment — Airport Residential',
    description: 'Fully furnished. AC in all rooms, fibre internet, 24hr water & light. Underground parking. Ideal for expats & corporate tenants.',
    price: 7500, condition: 'new', negotiable: false, views_count: 645, boost_tier: 'featured',
    location: 'Airport Residential',
    images: ['apt1', 'apt2', 'apt3'],
  },
  {
    cat: 'houses-rent', seller: 3,
    title: 'Executive Studio — Osu Oxford Street',
    description: 'Fully furnished studio. 1 year minimum. Generator and DSTV included. Walking distance to restaurants, banks and grocery stores.',
    price: 3200, condition: 'used', negotiable: true, views_count: 312,
    location: 'Osu',
    images: ['apt4', 'apt5'],
  },
  {
    cat: 'land-plots', seller: 3,
    title: 'Serviced Land — Spintex, 1/4 Acre, Titled',
    description: 'Freehold titled land in fast-growing Spintex corridor. All utilities available. 30 mins to Kotoka Airport. Ideal for residential or commercial development.',
    price: 650000, condition: 'new', negotiable: true, views_count: 423,
    location: 'Spintex',
    images: ['land1', 'land2'],
  },

  // ── FASHION ───────────────────────────────────────────────────────────────
  {
    cat: 'womens-clothing', seller: 1,
    title: 'Premium Ankara Maxi Dress — 3 Piece Set',
    description: 'Hand-stitched by local designer. 100% cotton wax print. Available in sizes XS-3XL. Custom alterations available within 48 hrs.',
    price: 480, condition: 'new', negotiable: false, views_count: 176,
    location: 'Osu',
    images: ['fashion1', 'fashion2', 'fashion3'],
  },
  {
    cat: 'womens-clothing', seller: 1,
    title: 'Kente Cloth — 6 Yards, Asante Royal Weave',
    description: 'Authentic hand-woven Kente from Bonwire. Multi-colour royal pattern. Suitable for funerals, outdoorings and formal occasions.',
    price: 1800, condition: 'new', negotiable: true, views_count: 234, boost_tier: 'featured',
    location: 'Osu',
    images: ['fashion4', 'fashion5'],
  },
  {
    cat: 'shoes', seller: 1,
    title: 'Nike Air Max 270 — Size 42, Brand New',
    description: 'Authentic Nike purchased in Dubai. Comes with original box and receipt. Air Max cushioning. Black/white colourway.',
    price: 950, condition: 'new', negotiable: false, views_count: 198,
    location: 'Achimota',
    images: ['shoes1', 'shoes2'],
  },
  {
    cat: 'bags-accessories', seller: 1,
    title: 'Michael Kors Leather Handbag — Caramel',
    description: 'Authentic MK bag purchased in UK. Used twice, no marks or scratches. Comes with dust bag and authenticity card.',
    price: 1600, condition: 'used', negotiable: true, views_count: 143,
    location: 'East Legon',
    images: ['bag1', 'bag2'],
  },

  // ── TVs & AUDIO ───────────────────────────────────────────────────────────
  {
    cat: 'tvs-audio', seller: 0,
    title: 'LG 65" OLED C3 4K Smart TV — 2023',
    description: 'Stunning OLED display. Dolby Vision & Atmos. webOS smart platform. Barely used, 8 months old. Original box and remote.',
    price: 8900, condition: 'used', negotiable: true, views_count: 312, boost_tier: 'featured',
    location: 'East Legon',
    images: ['tv1', 'tv2'],
  },
  {
    cat: 'tvs-audio', seller: 0,
    title: 'Samsung 55" QLED Q80C — Frame TV',
    description: 'The Frame model. Displays art when not in use. 120Hz, Neo Quantum processor. 1 year old, excellent condition.',
    price: 5400, condition: 'used', negotiable: false, views_count: 187,
    location: 'Tema',
    images: ['tv3', 'tv4'],
  },

  // ── FURNITURE ─────────────────────────────────────────────────────────────
  {
    cat: 'living-room', seller: 1,
    title: '7-Seater L-Shape Sofa — Cream Leather',
    description: 'Italian leather, electric recliners on both ends. Selling due to home renovation. Excellent condition, 2 years old. Self-collection only, Dansoman.',
    price: 4200, condition: 'used', negotiable: true, views_count: 134,
    location: 'Dansoman',
    images: ['sofa1', 'sofa2', 'sofa3'],
  },
  {
    cat: 'bedroom', seller: 1,
    title: 'Queen Size Bed Frame + Mattress — Rosewood',
    description: 'Solid rosewood bed with orthopedic spring mattress. 4 years old, very good condition. Dismantled for easy transport.',
    price: 2100, condition: 'used', negotiable: true, views_count: 89,
    location: 'North Kaneshie',
    images: ['bed1', 'bed2'],
  },

  // ── AGRICULTURE ───────────────────────────────────────────────────────────
  {
    cat: 'farm-produce', seller: 3,
    title: 'Fresh Tomatoes — 100kg Bags, Farm Direct',
    description: 'Direct from Brong-Ahafo farm. Grade A tomatoes. Bulk orders only (min 5 bags). Delivery to Accra & Kumasi markets available.',
    price: 320, condition: 'new', negotiable: true, views_count: 67,
    location: 'Sunyani',
    images: ['farm1', 'farm2'],
  },
  {
    cat: 'livestock', seller: 3,
    title: 'Healthy RAM — Sallah Ready, Bolgatanga',
    description: '1.5 year old male ram, well fed, no illness. Suitable for Eid al-Adha. Available from late June. Price negotiable for bulk.',
    price: 1800, condition: 'new', negotiable: true, views_count: 103,
    location: 'Bolgatanga',
    images: ['ram1', 'ram2'],
  },

  // ── HEALTH & BEAUTY ───────────────────────────────────────────────────────
  {
    cat: 'health', seller: 1,
    title: 'Dyson Airwrap Complete — All Hair Types',
    description: 'Limited edition. Includes all 6 attachments. 1 year old, cleaned and serviced. Original storage case. Works perfectly.',
    price: 2800, condition: 'used', negotiable: false, views_count: 221, boost_tier: 'featured',
    location: 'Cantonments',
    images: ['beauty1', 'beauty2'],
  },

  // ── SERVICES ─────────────────────────────────────────────────────────────
  {
    cat: 'home-services', seller: 1,
    title: 'Professional House Cleaning — Full-Day Service',
    description: 'Thorough deep clean: kitchen, bathrooms, bedrooms, living areas. Equipment and products provided. Accra only. Book 48 hrs in advance.',
    price: 300, condition: 'new', negotiable: false, views_count: 56,
    location: 'Adabraka',
    images: ['service1', 'service2'],
  },
  {
    cat: 'events-photography', seller: 1,
    title: 'Wedding & Event Photography — Full Day Coverage',
    description: '8 hours coverage, 2 photographers, 500+ edited photos delivered within 2 weeks. Drone shots available. Portfolio on request.',
    price: 3500, condition: 'new', negotiable: true, views_count: 178, boost_tier: 'featured',
    location: 'Accra',
    images: ['photo1', 'photo2'],
  },

  // ── SPORTS ───────────────────────────────────────────────────────────────
  {
    cat: 'sports', seller: 0,
    title: 'Trek FX3 Disc Hybrid Bike — Size M, 2022',
    description: 'Barely ridden. Hydraulic disc brakes, 24 gears, carbon fork. Perfect for city commuting or weekend rides. Helmet and lock included.',
    price: 4800, condition: 'used', negotiable: true, views_count: 112,
    location: 'Labadi',
    images: ['bike1', 'bike2'],
  },

  // ── BABIES & KIDS ────────────────────────────────────────────────────────
  {
    cat: 'babies', seller: 1,
    title: 'Chicco Trio System — Pram, Car Seat & Stroller',
    description: 'Complete travel system. Used for 18 months. Excellent condition, fully cleaned. Includes rain cover and cup holder.',
    price: 1400, condition: 'used', negotiable: true, views_count: 94,
    location: 'Achimota',
    images: ['baby1', 'baby2', 'baby3'],
  },
]


// ── Picsum seeds for different categories ────────────────────────────────────
const IMG_SEEDS = {
  phone1: 'phone-blk', phone2: 'phone-box', phone3: 'samsung-s24', phone4: 'phone-gold',
  phone5: 'tecno-pro', phone6: 'tecno-side', tablet1: 'ipad-pro', tablet2: 'ipad-desk', tablet3: 'ipad-pen',
  laptop1: 'macbook-m3', laptop2: 'macbook-open', laptop3: 'dell-xps', laptop4: 'dell-side',
  laptop5: 'hp-elite', laptop6: 'hp-box',
  car1: 'corolla-front', car2: 'corolla-side', car3: 'corolla-int', car4: 'corolla-rear',
  car5: 'elantra-wht', car6: 'elantra-side', car7: 'elantra-int',
  car8: 'rav4-white', car9: 'rav4-rear', car10: 'rav4-int',
  car11: 'civic-red', car12: 'civic-int',
  truck1: 'ford-f150', truck2: 'ford-bed',
  house1: 'house-east-legon', house2: 'house-pool', house3: 'house-living', house4: 'house-kit',
  house5: 'townhouse-ct', house6: 'townhouse-int', house7: 'townhouse-room',
  apt1: 'apt-airport', apt2: 'apt-living', apt3: 'apt-bed',
  apt4: 'studio-osu', apt5: 'studio-kit',
  land1: 'land-spintex', land2: 'land-aerial',
  fashion1: 'ankara-dress', fashion2: 'ankara-detail', fashion3: 'ankara-set',
  fashion4: 'kente-weave', fashion5: 'kente-roll',
  shoes1: 'nike-am270', shoes2: 'nike-box',
  bag1: 'mk-bag-tan', bag2: 'mk-bag-int',
  tv1: 'lg-oled-65', tv2: 'lg-oled-room', tv3: 'samsung-frame', tv4: 'samsung-art',
  sofa1: 'sofa-cream', sofa2: 'sofa-detail', sofa3: 'sofa-room',
  bed1: 'bed-rosewood', bed2: 'bed-room',
  farm1: 'tomatoes-bag', farm2: 'tomatoes-farm',
  ram1: 'sheep-ram', ram2: 'livestock-gh',
  beauty1: 'dyson-wrap', beauty2: 'dyson-attachments',
  service1: 'cleaning-pro', service2: 'cleaning-kit',
  photo1: 'wedding-photo', photo2: 'event-cam',
  bike1: 'trek-fx3', bike2: 'bike-detail',
  baby1: 'chicco-trio', baby2: 'pram-detail', baby3: 'car-seat',
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding listings...\n')

  const now = new Date()
  const existingListings = await prisma.listing.count()
  if (existingListings > 0) {
    console.log(`⚡ Skipping listings seed: ${existingListings} listings already exist.`)
    return
  }

  // Look up categories and locations
  const categories = await prisma.category.findMany()
  const locations  = await prisma.location.findMany()

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]))
  const locByArea = Object.fromEntries(locations.map((l) => [l.area || l.city, l]))

  // ── Create sellers ─────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('hoova1234', 10)
  const sellers = []

  for (const s of SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        ...s,
        password_hash: hash,
        email_verified: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=F8C0C8&color=B81365&bold=true&size=128`,
      },
    })
    sellers.push(user)
    console.log(`✅ Seller: ${user.name}`)
  }

  // ── Create listings ────────────────────────────────────────────────────────
  let created = 0

  for (const l of LISTINGS) {
    const category = catBySlug[l.cat]
    if (!category) { console.warn(`⚠️  Category not found: ${l.cat}`); continue }

    // Find parent category for category_id vs subcategory_id
    const parentCat = category.parent_id
      ? categories.find((c) => c.id === category.parent_id)
      : null

    const location = locByArea[l.location] || locByArea['East Legon']
    const seller   = sellers[l.seller]

    // Randomise created_at across last 30 days
    const daysAgo = rand(0, 30)
    const createdAt = new Date(now - daysAgo * 86400000)

    const listing = await prisma.listing.create({
      data: {
        user_id:        seller.id,
        title:          l.title,
        description:    l.description,
        price:          l.price,
        currency:       'GHS',
        category_id:    parentCat ? parentCat.id : category.id,
        subcategory_id: parentCat ? category.id  : null,
        location_id:    location.id,
        region:         location.region,
        city:           location.city,
        area:           location.area,
        condition:       l.condition,
        negotiable:      l.negotiable,
        status:          'active',
        views_count:     l.views_count || rand(10, 100),
        boost_tier:      l.boost_tier || null,
        boost_ends_at:   l.boost_tier ? new Date(now.getTime() + 14 * 86400000) : null,
        score:           l.boost_tier === 'top' ? 95 : l.boost_tier === 'spotlight' ? 80 : l.boost_tier === 'featured' ? 65 : rand(20, 50),
        created_at:      createdAt,
        updated_at:      createdAt,
      },
    })

    // Create images
    const imgSeeds = l.images || ['placeholder']
    for (let i = 0; i < imgSeeds.length; i++) {
      const seed = imgSeeds[i]
      // Use a numeric seed for picsum so it's deterministic
      const numericSeed = Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
      await prisma.listingImage.create({
        data: {
          listing_id: listing.id,
          url:        `https://picsum.photos/seed/${numericSeed}/600/450`,
          order:      i,
          is_primary: i === 0,
        },
      })
    }

    // Seed some listing views (last 7 days)
    const viewCount = Math.min(l.views_count || 20, 30)
    for (let v = 0; v < viewCount; v++) {
      const daysAgoV = rand(0, 7)
      await prisma.listingView.create({
        data: {
          listing_id: listing.id,
          ip:         `192.168.${rand(1, 254)}.${rand(1, 254)}`,
          viewed_at:  new Date(now - daysAgoV * 86400000 - rand(0, 86400000)),
        },
      }).catch(() => {})
    }

    // Price history entry
    await prisma.priceHistory.create({
      data: { listing_id: listing.id, price: l.price, changed_at: createdAt },
    })

    created++
    console.log(`  ✅ ${l.title.slice(0, 60)}`)
  }

  // ── Update category listing counts ─────────────────────────────────────────
  for (const cat of categories) {
    const count = await prisma.listing.count({ where: { category_id: cat.id, status: 'active' } })
    await prisma.category.update({ where: { id: cat.id }, data: { listing_count: count } })
  }
  console.log('\n✅ Category counts updated')


  console.log(`\n🎉 Done! Created ${created} listings across ${SELLERS.length} sellers.`)
  console.log('\nTest accounts (all passwords: hoova1234):')
  SELLERS.forEach((s) => console.log(`  ${s.email} — ${s.subscription_tier}`))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
