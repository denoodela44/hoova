const { updateAllScores } = require('../utils/scoreEngine')

async function runScoreUpdate() {
  try { await updateAllScores() }
  catch (err) { console.error('[scoreEngine] update failed:', err.message) }
}

module.exports = { runScoreUpdate }
