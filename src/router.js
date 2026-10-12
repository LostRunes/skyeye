import { useEffect, useState } from 'react'

// A small hash router: the site is split into pages (#/about, #/services/...)
// so it works on any static host without rewrite rules. Old in-page anchors
// (#contact, #engineering, ...) still work — they are mapped onto the page
// that now holds that section, with `to` naming the section to scroll to.
export const PAGES = [
  '/',
  '/about',
  '/services',
  '/services/skyvertising',
  '/services/courses',
  '/services/drone-as-a-service',
  '/gallery',
  '/contact',
]

const LEGACY = {
  home: ['/'],
  top: ['/'],
  overview: ['/', 'overview'],
  about: ['/about'],
  engineering: ['/about', 'engineering'],
  rnd: ['/about', 'rnd'],
  'track-record': ['/about', 'track-record'],
  services: ['/services'],
  skyvertising: ['/services/skyvertising'],
  courses: ['/services/courses'],
  'drone-services': ['/services/drone-as-a-service'],
  'drone-as-a-service': ['/services/drone-as-a-service'],
  gallery: ['/gallery'],
  photos: ['/gallery', 'photos'],
  contact: ['/contact'],
}

/** Parse a location hash into { path, to }. */
export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#/, '')
  if (!raw.startsWith('/')) {
    const legacy = LEGACY[raw]
    if (legacy) return { path: legacy[0], to: legacy[1] || null, legacy: true }
    return { path: '/', to: null, legacy: !!raw }
  }
  const [p, q = ''] = raw.split('?')
  const path = PAGES.includes(p.replace(/\/$/, '') || '/') ? p.replace(/\/$/, '') || '/' : '/'
  const to = new URLSearchParams(q).get('to')
  return { path, to }
}

export const href = (path, to) => `#${path}${to ? `?to=${to}` : ''}`

// The service a visitor came from ("Request this service" buttons carry a
// data-service) is handed to the contact form across the page change.
let pendingService = null
export const takePendingService = () => {
  const s = pendingService
  pendingService = null
  return s
}

// Scroll through Lenis when it is running so it stays in sync.
export const scrollToTop = (smooth) => {
  if (window.__lenis) window.__lenis.scrollTo(0, { immediate: !smooth, force: true })
  else window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' })
}

export const scrollToSection = (id) => {
  // Wait two frames so the new page has laid out before measuring.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const go = (smooth) => {
        const el = document.getElementById(id)
        if (!el) return
        const y = el.getBoundingClientRect().top + window.scrollY - 64
        if (window.__lenis) {
          // The page may have just changed height; let Lenis re-measure first
          window.__lenis.resize()
          window.__lenis.scrollTo(y, { immediate: !smooth, force: true })
        } else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'instant' })
      }
      go(true)
      // Images above the target can still be loading — re-aim once they settle
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el && Math.abs(el.getBoundingClientRect().top - 64) > 40) go(true)
      }, 1200)
    })
  )
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.('a[data-service]')
      if (a) pendingService = a.dataset.service
    }
    const onHash = () => {
      const next = parseHash()
      if (next.legacy) {
        history.replaceState(null, '', href(next.path, next.to))
      }
      const prev = current.path
      current.path = next.path
      if (prev !== next.path) scrollToTop(false)
      if (next.to) scrollToSection(next.to)
      else if (prev === next.path) scrollToTop(true)
      setRoute({ path: next.path, to: next.to })
    }
    // Canonicalise a legacy hash on first load as well.
    const first = parseHash()
    const current = { path: first.path }
    if (first.legacy) history.replaceState(null, '', href(first.path, first.to))
    if (first.to) scrollToSection(first.to)

    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', onHash)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  return route
}
