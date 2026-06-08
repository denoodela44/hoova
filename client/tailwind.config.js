/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Brand palette ── */
        primary:   '#B81365',   // Hot Rose
        'primary-dark': '#9c1056',
        'primary-light': '#F8C0C8', // Pastel Pink
        accent:    '#BFAB25',   // Old Gold
        'accent-dark': '#a8941f',
        ink:       '#222222',   // near-black text
        snow:      '#FFFFFF',   // pure white surface

        /* ── Neutral surface ── */
        surface:   '#ffffff',
        muted:     '#6B7280',
        subtle:    '#9CA3AF',

        /* ── brand maps to Hot Rose so legacy text-brand-* classes work ── */
        brand: {
          50:  '#fdf2f5',
          100: '#F8C0C8',
          200: '#f099b0',
          300: '#e06690',
          400: '#cc3878',
          500: '#B81365',
          600: '#9c1056',
          700: '#7d0c44',
        },
        accent2: {
          500: '#B81365',
          600: '#9c1056',
        },
        purple: {
          700: '#B81365',
          800: '#9c1056',
        },
        dark: {
          bg:      '#0f172a',
          surface: '#1e293b',
          border:  '#334155',
        },
      },

      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'DM Sans', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['14px', { lineHeight: '1.5' }],
        base:  ['16px', { lineHeight: '1.6' }],
        lg:    ['18px', { lineHeight: '1.5' }],
        xl:    ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['30px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.1' }],
        '5xl': ['48px', { lineHeight: '1.05' }],
        '6xl': ['60px', { lineHeight: '1' }],
      },

      spacing: {
        0.5: '2px',
        1:   '4px',
        1.5: '6px',
        2:   '8px',
        2.5: '10px',
        3:   '12px',
        3.5: '14px',
        4:   '16px',
        5:   '20px',
        6:   '24px',
        7:   '28px',
        8:   '32px',
        9:   '36px',
        10:  '40px',
        12:  '48px',
        14:  '56px',
        16:  '64px',
        20:  '80px',
        24:  '96px',
      },

      borderRadius: {
        sm:  '6px',
        DEFAULT: '8px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },

      boxShadow: {
        xs:   '0 1px 2px rgba(0,0,0,0.04)',
        sm:   '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        card: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        md:   '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
        lg:   '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)',
        xl:   '0 16px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },

      animation: {
        'fade-in':  'fadeIn 200ms cubic-bezier(0.4,0,0.2,1)',
        'slide-up': 'slideUp 250ms cubic-bezier(0.4,0,0.2,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
