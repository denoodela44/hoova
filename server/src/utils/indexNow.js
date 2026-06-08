const https = require('https')

const BASE_URL  = process.env.SITE_URL      || 'https://sika.com.gh'
const API_KEY   = process.env.INDEXNOW_KEY  || ''
const HOST      = new URL(BASE_URL).hostname  // 'sika.com.gh'

// IndexNow endpoint — submitting here notifies Bing, Yandex, and via partnership, Google.
const INDEXNOW_HOST = 'api.indexnow.org'

/**
 * Ping IndexNow with one or more URLs so search engines index them immediately.
 * Fire-and-forget — never throws, never blocks the caller.
 *
 * @param {string | string[]} urls  Absolute URLs to submit
 */
function pingIndexNow(urls) {
  if (!API_KEY) return  // skip silently if key not configured
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean)
  if (!list.length) return

  const body = JSON.stringify({
    host: HOST,
    key: API_KEY,
    keyLocation: `${BASE_URL}/${API_KEY}.txt`,
    urlList: list,
  })

  const options = {
    hostname: INDEXNOW_HOST,
    path: '/indexnow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    },
  }

  const req = https.request(options, (res) => {
    // 200 = accepted, 202 = queued — both are fine
    if (res.statusCode !== 200 && res.statusCode !== 202) {
      console.warn('[IndexNow] Unexpected status:', res.statusCode)
    }
  })

  req.on('error', (err) => console.warn('[IndexNow] Ping failed:', err.message))
  req.write(body)
  req.end()
}

module.exports = { pingIndexNow }
