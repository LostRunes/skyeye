import { useEffect, useRef, useState } from 'react'
import { clamp, piecewise, beatVisibility, smoothstep } from '../utils/motion'
import { CDN, photo } from '../cdn'
import { useImageSequence } from '../hooks/useImageSequence'
import { useTheme } from '../hooks/useTheme'
import DriftWall from './DriftWall'

// The scroll-driven drone from the Yogisha build, now the About Us section.
// Two acts share one scroll timeline: the assembly/zoom act (frames2) runs
// from 0 to SPLIT, then a hard cut hands over to the fold/unfold act (frames).
const SEQUENCES = [
  { key: 'assembly', folder: `${CDN}/frames2`, count: 90 },
  { key: 'flight', folder: `${CDN}/frames`, count: 57 },
]

const SPLIT = 0.72

const FRAME_CURVE_ASSEMBLY = [
  { p: 0, v: 0 },
  { p: 0.1, v: 0.02 },
  { p: 0.56, v: 0.708 },
  { p: SPLIT, v: 1 },
]

const FRAME_CURVE_FLIGHT = [
  { p: SPLIT, v: 0 },
  { p: 1, v: 1 },
]

// -1 = left third, 0 = centred, 1 = right third.
const X_CURVE = [
  { p: 0, v: 0 },
  { p: 0.18, v: 0 },
  { p: 0.34, v: -1 },
  { p: 0.56, v: -1 },
  { p: SPLIT, v: 1 },
  { p: SPLIT, v: 0 },
  { p: SPLIT + 0.16 * (1 - SPLIT), v: -1 },
  { p: SPLIT + 0.55 * (1 - SPLIT), v: 1 },
  { p: 1, v: 1 },
]

const ZOOM_CURVE = [
  { p: 0.6, v: 1 },
  { p: SPLIT, v: 1.85 },
  { p: SPLIT, v: 1 },
  { p: 1, v: 1 },
]

const CANVAS_REVEAL_END = 0.05
const BACKGROUND_REVEAL_START = SPLIT

const INTRO_RANGE = [-0.05, 0.14]
const PANEL_1_RANGE = [0.2, 0.56]
const PANEL_2_RANGE = [0.56, SPLIT]
const PANEL_3_RANGE = [SPLIT + 0.5 * (1 - SPLIT), 1.06]

const SMOOTHING = 0.09
const SETTLE_EPSILON = 0.0006

// Act two's drifting wall is built from the company's own field photos.
const DRIFT_ITEMS = [
  ['agri', 131], ['survey', 192], ['edu', 344], ['rnd', 264], ['govt', 569], ['labs', 590],
  ['agri', 141], ['survey', 237], ['course', 36], ['rnd', 266], ['edu', 356], ['aerial', 648],
].map(([cat, n]) => ({ image: photo(cat, n, 'w-420,h-280,fo-auto,q-60'), title: '' }))

const STATS = [
  { value: '2022', label: 'Incorporated' },
  { value: 'Bhubaneswar', label: 'Headquarters, Odisha' },
  { value: 'Aerospace', label: 'Industry' },
]

/** Nearest loaded frame to `idx`, so a half-streamed sequence still draws. */
const nearest = (arr, idx) => {
  if (arr[idx]) return arr[idx]
  for (let d = 1; d < arr.length; d++) {
    if (arr[idx - d]) return arr[idx - d]
    if (arr[idx + d]) return arr[idx + d]
  }
  return null
}

