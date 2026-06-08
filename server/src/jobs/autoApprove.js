const prisma = require('../utils/prisma')

// Runs every 5 minutes via cron.
// Finds pending listings whose auto_approve_at has passed and promotes them to soft_live.
// Flagged listings are EXCLUDED — they stay pending until admin reviews them.
async function autoApprovePending() {
  try {
    const now = new Date()

    const due = await prisma.listing.findMany({
      where: {
        status:          'pending',
        is_flagged:      false,
        auto_approve_at: { lte: now },
      },
      select: { id: true, title: true, user_id: true },
    })

    if (!due.length) return

    // Promote to soft_live in one batch
    await prisma.listing.updateMany({
      where: { id: { in: due.map((l) => l.id) } },
      data:  { status: 'soft_live' },
    })

    // Notify each seller
    await Promise.all(
      due.map((l) =>
        prisma.notification.create({
          data: {
            user_id: l.user_id,
            type:    'system',
            title:   'Your listing is now partially live',
            body:    `"${l.title}" is now visible to buyers while our team finishes reviewing it. You'll get another update once it's fully approved.`,
            data:    { listing_id: l.id, status: 'soft_live' },
          },
        })
      )
    )

    console.log(`[autoApprove] Promoted ${due.length} listing(s) to soft_live`)
  } catch (err) {
    console.error('[autoApprove] Error:', err.message)
  }
}

// Also runs at the same cadence — re-flags any soft_live listing that was later found
// to match a rule (e.g. admin added a new keyword and reruns the scan).
// This is a no-op unless you call reScanlisting() explicitly.

module.exports = { autoApprovePending }
