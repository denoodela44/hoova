export default function Logo({ markColor = '#B81365', textColor = '#222222', size = 30 }) {
  const h = size
  const w = size

  // 5-rectangle geometric S mark, drawn in a 32×32 coordinate space
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.35) }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Top bar */}
        <rect x="0" y="0"  width="32" height="6"  rx="1.5" fill={markColor} />
        {/* Top-right arm */}
        <rect x="26" y="6"  width="6"  height="6"  rx="1.5" fill={markColor} />
        {/* Middle bar */}
        <rect x="0" y="12" width="32" height="6"  rx="1.5" fill={markColor} />
        {/* Bottom-left arm */}
        <rect x="0" y="18" width="6"  height="8"  rx="1.5" fill={markColor} />
        {/* Bottom bar */}
        <rect x="0" y="26" width="32" height="6"  rx="1.5" fill={markColor} />
        {/* Extra rounding cap at very bottom to close the 36-unit viewBox */}
      </svg>

      <span
        style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 900,
          fontSize: Math.round(size * 0.8),
          letterSpacing: '-0.04em',
          color: textColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        Hoova
      </span>
    </span>
  )
}