export default function DroneJourney({ scrollLength = 560 }) {
  const { theme } = useTheme()
  const containerRef = useRef(null)
  const backgroundRef = useRef(null)
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const introRef = useRef(null)
  const panel1Ref = useRef(null)
  const panel2Ref = useRef(null)
  const panel3Ref = useRef(null)

  const rawRef = useRef(0)
  const smoothedRef = useRef(0)
  const runningRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const reducedMotionRef = useRef(false)

  // Frames only start streaming as the section approaches.
  const [near, setNear] = useState(false)
  const { images, progress } = useImageSequence(SEQUENCES, near)
  const renderRef = useRef(() => {})

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '150% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const applyBeat = (el, range) => {
    if (!el) return
    const { opacity, translate } = beatVisibility(smoothedRef.current, range)
    el.style.opacity = opacity
    el.style.transform = `translateY(${translate}px)`
    el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
  }

  const render = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const background = backgroundRef.current
    if (!canvas || !wrap) return
    const { w, h, dpr } = sizeRef.current
    const p = smoothedRef.current

    const useFlight = p >= SPLIT
    const active = useFlight ? images.flight : images.assembly
    const curve = useFlight ? FRAME_CURVE_FLIGHT : FRAME_CURVE_ASSEMBLY

    if (w > 0 && h > 0) {
      const idx = clamp(Math.round(piecewise(p, curve) * (active.length - 1)), 0, active.length - 1)
      const img = nearest(active, idx)
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (img) {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        if (iw && ih) {
          const scale = Math.min(w / iw, h / ih)
          const dw = iw * scale
          const dh = ih * scale
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
          ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
        }
      }
    }

    const mobile = window.innerWidth <= 820
    const maxOffset = mobile ? 0 : Math.min(window.innerWidth * 0.29, 460)
    const xValue = piecewise(p, X_CURVE)
    const zoomValue = mobile ? 1 : piecewise(p, ZOOM_CURVE)
    wrap.style.transform = `translate(-50%, -50%) translateX(${xValue * maxOffset}px) scale(${zoomValue})`
    wrap.style.opacity = smoothstep(0, CANVAS_REVEAL_END, p)

    if (background) {
      background.style.opacity = smoothstep(BACKGROUND_REVEAL_START, BACKGROUND_REVEAL_START + 0.03, p)
    }

    applyBeat(introRef.current, INTRO_RANGE)
    applyBeat(panel1Ref.current, PANEL_1_RANGE)
    applyBeat(panel2Ref.current, PANEL_2_RANGE)
    applyBeat(panel3Ref.current, PANEL_3_RANGE)
  }
  renderRef.current = render

  const tick = () => {
    const raw = rawRef.current
    const smoothed = smoothedRef.current
    const factor = reducedMotionRef.current ? 1 : SMOOTHING
    const next = smoothed + (raw - smoothed) * factor

    if (Math.abs(raw - next) < SETTLE_EPSILON) {
      smoothedRef.current = raw
      renderRef.current()
      runningRef.current = false
      return
    }
    smoothedRef.current = next
    renderRef.current()
    requestAnimationFrame(tick)
  }

  const ensureRunning = () => {
    if (!runningRef.current) {
      runningRef.current = true
      requestAnimationFrame(tick)
    }
  }

  // Redraw as frames stream in, so the drone appears without a scroll nudge.
  useEffect(() => {
    renderRef.current()
  }, [progress])

  useEffect(() => {
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      rawRef.current = total > 0 ? clamp(-rect.top / total) : rect.top <= 0 ? 1 : 0
      ensureRunning()
    }

    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      sizeRef.current = { w: rect.width, h: rect.height, dpr }
    }

    resize()
    measure()
    renderRef.current()

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        measure()
      })
    }
    const onResize = () => {
      resize()
      measure()
    }

    const ro = new ResizeObserver(onResize)
    if (canvasRef.current) ro.observe(canvasRef.current)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loading = near && progress < 0.35

  return (
    <section ref={containerRef} className="journey" style={{ height: `${scrollLength}vh` }} aria-label="About Sky Eye Technology">
      <div className="journey__stage">
        <div className="journey__background" ref={backgroundRef}>
          <DriftWall
            items={DRIFT_ITEMS}
            columns={5}
            tileWidth={200}
            tileHeight={132}
            gap={18}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={theme === 'dark' ? 0.55 : 0.35}
            overlayColor={theme === 'dark' ? '#0b0b0c' : '#faf9f7'}
            radius={14}
            roll={0}
            pauseOnHover={false}
            grayscale
          />
        </div>

        <div className="journey__canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="journey__canvas" aria-hidden="true" />
        </div>

        <div className="journey__intro" ref={introRef}>
          <div className="journey__intro-inner">
            <span className="section-label">01 / ABOUT US</span>
            <h2 className="journey__display">
              WE BUILD SYSTEMS
              <br />
              THAT MOVE.
            </h2>
            <p className="journey__intro-sub">
              Scroll to assemble the aircraft — every part of it designed, built and flown in
              Bhubaneswar.
            </p>
          </div>
        </div>

        <div className="journey__panel journey__panel--right" ref={panel1Ref}>
          <div className="journey__panel-inner">
            <span className="journey__index">01</span>
            <h3 className="journey__display-md">
              BUILT FOR
              <br />
              PRECISION
            </h3>
            <p className="journey__copy">
              Every flight begins with engineering discipline — from design and assembly through
              testing and commissioning.
            </p>
            <div className="spec-list">
              <div className="spec-list__item">
                <span className="spec-list__value">UAVs</span>
                <span className="spec-list__label">Professional drones</span>
              </div>
              <div className="spec-list__item">
                <span className="spec-list__value">Robotics</span>
                <span className="spec-list__label">BOT systems</span>
              </div>
              <div className="spec-list__item">
                <span className="spec-list__value">AI</span>
                <span className="spec-list__label">Generative AI</span>
              </div>
            </div>
          </div>
        </div>

        <div className="journey__panel journey__panel--left" ref={panel2Ref}>
          <div className="journey__panel-inner">
            <span className="journey__index">02</span>
            <h3 className="journey__display-md">
              INTELLIGENCE
              <br />
              IN THE AIR
            </h3>
            <p className="journey__copy">
              Autonomous systems that turn complex aerial environments into actionable information.
            </p>
            <div className="capability-list">
              <div className="capability-list__item">
                <span className="capability-list__num">01 — ROBOTICS</span>
                <span className="capability-list__title">Robotic systems</span>
                <p className="capability-list__desc">BOT development and UAV/robot integration and research.</p>
              </div>
              <div className="capability-list__item">
                <span className="capability-list__num">02 — AI</span>
                <span className="capability-list__title">Artificial intelligence</span>
                <p className="capability-list__desc">Generative AI awareness, training and applied research.</p>
              </div>
              <div className="capability-list__item">
                <span className="capability-list__num">03 — R&amp;D</span>
                <span className="capability-list__title">Research &amp; development</span>
                <p className="capability-list__desc">
                  UAV and robotics research for defence and public-sector applications.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="journey__panel journey__panel--left" ref={panel3Ref}>
          <div className="journey__panel-inner">
            <span className="journey__index">03</span>
            <h3 className="journey__display-md">
              MANUFACTURING LOCALLY.
              <br />
              TRAINING NATIONALLY.
            </h3>
            <p className="journey__copy">
              Sky Eye Technology (SET) Pvt. Ltd. designs, assembles, manufactures, tests and
              commissions professional-grade UAVs and robotic systems for industrial, agricultural,
              public-sector, security and defence work.
            </p>
            <div className="spec-list">
              {STATS.map((s) => (
                <div className="spec-list__item" key={s.label}>
                  <span className="spec-list__value">{s.value}</span>
                  <span className="spec-list__label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="journey__loading" aria-live="polite">
            <span>LOADING FLIGHT FRAMES · {Math.round(progress * 100)}%</span>
            <span className="journey__loading-bar">
              <span style={{ width: `${Math.round((progress / 0.35) * 100)}%` }} />
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
