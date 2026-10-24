import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../hooks/useTheme'

// Home hero (both themes): the quadcopter CAD model assembling from a
// blueprint scan, then hovering live beside the headline — rendered in
// src/three/heroScene.js. Callout labels are DOM elements that the scene
// positions every frame over their 3D anchors.
const CALLOUTS = [
  { anchor: 'fc', n: '01', label: 'Flight controller' },
  { anchor: 'motor', n: '02', label: 'Brushless motor' },
  { anchor: 'gimbal', n: '03', label: 'Gimbal camera' },
]

export default function CadHero() {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const canvasRef = useRef(null)
  const contentRef = useRef(null)
  const footRef = useRef(null)
  const labelRefs = useRef([])
  const sceneRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('../three/heroScene.js')
      .then(({ mountHero }) => {
        if (cancelled || !canvasRef.current) return
        sceneRef.current = mountHero(canvasRef.current, {
          dark: document.documentElement.dataset.theme === 'dark',
          labels: labelRefs.current.filter(Boolean),
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setTheme(theme === 'dark')
  }, [theme])

  // Scroll: the copy fades and rises; the drone lifts out of frame
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = sectionRef.current
      if (!el) return
      const s = Math.min(Math.max(-el.getBoundingClientRect().top / (el.offsetHeight || 1), 0), 1)
      sceneRef.current?.setScroll(s)
      if (contentRef.current) {
        contentRef.current.style.opacity = String(Math.max(1 - s * 1.5, 0))
        contentRef.current.style.transform = `translate3d(0, ${(-s * 80).toFixed(1)}px, 0)`
      }
      if (footRef.current) footRef.current.style.opacity = String(Math.max(1 - s * 3, 0))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section className="cad-hero" ref={sectionRef}>
      <div className="cad-hero-grid" aria-hidden="true" />
      <div className="cad-hero-canvas" ref={canvasRef} aria-hidden="true" />
      {failed && <p className="drone3d-fallback">3D view unavailable on this device.</p>}

      <div className="cad-hero-callouts" aria-hidden="true">
        {CALLOUTS.map((c, i) => (
          <div
            key={c.anchor}
            ref={(el) => (labelRefs.current[i] = el)}
            className="cad-callout"
            data-anchor={c.anchor}
          >
            <span className="cad-callout-dot" />
            <span className="cad-callout-line" />
            <span className="cad-callout-label">
              <span className="cad-callout-n">{c.n}</span>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="container cad-hero-content" ref={contentRef}>
        <div className="vh-eyebrow">
          <span className="vh-eyebrow-dot" />
          <span>DRONES · ROBOTICS · INTELLIGENT SYSTEMS</span>
        </div>
        <h1 className="cad-hero-title">
          ENGINEERED
          <br />
          WITHOUT COMPROMISE.
        </h1>
        <p className="cad-hero-desc">
          Drones, robotics and AI for survey, security, public safety and training — from
          Bhubaneswar, Odisha.
        </p>
        <div className="vh-ctas">
          <a className="btn-request" href="#/services">Explore services</a>
          <a className="btn-outline" href="#/contact">[ Talk to us ]</a>
        </div>
      </div>

      <div className="cad-hero-foot" ref={footRef} aria-hidden="true">
        <span>[ LAT 20.2961° N · LON 85.8245° E ]</span>
        <span className="cad-hero-hint">[ LIVE 3D · DRAG TO ROTATE ]</span>
      </div>
    </section>
  )
}
