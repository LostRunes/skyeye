import { useEffect, useRef, useState } from 'react'
import { clamp, piecewise, beatVisibility, smoothstep } from '../utils/motion'
import { CDN } from '../cdn'
import { useImageSequence } from '../hooks/useImageSequence'

// The scroll-scrubbed drone from the first drafts of the main site, reused on
// the courses site right after the hero. The same two acts, in the same
// order: the assembly act (frames2) builds the drone, then a cut to the
// flight act (frames) where it unfolds and flies. The drone glides in from
// the right edge as the hero scrolls away, and three text beats on the left
// tie each stage to a course.
const SEQUENCES = [
  { key: 'assembly', folder: `${CDN}/frames2`, count: 90 },
  { key: 'flight', folder: `${CDN}/frames`, count: 57 },
]

const SPLIT = 0.6

const FRAME_CURVE_ASSEMBLY = [
  { p: 0, v: 0 },
  { p: 0.06, v: 0.02 },
  { p: SPLIT, v: 1 },
]
const FRAME_CURVE_FLIGHT = [
  { p: SPLIT, v: 0 },
  { p: 1, v: 1 },
]

// Horizontal position of the drone: 1.6 = off the right edge, 1 = right half
const X_CURVE = [
  { p: 0, v: 1.6 },
  { p: 0.12, v: 1 },
  { p: SPLIT, v: 1 },
  { p: SPLIT + 0.2 * (1 - SPLIT), v: 0.9 },
  { p: 1, v: 1 },
]
const ZOOM_CURVE = [
  { p: 0, v: 0.86 },
  { p: 0.12, v: 1 },
  { p: SPLIT - 0.08, v: 1.25 },
  { p: SPLIT, v: 1 },
  { p: 1, v: 1.08 },
]

const BEATS = [
  {
    range: [-0.05, 0.3],
    kicker: 'STEP 01 · UNDERSTAND',
    title: 'Every part, explained.',
    text: 'Frame, motors, flight controller, camera. Know what each part does and why it’s there.',
    course: 'Drone Explorer',
    href: '#course-drone-basic',
  },
  {
    range: [0.3, SPLIT + 0.04],
    kicker: 'STEP 02 · BUILD',
    title: 'Design it. Build it.',
    text: 'Aerodynamics, CAD and electronics, brought together into a drone you assemble yourself.',
    course: 'UAV Masterclass',
    href: '#course-drone-advanced',
  },
  {
    range: [SPLIT + 0.04, 1.08],
    kicker: 'STEP 03 · FLY',
    title: 'Then take it up.',
    text: 'From the simulator to real flights, and on to fast, first-person FPV.',
    course: 'FPV Flight Academy',
    href: '#course-drone-fpv',
  },
]

const SMOOTHING = 0.1
const SETTLE_EPSILON = 0.0006

const nearest = (arr, idx) => {
  if (arr[idx]) return arr[idx]
  for (let d = 1; d < arr.length; d++) {
    if (arr[idx - d]) return arr[idx - d]
    if (arr[idx + d]) return arr[idx + d]
  }
  return null
}

export default function CourseDroneJourney() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const beatRefs = useRef([])
  const barRef = useRef(null)
  const rawRef = useRef(0)
  const smoothedRef = useRef(0)
  const runningRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const reducedRef = useRef(false)

  const [near, setNear] = useState(false)
  const { images, progress } = useImageSequence(SEQUENCES, near)
  const renderRef = useRef(() => {})

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = containerRef.current
    if (!el) return
    // Start streaming frames well before the section arrives
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setNear(true)
        io.disconnect()
      },
      { rootMargin: '150% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  renderRef.current = () => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const { w, h, dpr } = sizeRef.current
    const p = smoothedRef.current
    const flight = p >= SPLIT
    const active = flight ? images.flight : images.assembly
    const curve = flight ? FRAME_CURVE_FLIGHT : FRAME_CURVE_ASSEMBLY

    if (w > 0 && h > 0) {
      const idx = clamp(Math.round(piecewise(p, curve) * (active.length - 1)), 0, active.length - 1)
      const img = nearest(active, idx)
      const ctx = canvas.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (img) {
        const iw = img.naturalWidth || img.width
        const ih = img.naturalHeight || img.height
        const scale = Math.min(w / iw, h / ih)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.drawImage(img, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale)
      }
    }

    // Phones: the drone sits above the text, so it only slides in, never sideways
    const mobile = window.innerWidth <= 820
    const half = mobile ? window.innerWidth * 0.5 : Math.min(window.innerWidth * 0.24, 380)
    const x = piecewise(p, X_CURVE)
    const shift = mobile ? (x - 1) * window.innerWidth : x * half
    wrap.style.transform = `translate(-50%, -50%) translateX(${shift.toFixed(1)}px) scale(${piecewise(p, ZOOM_CURVE).toFixed(3)})`
    wrap.style.opacity = smoothstep(0, 0.08, p).toFixed(3)

    BEATS.forEach((b, i) => {
      const el = beatRefs.current[i]
      if (!el) return
      const { opacity, translate } = beatVisibility(p, b.range)
      el.style.opacity = opacity
      el.style.transform = `translateY(${translate}px)`
      el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
    })
    if (barRef.current) barRef.current.style.transform = `scaleX(${p.toFixed(4)})`
  }

  const tick = () => {
    const raw = rawRef.current
    const next = smoothedRef.current + (raw - smoothedRef.current) * (reducedRef.current ? 1 : SMOOTHING)
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

  useEffect(() => {
    renderRef.current()
  }, [progress])

  useEffect(() => {
    const ensure = () => {
      if (runningRef.current) return
      runningRef.current = true
      requestAnimationFrame(tick)
    }
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      // Starts while the hero is still leaving (top of section at the bottom of the screen)
      rawRef.current = clamp((window.innerHeight * 0.55 - r.top) / (total + window.innerHeight * 0.55))
      ensure()
    }
    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      const rect = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.round(rect.width * dpr)
      c.height = Math.round(rect.height * dpr)
      sizeRef.current = { w: rect.width, h: rect.height, dpr }
    }
    resize()
    measure()
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
    // tick/render read refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="cs-journey" ref={containerRef} aria-label="From parts to flight">
      <div className="cs-journey-stage">
        <div className="cs-journey-grid" aria-hidden="true" />
        <div className="cs-journey-drone" ref={wrapRef} aria-hidden="true">
          <canvas ref={canvasRef} />
        </div>
        <div className="cs-wrap cs-journey-copy">
          {BEATS.map((b, i) => (
            <div key={b.kicker} className="cs-journey-beat" ref={(el) => (beatRefs.current[i] = el)}>
              <span className="cs-kicker">{b.kicker}</span>
              <h2 className="cs-h2">{b.title}</h2>
              <p className="cs-lead">{b.text}</p>
              <a className="cs-journey-link" href={b.href}>
                {b.course} →
              </a>
            </div>
          ))}
        </div>
        {near && progress < 0.3 && <span className="cs-journey-loading">Loading flight frames · {Math.round(progress * 100)}%</span>}
        <div className="cs-journey-bar" aria-hidden="true">
          <span ref={barRef} />
        </div>
      </div>
    </section>
  )
}
