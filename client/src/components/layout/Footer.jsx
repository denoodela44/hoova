import { Link } from 'react-router-dom'
import Logo from './Logo'

const cats = ['Vehicles', 'Electronics', 'Real Estate', 'Fashion', 'Jobs', 'Services', 'Furniture', 'Agriculture']
const links = [
  { label: 'About HOOVA', to: '/about' },
  { label: 'Safety Tips', to: '/safety' },
  { label: 'Help & FAQ', to: '/help' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
]

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-dark-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" aria-label="HOOVA Ghana — Home">
            <Logo size={24} />
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Ghana's premier classifieds marketplace.<br />Buy. Sell. Find Value.
          </p>
          <div className="mt-4 flex gap-3">
            <SocialIcon label="Facebook" href="#" />
            <SocialIcon label="Twitter" href="#" />
            <SocialIcon label="Instagram" href="#" />
            <SocialIcon label="WhatsApp" href="#" />
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">Categories</h4>
          <ul className="space-y-1.5">
            {cats.map((c) => (
              <li key={c}>
                <Link
                  to={`/browse?category=${encodeURIComponent(c.toLowerCase())}`}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">Quick Links</h4>
          <ul className="space-y-1.5">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">Sell Smarter</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Reach thousands of buyers. Post your first ad free.
          </p>
          <Link to="/post" className="btn-primary text-xs">Post Free Ad</Link>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} HOOVA Ghana. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ label, href }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-brand-100 hover:text-brand-700 transition-colors text-xs font-bold"
    >
      {label[0]}
    </a>
  )
}
