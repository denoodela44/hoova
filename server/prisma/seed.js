const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Vehicles', slug: 'vehicles', children: [
    { name: 'Cars', slug: 'cars' },
    { name: 'Motorcycles & Tricycles', slug: 'motorcycles-tricycles' },
    { name: 'Trucks, Buses & Pickups', slug: 'trucks-buses-pickups' },
    { name: 'Auto Parts & Accessories', slug: 'auto-parts' },
  ]},
  { name: 'Phones & Tablets', slug: 'phones-tablets', children: [
    { name: 'Mobile Phones', slug: 'mobile-phones' },
    { name: 'Tablets', slug: 'tablets' },
    { name: 'Phone Accessories', slug: 'phone-accessories' },
    { name: 'Airtime & Data', slug: 'airtime-data' },
  ]},
  { name: 'Electronics', slug: 'electronics', children: [
    { name: 'Computers & Laptops', slug: 'computers-laptops' },
    { name: 'TVs & Audio', slug: 'tvs-audio' },
    { name: 'Cameras & Drones', slug: 'cameras-drones' },
    { name: 'Gaming', slug: 'gaming' },
    { name: 'Gadgets & Accessories', slug: 'gadgets-accessories' },
  ]},
  { name: 'Home & Appliances', slug: 'home-appliances', children: [
    { name: 'Furniture', slug: 'furniture' },
    { name: 'Kitchen Appliances', slug: 'kitchen-appliances' },
    { name: 'Generators, Solar & Inverters', slug: 'generators-solar' },
    { name: 'Air Conditioners & Fans', slug: 'ac-fans' },
    { name: 'Home Decor', slug: 'home-decor' },
  ]},
  { name: 'Real Estate', slug: 'real-estate', children: [
    { name: 'Houses for Sale', slug: 'houses-sale' },
    { name: 'Houses for Rent', slug: 'houses-rent' },
    { name: 'Land & Plots', slug: 'land-plots' },
    { name: 'Commercial & Office Space', slug: 'commercial-property' },
    { name: 'Short Stay', slug: 'short-stay' },
  ]},
  { name: 'Fashion', slug: 'fashion', children: [
    { name: "Women's Clothing", slug: 'womens-clothing' },
    { name: "Men's Clothing", slug: 'mens-clothing' },
    { name: 'Shoes & Footwear', slug: 'shoes' },
    { name: 'Bags & Accessories', slug: 'bags-accessories' },
    { name: 'Fabrics, Kente & Beads', slug: 'fabrics-kente' },
  ]},
  { name: 'Health & Beauty', slug: 'health-beauty', children: [
    { name: 'Skincare & Cosmetics', slug: 'skincare-cosmetics' },
    { name: 'Hair & Wigs', slug: 'hair-wigs' },
    { name: 'Health & Medical', slug: 'health-medical' },
    { name: 'Fitness Equipment', slug: 'fitness-equipment' },
  ]},
  { name: 'Babies & Kids', slug: 'babies-kids', children: [
    { name: 'Clothing & Shoes', slug: 'kids-clothing' },
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Baby Gear & Strollers', slug: 'baby-gear' },
    { name: 'Baby Care', slug: 'baby-care' },
  ]},
  { name: 'Building & Construction', slug: 'building-construction', children: [
    { name: 'Building Materials', slug: 'building-materials' },
    { name: 'Tools & Equipment', slug: 'tools-equipment' },
    { name: 'Electrical & Plumbing', slug: 'electrical-plumbing' },
    { name: 'Roofing & Finishing', slug: 'roofing-finishing' },
  ]},
  { name: 'Agriculture & Farming', slug: 'agriculture', children: [
    { name: 'Farm Produce', slug: 'farm-produce' },
    { name: 'Livestock & Poultry', slug: 'livestock-poultry' },
    { name: 'Farm Equipment', slug: 'farm-equipment' },
    { name: 'Seeds & Fertilizers', slug: 'seeds-fertilizers' },
  ]},
  { name: 'Services', slug: 'services', children: [
    { name: 'Home Repair & Maintenance', slug: 'home-repair' },
    { name: 'Cleaning & Fumigation', slug: 'cleaning' },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness' },
    { name: 'Events & Photography', slug: 'events-photography' },
    { name: 'Transport & Delivery', slug: 'transport-delivery' },
    { name: 'Tutoring & Lessons', slug: 'tutoring' },
    { name: 'Business Services', slug: 'business-services' },
  ]},
  { name: 'Jobs', slug: 'jobs', children: [
    { name: 'Full-Time Employment', slug: 'full-time' },
    { name: 'Part-Time & Contract', slug: 'part-time' },
    { name: 'Freelance & Remote', slug: 'freelance' },
    { name: 'Internships & Apprenticeships', slug: 'internships' },
  ]},
  { name: 'Sports & Leisure', slug: 'sports', children: [
    { name: 'Sports Equipment', slug: 'sports-equipment' },
    { name: 'Musical Instruments', slug: 'musical-instruments' },
    { name: 'Hobbies & Arts', slug: 'hobbies-arts' },
  ]},
  { name: 'Animals & Pets', slug: 'pets', children: [
    { name: 'Dogs & Cats', slug: 'dogs-cats' },
    { name: 'Birds & Exotic', slug: 'birds-exotic' },
    { name: 'Pet Accessories & Food', slug: 'pet-accessories' },
  ]},
  { name: 'Food & Drinks', slug: 'food', children: [
    { name: 'Packaged Food', slug: 'packaged-food' },
    { name: 'Fresh & Local Produce', slug: 'fresh-produce' },
    { name: 'Drinks & Beverages', slug: 'drinks' },
  ]},
  { name: 'Other', slug: 'other' },
]

