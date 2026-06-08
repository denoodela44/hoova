import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

function injectScript(id, src, inline) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  if (src) { s.src = src; s.async = true }
  if (inline) s.textContent = inline
  document.head.appendChild(s)
}

function injectMeta(name, content) {
  if (document.querySelector(`meta[name="${name}"]`)) return
  const m = document.createElement('meta')
  m.name = name
  m.content = content
  document.head.appendChild(m)
}

function injectRaw(id, html, target = 'head') {
  if (document.getElementById(id)) return
  const wrap = document.createElement('div')
  wrap.id = id
  wrap.innerHTML = html
  ;(target === 'head' ? document.head : document.body).appendChild(wrap)
}

export default function TrackingInjector() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/settings/public').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 min — don't hammer the endpoint
    retry: false,
  })

  useEffect(() => {
    if (!data) return

    // ── Google Tag Manager ────────────────────────────────────────
    if (data.gtm_id) {
      injectScript('gtm-head', null, `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${data.gtm_id}');
      `)
    }

    // ── Google Analytics 4 ────────────────────────────────────────
    if (data.ga4_id && !data.gtm_id) {
      injectScript('ga4-src', `https://www.googletagmanager.com/gtag/js?id=${data.ga4_id}`)
      injectScript('ga4-init', null, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${data.ga4_id}');
      `)
    }

    // ── Google Ads ────────────────────────────────────────────────
    if (data.google_ads_id && !data.gtm_id) {
      injectScript('gads-src', `https://www.googletagmanager.com/gtag/js?id=${data.google_ads_id}`)
      injectScript('gads-init', null, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${data.google_ads_id}');
      `)
    }

    // ── Meta Pixel ────────────────────────────────────────────────
    if (data.meta_pixel_id) {
      injectScript('meta-pixel', null, `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${data.meta_pixel_id}');
        fbq('track', 'PageView');
      `)
    }

    // ── Google Search Console verification ────────────────────────
    if (data.gsc_verification) {
      // Accept either a file name (googleXXX.html) or raw content="..." value
      const val = data.gsc_verification.trim()
      const content = val.includes('.html') ? val.replace('.html', '') : val
      injectMeta('google-site-verification', content)
    }

    // ── Custom head scripts ───────────────────────────────────────
    if (data.custom_head_scripts) {
      injectRaw('custom-head-scripts', data.custom_head_scripts, 'head')
    }

    // ── Custom body scripts ───────────────────────────────────────
    if (data.custom_body_scripts) {
      injectRaw('custom-body-scripts', data.custom_body_scripts, 'body')
    }
  }, [data])

  return null
}
