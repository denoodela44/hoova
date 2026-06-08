const prisma = require('../utils/prisma')

async function expireListings() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
  const result = await prisma.listing.updateMany({
    where: { status: 'active', created_at: { lt: cutoff } },
    data: { status: 'expired' },
  })
  if (result.count > 0) console.log(`[cron] Expired ${result.count} listings`)
}

module.exports = { expireListings }
