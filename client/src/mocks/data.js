export const MOCK_CATEGORIES = [
  { id: '1',  name: 'Vehicles',               slug: 'vehicles',               icon_name: '🚗', parent_id: null, listing_count: 0 },
  { id: '2',  name: 'Phones & Tablets',        slug: 'phones-tablets',         icon_name: '📱', parent_id: null, listing_count: 0 },
  { id: '3',  name: 'Electronics',             slug: 'electronics',            icon_name: '💻', parent_id: null, listing_count: 0 },
  { id: '4',  name: 'Home & Appliances',       slug: 'home-appliances',        icon_name: '🛋️', parent_id: null, listing_count: 0 },
  { id: '5',  name: 'Real Estate',             slug: 'real-estate',            icon_name: '🏠', parent_id: null, listing_count: 0 },
  { id: '6',  name: 'Fashion',                 slug: 'fashion',                icon_name: '👗', parent_id: null, listing_count: 0 },
  { id: '7',  name: 'Health & Beauty',         slug: 'health-beauty',          icon_name: '💊', parent_id: null, listing_count: 0 },
  { id: '8',  name: 'Babies & Kids',           slug: 'babies-kids',            icon_name: '🍼', parent_id: null, listing_count: 0 },
  { id: '9',  name: 'Building & Construction', slug: 'building-construction',  icon_name: '🏗️', parent_id: null, listing_count: 0 },
  { id: '10', name: 'Agriculture & Farming',   slug: 'agriculture',            icon_name: '🌾', parent_id: null, listing_count: 0 },
  { id: '11', name: 'Services',                slug: 'services',               icon_name: '🔧', parent_id: null, listing_count: 0 },
  { id: '12', name: 'Jobs',                    slug: 'jobs',                   icon_name: '💼', parent_id: null, listing_count: 0 },
  { id: '13', name: 'Sports & Leisure',        slug: 'sports',                 icon_name: '⚽', parent_id: null, listing_count: 0 },
  { id: '14', name: 'Animals & Pets',          slug: 'pets',                   icon_name: '🐾', parent_id: null, listing_count: 0 },
  { id: '15', name: 'Food & Drinks',           slug: 'food',                   icon_name: '🍔', parent_id: null, listing_count: 0 },
  { id: '16', name: 'Other',                   slug: 'other',                  icon_name: '📦', parent_id: null, listing_count: 0 },
]

export const SELLERS = [
  { id: 'u1', name: 'Kwame Asante', avatar: 'https://i.pravatar.cc/80?img=11', id_verified: true, phone: '+233244123456', rating_avg: 4.8, review_count: 34, created_at: '2022-03-15' },
  { id: 'u2', name: 'Abena Mensah', avatar: 'https://i.pravatar.cc/80?img=47', id_verified: true, phone: '+233205678901', rating_avg: 4.5, review_count: 18, created_at: '2023-01-09' },
  { id: 'u3', name: 'Kofi Boateng', avatar: 'https://i.pravatar.cc/80?img=33', id_verified: false, phone: '+233277345678', rating_avg: 3.9, review_count: 7, created_at: '2023-08-22' },
  { id: 'u4', name: 'Ama Ofori', avatar: 'https://i.pravatar.cc/80?img=44', id_verified: true, phone: '+233540987654', rating_avg: 5.0, review_count: 62, created_at: '2021-11-30' },
  { id: 'u5', name: 'Yaw Darko', avatar: 'https://i.pravatar.cc/80?img=15', id_verified: false, phone: '+233261234567', rating_avg: 4.2, review_count: 11, created_at: '2023-05-17' },
]

