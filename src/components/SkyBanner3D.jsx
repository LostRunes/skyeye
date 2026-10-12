import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ik } from '../cdn'
import { useTheme } from '../hooks/useTheme'

// Skyvertising: the Sky Eye drone towing a vertical logo banner.
// Laptops and up — it flies around the Skyvertising info itself: a fixed,
// click-through layer keeps the drone along the side margins (overlapping the
// content edge where the margin is narrow), crossing from one side to the
// other, arcing up and over, as you scroll. Tablets and phones get a compact stage instead,
// so the banner never sits over the text being read (single-column layouts).
// Hover or tap the banner and it ripples, flips and flows.

const LOGO = ik('site/logo-mark-light.png', 'h-400')
const MIN_WIDTH = 1024 // below this (tablets, phones), use the compact stage

const smooth = (t) => t * t * (3 - 2 * t)
const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

// Margin geometry for the Skyvertising section
function gutters() {
  const box = document.querySelector('#skyvertising .container')
  if (!box) return null
  const r = box.getBoundingClientRect()
  const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0
  const left = r.left + pad
  return { left, right: window.innerWidth - left, width: left }
}

// Which side (0 = left, 1 = right) at section progress p: three crossings
const SIDES = [
  [0, 1],
  [0.22, 1],
  [0.34, 0],
  [0.56, 0],
  [0.68, 1],
  [1, 1],
]
function sideAt(p) {
  for (let i = 0; i < SIDES.length - 1; i++) {
    const [p0, s0] = SIDES[i]
    const [p1, s1] = SIDES[i + 1]
    if (p >= p0 && p <= p1) return s0 + (s1 - s0) * smooth((p - p0) / (p1 - p0))
  }
  return p < 0 ? 1 : SIDES[SIDES.length - 1][1]
}

function useWideEnough() {
  const check = () => window.innerWidth >= MIN_WIDTH
  const [wide, setWide] = useState(check)
  useEffect(() => {
    const onResize = () => setWide(check())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return wide
}

function useBannerScene(hostRef, mode, theme) {
  const sceneRef = useRef(null)
  useEffect(() => {
    let cancelled = false
    import('../three/bannerScene.js').then(({ mountBanner }) => {
      if (cancelled || !hostRef.current) return
      sceneRef.current = mountBanner(hostRef.current, {
        dark: document.documentElement.dataset.theme === 'dark',
        mode,
        logoUrl: LOGO,
      })
    })
    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [hostRef, mode])
  useEffect(() => {
    sceneRef.current?.setTheme(theme === 'dark')
  }, [theme])
  return sceneRef
}

function FlyingBanner() {
  const { theme } = useTheme()
  const layerRef = useRef(null)
  const sceneRef = useBannerScene(layerRef, 'overlay', theme)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const s = sceneRef.current
      const section = document.getElementById('skyvertising')
      const g = gutters()
      if (!s || !section || !g) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const r = section.getBoundingClientRect()
      // Progress of the screen's centre line through the section
      const p = (vh * 0.5 - r.top) / r.height
      // Fixed, comfortable size; centred in the margin when there is room,
      // otherwise kept just inside the screen edge, overlapping the content
      const size = Math.min(124, Math.max(96, vw * 0.075))
      const inset = Math.max(g.width / 2, size * 1.15 + 18)
      const leftX = inset
      const rightX = vw - inset
      if (p < -0.05) {
        s.setPose({ x: vw + 160, y: vh * 0.25, size, show: 0 })
        return
      }
      if (p > 1.02) {
        s.setPose({ x: -200, y: vh * 0.3, size, show: 0 })
        return
      }
      const side = sideAt(clamp01(p))
      const crossing = 1 - Math.abs(side * 2 - 1) // 0 at a side, 1 mid-crossing
      s.setPose({
        x: leftX + (rightX - leftX) * side,
        y: vh * 0.56 - crossing * vh * 0.24,
        size,
        show: 1,
      })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const id = setInterval(update, 500) // until the scene has loaded, and on layout shifts
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(id)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [sceneRef])

  // Portalled to <body>: the page wrapper animates with a transform, which
  // would otherwise make this "fixed" layer scroll with the page.
  return createPortal(<div className="skybanner-fly" ref={layerRef} aria-hidden="true" />, document.body)
}

function InlineBanner() {
  const { theme } = useTheme()
  const stageRef = useRef(null)
  useBannerScene(stageRef, 'inline', theme)
  return (
    <section className="skybanner" aria-label="Skyvertising — a drone towing a banner">
      <div className="skybanner-stage" ref={stageRef} />
      <div className="skybanner-hud" aria-hidden="true">
        <span className="skybanner-hint">HOVER THE BANNER</span>
      </div>
    </section>
  )
}

export default function SkyBanner3D() {
  const wide = useWideEnough()
  return wide ? <FlyingBanner /> : <InlineBanner />
}
