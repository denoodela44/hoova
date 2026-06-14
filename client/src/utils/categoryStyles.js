const STYLES = {
  vehicles:                { icon: 'car',                bg: '#EFF6FF', color: '#1D4ED8' },
  'phones-tablets':        { icon: 'device-mobile',      bg: '#F0F9FF', color: '#0284C7' },
  electronics:             { icon: 'device-laptop',      bg: '#F5F3FF', color: '#7C3AED' },
  'home-appliances':       { icon: 'sofa',               bg: '#FEF9C3', color: '#A16207' },
  'real-estate':           { icon: 'home',               bg: '#ECFDF5', color: '#059669' },
  fashion:                 { icon: 'shirt',               bg: '#FFF1F2', color: '#E11D48' },
  'health-beauty':         { icon: 'heart',               bg: '#FDF4FF', color: '#A21CAF' },
  'babies-kids':           { icon: 'baby-carriage',       bg: '#FEF3C7', color: '#B45309' },
  'building-construction': { icon: 'hammer',              bg: '#FFF7ED', color: '#C2410C' },
  agriculture:             { icon: 'plant-2',             bg: '#F0FDF4', color: '#16A34A' },
  services:                { icon: 'tool',                bg: '#F0FDFA', color: '#0D9488' },
  jobs:                    { icon: 'briefcase',           bg: '#FFFBEB', color: '#D97706' },
  sports:                  { icon: 'ball-football',       bg: '#FEF2F2', color: '#DC2626' },
  pets:                    { icon: 'paw',                 bg: '#ECFEFF', color: '#0891B2' },
  food:                    { icon: 'pizza',               bg: '#FFF7ED', color: '#EA580C' },
  other:                   { icon: 'box',                 bg: '#F9FAFB', color: '#6B7280' },
}

const FALLBACK = { icon: 'box', bg: '#F9FAFB', color: '#6B7280' }

export function getCategoryStyle(slug) {
  return STYLES[slug] || FALLBACK
}
