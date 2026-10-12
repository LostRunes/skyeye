// The "jumbled to word" decode from anduril.com's menu, measured off the live
// site: the first letter holds, every other letter is noise that settles
// left to right over ~480ms, spaces and punctuation never move, and the noise
// re-rolls ~16 times a second rather than every frame — which is what makes it
// read as smooth instead of flickery.
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = LOWER.toUpperCase()
const DIGITS = '0123456789'

const noiseFor = (ch) => {
  if (/[a-z]/.test(ch)) return LOWER[(Math.random() * 26) | 0]
  if (/[A-Z]/.test(ch)) return UPPER[(Math.random() * 26) | 0]
  if (/[0-9]/.test(ch)) return DIGITS[(Math.random() * 10) | 0]
  return ch // spaces, slashes, dots, ampersands stay put
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Decode `text` into `el.textContent`. Returns a cancel function.
 * Positions resolve on an ease-out curve, so the tail of the word settles
 * gently instead of snapping.
 */
export function scramble(el, text, { duration = 480, keepFirst = true, rate = 60 } = {}) {
  if (!el) return () => {}
  if (prefersReducedMotion() || !text) {
    el.textContent = text
    return () => {}
  }
  const chars = [...text]
  const n = chars.length
  let frame = 0
  let lastRoll = -Infinity
  let noise = chars.map(noiseFor)
  const start = performance.now()

  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration)
    const settled = Math.floor(easeOutCubic(t) * n)
    if (now - lastRoll >= rate) {
      noise = chars.map(noiseFor)
      lastRoll = now
    }
    let out = ''
    for (let i = 0; i < n; i++) {
      out += i < settled || (keepFirst && i === 0) ? chars[i] : noise[i]
    }
    el.textContent = out
    if (t < 1) frame = requestAnimationFrame(tick)
    else el.textContent = text
  }
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    el.textContent = text
  }
}

/**
 * Decode every matching label once, the first time it scrolls into view.
 * Used for the small mono section labels so the whole page shares the effect.
 */
export function scrambleOnView(selector, root = document) {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  const cancels = []
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        observer.unobserve(e.target)
        const text = e.target.dataset.text || e.target.textContent
        e.target.dataset.text = text
        cancels.push(scramble(e.target, text, { duration: 620 }))
      })
    },
    { threshold: 0.6 }
  )
  root.querySelectorAll(selector).forEach((el) => observer.observe(el))
  return () => {
    observer.disconnect()
    cancels.forEach((c) => c())
  }
}