const LOCATIONS = [
  { region: 'Greater Accra', city: 'Accra', area: 'East Legon' },
  { region: 'Greater Accra', city: 'Accra', area: 'Osu' },
  { region: 'Greater Accra', city: 'Accra', area: 'Labadi' },
  { region: 'Greater Accra', city: 'Accra', area: 'Cantonments' },
  { region: 'Greater Accra', city: 'Accra', area: 'Airport Residential' },
  { region: 'Greater Accra', city: 'Accra', area: 'Adabraka' },
  { region: 'Greater Accra', city: 'Accra', area: 'Madina' },
  { region: 'Greater Accra', city: 'Accra', area: 'Tema' },
  { region: 'Greater Accra', city: 'Accra', area: 'Achimota' },
  { region: 'Greater Accra', city: 'Accra', area: 'Dansoman' },
  { region: 'Greater Accra', city: 'Accra', area: 'Spintex' },
  { region: 'Greater Accra', city: 'Accra', area: 'North Kaneshie' },
  { region: 'Ashanti', city: 'Kumasi', area: 'Adum' },
  { region: 'Ashanti', city: 'Kumasi', area: 'Asokwa' },
  { region: 'Ashanti', city: 'Kumasi', area: 'Bantama' },
  { region: 'Ashanti', city: 'Kumasi', area: 'Nhyiaeso' },
  { region: 'Ashanti', city: 'Kumasi', area: 'Suame' },
  { region: 'Western', city: 'Takoradi', area: 'Market Circle' },
  { region: 'Western', city: 'Takoradi', area: 'Airport Ridge' },
  { region: 'Western', city: 'Sekondi', area: null },
  { region: 'Eastern', city: 'Koforidua', area: null },
  { region: 'Central', city: 'Cape Coast', area: null },
  { region: 'Volta', city: 'Ho', area: null },
  { region: 'Northern', city: 'Tamale', area: 'Lamashegu' },
  { region: 'Northern', city: 'Tamale', area: 'Kalpohin' },
  { region: 'Upper East', city: 'Bolgatanga', area: null },
  { region: 'Upper West', city: 'Wa', area: null },
  { region: 'Brong-Ahafo', city: 'Sunyani', area: null },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Enable pg_trgm and create trigram indexes for fast fuzzy search
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS listings_title_trgm ON listings USING gin (title gin_trgm_ops)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS listings_desc_trgm ON listings USING gin (description gin_trgm_ops)')

  // Remove old parent slugs that have been restructured or renamed
  await prisma.category.deleteMany({
    where: { slug: { in: ['books', 'babies', 'health', 'laptops-pcs', 'cameras', 'electronics-accessories', 'motorcycles', 'trucks-suvs', 'buses-minivans', 'accounting-finance', 'it-software', 'sales-marketing', 'healthcare', 'education', 'home-services', 'professional-services', 'tutoring-lessons', 'living-room', 'bedroom', 'office-furniture', 'kitchen-dining', 'livestock'] } }
  )

  // Categories
  for (const cat of CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon_name: null, parent_id: null },
      create: { name: cat.name, slug: cat.slug },
    })

    if (cat.children) {
      for (const child of cat.children) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: { name: child.name, parent_id: parent.id },
          create: { name: child.name, slug: child.slug, parent_id: parent.id },
        })
      }
    }
  }
  console.log(`✅ ${CATEGORIES.length} categories seeded`)

  // Locations
  for (const loc of LOCATIONS) {
    await prisma.location.create({ data: loc }).catch(() => {})
  }
  console.log(`✅ ${LOCATIONS.length} locations seeded`)

  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
