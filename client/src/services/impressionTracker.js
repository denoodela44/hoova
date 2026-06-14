import api from './api'

// Tracks which listing IDs have been impressed this session (prevents duplicates)
const impressed = new Set()
let flushTimer = null
const pending = new Set()

function flush() {
  flushTimer = null
  if (pending.size === 0) return
  const ids = [...pending]
  pending.clear()
  api.post('/listings/impressions', { ids }).catch(() => {})
}

export function trackImpression(listingId) {
  if (!listingId || impressed.has(listingId)) return
  impressed.add(listingId)
  pending.add(listingId)
  // Batch flush after 1.5s of inactivity
  clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, 1500)
}
