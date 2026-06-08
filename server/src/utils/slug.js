const prisma = require('./prisma')

/**
 * Convert a name to a URL-safe slug.
 * "Kwame Asante Motors" → "kwame-asante-motors"
 */
function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9\s-]/g, '')      // keep letters, digits, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/-+/g, '-')               // collapse consecutive hyphens
    .slice(0, 32)
}

/**
 * Generate a unique store slug for a new user.
 * If "kwame-asante" is taken, tries "kwame-asante-2", "kwame-asante-3", etc.
 *
 * @param {string} name  The user's full name or business name
 * @param {string} [excludeId]  User ID to exclude from uniqueness check (for updates)
 */
async function generateUniqueSlug(name, excludeId) {
  const base = toSlug(name) || 'seller'
  let candidate = base
  let suffix = 2

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { store_slug: candidate },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${suffix}`
    suffix++
  }
}

module.exports = { toSlug, generateUniqueSlug }
