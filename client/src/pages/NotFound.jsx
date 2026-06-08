import { Link } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center"
      style={{ background: '#fff' }}
    >
      <HOOVALost />

      <p
        className="text-6xl font-black mt-6 mb-1"
        style={{ fontFamily: "'Poppins', sans-serif", color: '#ECEAE6', letterSpacing: '-0.04em' }}
      >
        404
      </p>

      <h1
        className="text-2xl font-black text-gray-900 mb-2"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        You got lost, bestie
      </h1>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-8">
        This page doesn't exist. Our characters looked everywhere and found nothing fr fr.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#B81365' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Take me home
        </Link>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-xl border border-gray-200 text-gray-600 transition-all hover:bg-gray-50"
        >
          <Search className="w-4 h-4" />
          Browse listings
        </Link>
      </div>
    </div>
  )
}

function HOOVALost() {
  return (
    <svg
      viewBox="0 0 300 200"
      width="300"
      height="200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 300, height: 'auto', display: 'block' }}
    >
      <defs>
        <style>{`
          @keyframes lost-float1 {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-7px); }
          }
          @keyframes lost-float2 {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-10px); }
          }
          @keyframes lost-float3 {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-6px); }
          }
          @keyframes lost-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes lost-blink {
            0%,90%,100% { transform: scaleY(1); }
            95%          { transform: scaleY(0.1); }
          }
          .char1 { animation: lost-float1 3.2s ease-in-out infinite; }
          .char2 { animation: lost-float2 2.8s ease-in-out infinite 0.5s; }
          .char3 { animation: lost-float3 3.6s ease-in-out infinite 1s; }
          .blink { animation: lost-blink 4s ease-in-out infinite; transform-origin: center; }
          .spin  { animation: lost-spin 6s linear infinite; transform-origin: 150px 30px; }
        `}</style>
      </defs>

      {/* Ground / shadow ellipse */}
      <ellipse cx="150" cy="188" rx="130" ry="10" fill="#ECEAE6" />

      {/* ── Spinning question mark ── */}
      <text
        x="150" y="40"
        fontSize="28" fontWeight="900"
        fill="#B81365" textAnchor="middle"
        className="spin"
        style={{ fontFamily: 'sans-serif' }}
      >
        ?
      </text>

      {/* ── Rose rectangle (left) — looking left confused ── */}
      <g className="char1">
        <rect x="18" y="60" width="72" height="122" rx="16" fill="#B81365" />
        {/* Left eye */}
        <circle cx="43" cy="96" r="10" fill="white" />
        <circle cx="39" cy="99" r="5.5" fill="#111827" className="blink" />
        {/* Right eye */}
        <circle cx="69" cy="96" r="10" fill="white" />
        <circle cx="65" cy="99" r="5.5" fill="#111827" className="blink" />
        {/* Confused squiggle mouth */}
        <path d="M38 118 Q46 124 54 118 Q62 112 70 118" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sweat drop */}
        <ellipse cx="82" cy="76" rx="4" ry="6" fill="#FDA4CF" />
        <ellipse cx="82" cy="72" rx="3" ry="2.5" fill="#FDA4CF" />
      </g>

      {/* ── Gold capsule (center, tallest) — looking up searching ── */}
      <g className="char2">
        <rect x="113" y="40" width="74" height="140" rx="37" fill="#FBBF24" />
        {/* Eyes looking up */}
        <circle cx="136" cy="90" r="10" fill="#111827" />
        <circle cx="164" cy="90" r="10" fill="#111827" />
        {/* Determined / searching mouth */}
        <line x1="136" y1="116" x2="164" y2="116" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
        {/* Magnifying glass held up */}
        <circle cx="150" cy="62" r="9" fill="none" stroke="#92400e" strokeWidth="2.5" />
        <line x1="157" y1="69" x2="163" y2="75" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Dark navy (right) — looking sideways shrugging ── */}
      <g className="char3">
        <rect x="210" y="78" width="68" height="104" rx="14" fill="#1a1a2e" />
        {/* Left eye */}
        <circle cx="232" cy="110" r="9" fill="white" />
        <circle cx="236" cy="113" r="5" fill="#111827" />
        {/* Right eye */}
        <circle cx="258" cy="110" r="9" fill="white" />
        <circle cx="262" cy="113" r="5" fill="#111827" />
        {/* Shrug mouth */}
        <path d="M232 134 Q244 140 258 134" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Shrug arms */}
        <line x1="210" y1="118" x2="196" y2="108" stroke="#1a1a2e" strokeWidth="5" strokeLinecap="round" />
        <line x1="278" y1="118" x2="290" y2="108" stroke="#1a1a2e" strokeWidth="5" strokeLinecap="round" />
        {/* Shrug hands */}
        <circle cx="194" cy="106" r="5" fill="#1a1a2e" />
        <circle cx="292" cy="106" r="5" fill="#1a1a2e" />
      </g>
    </svg>
  )
}
