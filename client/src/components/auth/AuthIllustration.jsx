import { Link } from 'react-router-dom'
import Logo from '../layout/Logo'

export default function AuthIllustration({ pwdFocused = false }) {
  return (
    <div
      className="hidden lg:flex flex-col w-[52%] xl:w-[55%] h-full relative overflow-hidden select-none"
      style={{ background: '#ECEAE6' }}
    >
      <div className="p-8 shrink-0">
        <Logo markColor="#B81365" textColor="#222222" size={26} />
      </div>

      <div className="flex-1 flex items-end justify-center px-8">
        <SikaCharacters pwdFocused={pwdFocused} />
      </div>

      <div className="px-10 pt-4 pb-5 shrink-0">
        <p
          className="font-black leading-tight"
          style={{ fontFamily: "'Poppins', sans-serif", fontSize: 26, color: '#111827' }}
        >
          Ghana's smartest<br />marketplace.
        </p>
        <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
          Buy, sell and discover great deals across Ghana.
        </p>
      </div>

      <div className="flex gap-5 px-10 pb-7 shrink-0 text-xs" style={{ color: '#9ca3af' }}>
        {[
          ['Privacy Policy', '/privacy'],
          ['Terms of Service', '/terms'],
          ['Contact', '/contact'],
        ].map(([label, to]) => (
          <Link key={to} to={to} className="hover:text-gray-600 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function HOOVACharacters({ pwdFocused }) {
  /*
   * Normal state  → pupils look RIGHT (toward the login form)
   * Password focus → pupils look DOWN (respectful of privacy)
   *
   * Both cx and cy are animated via SVG 2 CSS geometry properties.
   * Chrome 65+, Firefox 72+, Safari 14+ support transitioning these.
   */

  // Rose character  (sclera r=16, pupil r=8.5 → max safe shift 7.5u)
  const rL = { cx: pwdFocused ? 140 : 146, cy: pwdFocused ? 114 : 108 }
  const rR = { cx: pwdFocused ? 184 : 190, cy: pwdFocused ? 114 : 108 }

  // Dark character  (sclera r=13, pupil r=7 → max safe shift 6u)
  const dL = { cx: pwdFocused ? 258 : 263, cy: pwdFocused ? 210 : 205 }
  const dR = { cx: pwdFocused ? 296 : 301, cy: pwdFocused ? 210 : 205 }

  // Peach blob      (no sclera — free to shift)
  const bL = { cx: pwdFocused ? 145 : 151, cy: pwdFocused ? 422 : 416 }
  const bR = { cx: pwdFocused ? 245 : 251, cy: pwdFocused ? 422 : 416 }

  return (
    <svg
      viewBox="0 0 420 460"
      width="420"
      height="460"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block' }}
    >
      <defs>
        <style>{`
          .hoova-pupil {
            transition:
              cx 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
              cy 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </defs>

      {/* ── Rose tall rectangle ── */}
      <rect x="90" y="18" width="142" height="290" rx="20" fill="#B81365" />
      <circle cx="140" cy="108" r="16" fill="white" />
      <circle cx={rL.cx} cy={rL.cy} r="8.5" fill="#111827" className="hoova-pupil" />
      <circle cx="184" cy="108" r="16" fill="white" />
      <circle cx={rR.cx} cy={rR.cy} r="8.5" fill="#111827" className="hoova-pupil" />

      {/* ── Dark navy rectangle ── */}
      <rect x="220" y="142" width="116" height="218" rx="18" fill="#1a1a2e" />
      <circle cx="258" cy="205" r="13" fill="white" />
      <circle cx={dL.cx} cy={dL.cy} r="7" fill="#111827" className="hoova-pupil" />
      <circle cx="296" cy="205" r="13" fill="white" />
      <circle cx={dR.cx} cy={dR.cy} r="7" fill="#111827" className="hoova-pupil" />

      {/* ── Peach blob ── */}
      <ellipse cx="195" cy="485" rx="182" ry="160" fill="#F4956A" />
      <circle cx={bL.cx} cy={bL.cy} r="12" fill="#111827" className="hoova-pupil" />
      <circle cx={bR.cx} cy={bR.cy} r="12" fill="#111827" className="hoova-pupil" />

      {/* ── Gold capsule (expressionless, static) ── */}
      <rect x="290" y="268" width="115" height="200" rx="56" fill="#FBBF24" />
      <circle cx="322" cy="337" r="10" fill="#111827" />
      <circle cx="362" cy="337" r="10" fill="#111827" />
      <line x1="318" y1="372" x2="366" y2="372" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}