export const MOCK_AUCTION_LISTINGS = [
  {
    id: 'la1',
    listing_type: 'auction',
    title: 'Vintage Rolex Submariner 1980 — Estate Sale',
    description: 'Authenticated 1980 Rolex Submariner. Original bracelet, serviced 2022. All papers included. Extremely rare find in Ghana. Authenticated by certified watchmaker.',
    price: 18000,
    starting_bid: 18000,
    current_bid: 22500,
    bid_count: 7,
    reserve_price: 18000,
    auction_end_at: new Date(Date.now() + 2 * 3600000).toISOString(),
    condition: 'used',
    status: 'active',
    boost_tier: 'spotlight',
    views_count: 543,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    price_dropped: false,
    negotiable: false,
    category: { id: '13', name: 'Other', slug: 'other' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Labone' },
    seller: SELLERS[0],
    images: [{ url: 'https://images.unsplash.com/photo-1523170335258-f87a2f6dc951?w=800&q=80', order: 0 }],
    bids: [
      { id: 'b1', amount: 22500, bidder_name: 'K***', bidder_short: 'K', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: 'b2', amount: 21000, bidder_name: 'A***', bidder_short: 'A', created_at: new Date(Date.now() - 90 * 60000).toISOString() },
      { id: 'b3', amount: 19500, bidder_name: 'Y***', bidder_short: 'Y', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
    ],
  },
  {
    id: 'la2',
    listing_type: 'auction',
    title: 'Classic 1965 VW Beetle — Full Restoration',
    description: 'Fully restored 1965 Volkswagen Beetle. New engine, new interior, new paint (Pastel Yellow). Running perfectly. A collector\'s dream, one of very few in Ghana.',
    price: 45000,
    starting_bid: 45000,
    current_bid: 52000,
    bid_count: 4,
    reserve_price: 45000,
    auction_end_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 892,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    price_dropped: false,
    negotiable: false,
    category: { id: '1', name: 'Vehicles', slug: 'vehicles' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Dzorwulu' },
    seller: SELLERS[3],
    images: [{ url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', order: 0 }],
    bids: [
      { id: 'b4', amount: 52000, bidder_name: 'M***', bidder_short: 'M', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'b5', amount: 49000, bidder_name: 'K***', bidder_short: 'K', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    ],
  },
]

export const MOCK_LISTINGS = [
  {
    id: 'l1',
    title: 'Toyota Corolla 2018 – Excellent Condition',
    description: 'Well maintained Corolla. Full AC, leather seats, reverse camera. Garage kept. First owner. Reason for selling: upgrading.',
    price: 92000,
    condition: 'used',
    status: 'active',
    boost_tier: 'spotlight',
    views_count: 843,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    price_dropped: true,
    category: { id: '1', name: 'Vehicles', slug: 'vehicles' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'East Legon' },
    seller: SELLERS[0],
    images: [
      { url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80', order: 0 },
      { url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80', order: 1 },
    ],
  },
  {
    id: 'l2',
    title: 'iPhone 15 Pro Max 256GB – Natural Titanium',
    description: 'Brand new, sealed box. Bought from iStore Ghana. Comes with full warranty. No scratches, never been used.',
    price: 8500,
    condition: 'new',
    status: 'active',
    boost_tier: 'featured',
    views_count: 1204,
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    price_dropped: false,
    category: { id: '2', name: 'Electronics', slug: 'electronics' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Osu' },
    seller: SELLERS[3],
    images: [
      { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l3',
    title: '3-Bedroom House for Rent – Airport Residential',
    description: 'Spacious 3-bed, 3-bath house in a quiet street. Boys quarters, 2-car garage, security. Close to Accra Mall.',
    price: 4500,
    condition: 'used',
    status: 'active',
    boost_tier: 'spotlight',
    views_count: 2341,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    price_dropped: false,
    category: { id: '3', name: 'Real Estate', slug: 'real-estate' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Airport Residential' },
    seller: SELLERS[1],
    images: [
      { url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l4',
    title: 'MacBook Pro M3 14" – Space Grey',
    description: 'MacBook Pro 14-inch M3 chip, 16GB RAM, 512GB SSD. 8 months old, perfect condition. Selling due to company laptop upgrade.',
    price: 14200,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 678,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    price_dropped: true,
    negotiable: true,
    category: { id: '2', name: 'Electronics', slug: 'electronics' },
    location: { region: 'Ashanti', city: 'Kumasi', area: 'Nhyiaeso' },
    seller: SELLERS[2],
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', order: 0 },
      { url: 'https://images.unsplash.com/photo-1611186871525-b49ae5bb5537?w=800&q=80', order: 1 },
    ],
    offers: [
      { id: 'o1', amount: 12000, status: 'countered', counter_amount: 13500, message: 'Best I can do right now, just got paid.', buyer: SELLERS[1], created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'o2', amount: 11000, status: 'declined', counter_amount: null, message: 'Please consider, I am a serious buyer.', buyer: SELLERS[4], created_at: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
  {
    id: 'l5',
    title: 'Honda CRV 2020 – AWD, Low Mileage',
    description: 'Very clean Honda CRV 2020 AWD. 42,000km. Push start, panoramic roof, lane assist, heated seats. All documents in order.',
    price: 148000,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 512,
    created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    price_dropped: false,
    category: { id: '1', name: 'Vehicles', slug: 'vehicles' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Cantonments' },
    seller: SELLERS[4],
    images: [
      { url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=800&q=80', order: 0 },
      { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', order: 1 },
      { url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80', order: 2 },
    ],
  },
  {
    id: 'l6',
    title: 'Samsung 65" QLED 4K Smart TV',
    description: '65" Samsung Q80C QLED 4K. Quantum HDR, 120Hz, built-in Alexa. 6 months old, excellent condition. Wall bracket included.',
    price: 6800,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 399,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    price_dropped: true,
    category: { id: '2', name: 'Electronics', slug: 'electronics' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Madina' },
    seller: SELLERS[0],
    images: [
      { url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l7',
    title: 'Furnished Studio Apartment – Cantonments',
    description: 'Modern studio apartment. AC, WiFi included, fitted kitchen, 24hr security, swimming pool access. Ideal for expats/professionals.',
    price: 2800,
    condition: 'new',
    status: 'active',
    boost_tier: 'featured',
    views_count: 1876,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    price_dropped: false,
    category: { id: '3', name: 'Real Estate', slug: 'real-estate' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Cantonments' },
    seller: SELLERS[1],
    images: [
      { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', order: 0 },
      { url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80', order: 1 },
      { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80', order: 2 },
    ],
  },
  {
    id: 'l8',
    title: 'Ankara Dress Collection – 3 Pieces',
    description: 'Beautiful Ankara dresses, handmade by local designer. Sizes 10, 12, 14 available. All unworn, bought for photoshoot.',
    price: 450,
    condition: 'new',
    status: 'active',
    boost_tier: null,
    views_count: 223,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    price_dropped: false,
    category: { id: '4', name: 'Fashion', slug: 'fashion' },
    location: { region: 'Ashanti', city: 'Kumasi', area: 'Adum' },
    seller: SELLERS[3],
    images: [
      { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4c80?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l9',
    title: 'Generator 8.5KVA Kipor – Barely Used',
    description: 'Kipor 8.5KVA soundproof generator. Used 3 times. Electric start, low fuel consumption. Comes with ATS switch.',
    price: 7200,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 441,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    price_dropped: true,
    category: { id: '13', name: 'Other', slug: 'other' },
    location: { region: 'Western', city: 'Takoradi', area: 'Airport Ridge' },
    seller: SELLERS[2],
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l10',
    title: 'L-Shaped Sofa Set – Grey Velvet',
    description: 'Large L-shaped sofa, 7-seater. Grey velvet fabric. Very comfortable, 1 year old. Only selling because we moved to a smaller place.',
    price: 3200,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 187,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    price_dropped: false,
    category: { id: '7', name: 'Furniture', slug: 'furniture' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Tema' },
    seller: SELLERS[4],
    images: [
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l11',
    title: 'Land for Sale – 1 Plot Oyibi',
    description: 'Registered 1-plot land at Oyibi. Indenture and site plan available. 50×100ft, close to main road, quiet estate.',
    price: 55000,
    condition: 'new',
    status: 'active',
    boost_tier: null,
    views_count: 764,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    price_dropped: false,
    category: { id: '3', name: 'Real Estate', slug: 'real-estate' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Oyibi' },
    seller: SELLERS[0],
    images: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', order: 0 },
    ],
  },
  {
    id: 'l12',
    title: 'PS5 Console + 3 Games',
    description: 'PlayStation 5 disc edition. Includes FIFA 24, Spider-Man 2, and Call of Duty. All in perfect working condition.',
    price: 4600,
    condition: 'used',
    status: 'active',
    boost_tier: null,
    views_count: 932,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    price_dropped: true,
    category: { id: '2', name: 'Electronics', slug: 'electronics' },
    location: { region: 'Greater Accra', city: 'Accra', area: 'Spintex' },
    seller: SELLERS[1],
    images: [
      { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80', order: 0 },
    ],
  },
]

export function filterMockListings({ category, q, region, min_price, max_price, condition, verified_seller, sort = 'newest', limit = 24, page = 1 } = {}) {
  let results = [...MOCK_LISTINGS]

  if (category) results = results.filter((l) => l.category?.slug === category)
  if (region) results = results.filter((l) => l.location?.region === region)
  if (condition && condition !== 'any') results = results.filter((l) => l.condition === condition)
  if (min_price) results = results.filter((l) => l.price >= Number(min_price))
  if (max_price) results = results.filter((l) => l.price <= Number(max_price))
  if (verified_seller === 'true') results = results.filter((l) => l.seller?.id_verified === true)
  if (q) {
    const lq = q.toLowerCase()
    results = results.filter((l) => l.title.toLowerCase().includes(lq) || l.description?.toLowerCase().includes(lq))
  }

  results.sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'popular') return b.views_count - a.views_count
    return new Date(b.created_at) - new Date(a.created_at)
  })

  // Boost priority: spotlight > featured > none
  results.sort((a, b) => {
    const rank = { spotlight: 0, featured: 1, null: 2, undefined: 2 }
    return (rank[a.boost_tier] ?? 2) - (rank[b.boost_tier] ?? 2)
  })

  const total = results.length
  const take = Math.min(Number(limit), 48)
  const skip = (Number(page) - 1) * take
  return { data: results.slice(skip, skip + take), total }
}
