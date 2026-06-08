export default function EmptyState({
  title = 'Nothing here yet',
  subtitle = 'Try a different search or adjust your filters.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <SikaConfused />
      <h3
        className="text-lg font-black text-gray-900 mt-6 mb-1"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{subtitle}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

function SikaConfused() {
  /*
   * Three characters, eyes looking DOWN (sad / confused)
   * Compact version — fits inside page content areas
   */
  return (
    <svg
      viewBox="0 0 260 180"
      width="260"
      height="180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 240, height: 'auto', display: 'block' }}
    >
      <defs>
        <style>{`
          @keyframes sika-float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-5px); }
          }
          @keyframes sika-float2 {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-7px); }
          }
          @keyframes sika-float3 {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-4px); }
          }
          .sika-char1 { animation: sika-float  3s ease-in-out infinite; }
          .sika-char2 { animation: sika-float2 3.4s ease-in-out infinite 0.4s; }
          .sika-char3 { animation: sika-float3 2.8s ease-in-out infinite 0.9s; }
        `}</style>
      </defs>

      {/* ── Warm beige base ── */}
      <rect x="0" y="120" width="260" height="60" rx="0" fill="#ECEAE6" />
      <ellipse cx="130" cy="120" rx="130" ry="12" fill="#ECEAE6" />

      {/* ── Rose tall character ── */}
      <g className="sika-char1">
        <rect x="28" y="28" width="64" height="108" rx="14" fill="#B81365" />
        {/* Left eye */}
        <circle cx="51" cy="66" r="9" fill="white" />
        <circle cx="51" cy="72" r="5" fill="#111827" />
        {/* Right eye */}
        <circle cx="76" cy="66" r="9" fill="white" />
        <circle cx="76" cy="72" r="5" fill="#111827" />
        {/* Sad mouth */}
        <path d="M52 90 Q63 84 74 90" stroke="#111827" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* ── Gold capsule character (center, tallest) ── */}
      <g className="sika-char2">
        <rect x="98" y="14" width="64" height="118" rx="32" fill="#FBBF24" />
        {/* Left eye */}
        <circle cx="118" cy="62" r="8" fill="#111827" />
        {/* Right eye */}
        <circle cx="142" cy="62" r="8" fill="#111827" />
        {/* Confused mouth — wavy */}
        <path d="M114 88 Q121 94 130 88 Q139 82 146 88" stroke="#111827" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Question mark above */}
        <text x="122" y="46" fontSize="14" fontWeight="900" fill="#92400e" textAnchor="middle">?</text>
      </g>

      {/* ── Dark navy character ── */}
      <g className="sika-char3">
        <rect x="168" y="46" width="60" height="90" rx="12" fill="#1a1a2e" />
        {/* Left eye */}
        <circle cx="188" cy="80" r="8" fill="white" />
        <circle cx="188" cy="86" r="4.5" fill="#111827" />
        {/* Right eye */}
        <circle cx="212" cy="80" r="8" fill="white" />
        <circle cx="212" cy="86" r="4.5" fill="#111827" />
        {/* Sad mouth */}
        <path d="M188 104 Q200 98 212 104" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
