import { useEffect, useMemo, useRef, useState } from 'react'
import CoursePoster from './CoursePoster'

// The course carousel: posters stand on a 3D cylinder (after React Bits'
// CircularCarousel) and flex like liquid as it moves (after FlexCarousel):
// cards bend away from the front, squeeze at the sides, lean and colour-split
// with the spin speed, and the front card swells like it sits under a lens.
// Drag or swipe with momentum, use the arrows or keys, or click a card; it
// always settles on one course, which is reported through onChange.
const RING = 10 // courses repeat round the ring so the cylinder looks full
const SPRING = 120
const TILT = -6
const TO_RAD = Math.PI / 180

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180
const smooth = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}
const pad = (n) => String(n).padStart(2, '0')

// Odometer-style counter
const Digits = ({ value }) => (
  <span className="ccx-digits">
    {pad(value)
      .split('')
      .map((d, k) => (
        <span key={k} className="ccx-digit">
          <span className="ccx-reel" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
            {'0123456789'.split('').map((x) => (
              <span key={x}>{x}</span>
            ))}
          </span>
        </span>
      ))}
  </span>
)

export default function CourseCarousel({ courses, active, onChange, onOpen, trackLabel }) {
  const n = courses.length
  const ring = useMemo(() => Array.from({ length: Math.ceil(RING / n) * n }, (_, j) => j % n), [n])
  const count = ring.length
  const step = 360 / count

  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const cardRefs = useRef([])
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const st = useRef(null)
  if (!st.current) {
    st.current = { angle: -active * step, vel: 0, target: null, drag: false, press: null, dirty: true, suppress: false, reported: active, live: active, R: 420 }
  }
  const [live, setLive] = useState(active)
  const [dragging, setDragging] = useState(false)

  const indexAt = (angle) => ring[((Math.round(-angle / step) % count) + count) % count]
  const nearest = (angle) => Math.round(angle / step) * step

  const stepBy = (delta) => {
    const s = st.current
    s.target = (s.target ?? nearest(s.angle)) - delta * step
  }
  const focusRing = (j) => {
    const s = st.current
    let t = -j * step
    t += 360 * Math.round((s.angle - t) / 360)
    s.target = t
  }

  // Another control (detail arrows, a #course- link) picked a course
  useEffect(() => {
    const s = st.current
    if (active === s.reported) return
    s.reported = active
    let best = null
    for (let j = 0; j < count; j++) {
      if (ring[j] !== active) continue
      let t = -j * step
      t += 360 * Math.round((s.angle - t) / 360)
      if (best === null || Math.abs(t - s.angle) < Math.abs(best - s.angle)) best = t
    }
    s.target = best
  }, [active, ring, count, step])

  useEffect(() => {
    const root = rootRef.current
    const s = st.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let visible = true
    let last = 0

    const measure = () => {
      const w = root.clientWidth
      const cw = w < 640 ? Math.min(w * 0.54, 220) : clamp(w * 0.21, 220, 280)
      s.R = (cw * 1.12) / (2 * Math.sin(Math.PI / count))
      root.style.setProperty('--cw', `${cw.toFixed(1)}px`)
      root.style.setProperty('--persp', `${w < 640 ? 1100 : 1900}px`)
      s.dirty = true
    }

    const render = () => {
      const v = reduced ? 0 : clamp(s.vel / 520, -1, 1)
      const av = Math.abs(v)
      const R = s.R * (1 + 0.05 * av)
      ringRef.current.style.transform = `translateZ(${(-R).toFixed(1)}px) rotateX(${TILT}deg) rotateY(${s.angle.toFixed(3)}deg)`
      for (let j = 0; j < count; j++) {
        const el = cardRefs.current[j]
        if (!el) continue
        const base = j * step
        const world = wrap(base + s.angle)
        const a = Math.abs(world)
        const near = smooth(1 - a / (step * 1.15))
        const lens = 1 + 0.13 * near
        const squeeze = 1 - 0.2 * smooth(a / 90)
        const bend = Math.sign(world) * Math.min(a, 80) * 0.2 - v * 12 * (0.4 + near)
        const skew = v * 6 * (0.3 + near)
        el.style.transform =
          `rotateY(${base}deg) translateZ(${R.toFixed(1)}px) rotateY(${bend.toFixed(2)}deg) ` +
          `skewY(${skew.toFixed(2)}deg) scale(${(lens * squeeze).toFixed(3)}, ${lens.toFixed(3)})`
        el.style.setProperty('--shade', (0.66 * Math.pow((1 - Math.cos(world * TO_RAD)) / 2, 1.2)).toFixed(3))
        el.toggleAttribute('data-front', near > 0.5)
      }
      root.toggleAttribute('data-moving', av > 0.08)
      root.style.setProperty('--disp', (av * 5).toFixed(2))
      const idx = indexAt(s.angle)
      if (idx !== s.live) {
        s.live = idx
        setLive(idx)
      }
    }

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) {
        last = 0
        return
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60
      last = now
      let busy = s.drag || s.dirty
      if (!s.drag) {
        if (s.target !== null) {
          const damping = 2 * Math.sqrt(SPRING)
          for (let rem = dt; rem > 0; rem -= 1 / 240) {
            const h = Math.min(rem, 1 / 240)
            s.vel += (SPRING * (s.target - s.angle) - damping * s.vel) * h
            s.angle += s.vel * h
          }
          if (Math.abs(s.target - s.angle) < 0.01 && Math.abs(s.vel) < 0.05) {
            s.angle = s.target
            s.vel = 0
            s.target = null
            const idx = indexAt(s.angle)
            if (idx !== s.reported) {
              s.reported = idx
              onChangeRef.current?.(idx)
            }
          }
          busy = true
        } else if (Math.abs(s.vel) > 0.01) {
          // Coasting after a throw, then snap to the nearest card
          s.vel *= Math.exp(-dt / 0.45)
          s.angle += s.vel * dt
          if (Math.abs(s.vel) < 14) s.target = nearest(s.angle)
          busy = true
        }
      }
      if (busy) {
        s.dirty = false
        render()
      }
    }

    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) s.dirty = true
    })
    io.observe(root)
    measure()
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
    // indexAt/nearest only read count/step/ring, fixed for this mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, step])

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return
    const s = st.current
    s.suppress = false
    s.press = { id: e.pointerId, x: e.clientX, y: e.clientY, angle: s.angle, moved: false, samples: [{ t: performance.now(), a: s.angle }] }
  }

  const onPointerMove = (e) => {
    const s = st.current
    const root = rootRef.current
    if (e.pointerType === 'mouse') {
      const r = root.getBoundingClientRect()
      root.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
      root.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
    }
    const p = s.press
    if (!p || p.id !== e.pointerId) return
    const dx = e.clientX - p.x
    if (!p.moved) {
      if (Math.abs(dx) < 5) return
      // A mostly vertical swipe on touch is a page scroll, not a spin
      if (e.pointerType !== 'mouse' && Math.abs(e.clientY - p.y) > Math.abs(dx) * 1.2) {
        s.press = null
        return
      }
      p.moved = true
      p.origin = dx
      s.drag = true
      s.target = null
      s.vel = 0
      setDragging(true)
      try {
        root.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone */
      }
    }
    s.angle = p.angle + (dx - p.origin) * (180 / (Math.PI * s.R))
    const now = performance.now()
    p.samples.push({ t: now, a: s.angle })
    while (p.samples.length > 2 && now - p.samples[0].t > 110) p.samples.shift()
    s.dirty = true
  }

  const release = (e) => {
    const s = st.current
    const p = s.press
    if (!p || p.id !== e.pointerId) return
    s.press = null
    if (!p.moved) return
    s.drag = false
    s.suppress = true
    setDragging(false)
    const first = p.samples[0]
    const lastS = p.samples[p.samples.length - 1]
    const span = (lastS.t - first.t) / 1000
    s.vel = span > 0.008 ? clamp((lastS.a - first.a) / span, -900, 900) : 0
    s.target = nearest(s.angle + s.vel * 0.32)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') stepBy(1)
    else if (e.key === 'ArrowLeft') stepBy(-1)
    else if (e.key === 'Enter') onOpen?.()
    else return
    e.preventDefault()
  }

  const cur = courses[live]

  return (
    <div
      className="ccx"
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Courses"
      data-dragging={dragging ? '' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={onKeyDown}
    >
      <div className="ccx-view">
        <div className="ccx-ring" ref={ringRef}>
          {ring.map((ci, j) => (
            <div
              key={j}
              className="ccx-card"
              ref={(el) => (cardRefs.current[j] = el)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${courses[ci].title}, ${ci + 1} of ${n}`}
              aria-hidden={j >= n ? true : undefined}
              onClick={() => {
                const s = st.current
                if (s.suppress) {
                  s.suppress = false
                  return
                }
                if (ring[j] === s.live && s.target === null) onOpen?.()
                else focusRing(j)
              }}
            >
              <div className="ccx-face ccx-front">
                <CoursePoster c={courses[ci]} i={ci} total={n} />
                <span className="ccx-shade" />
              </div>
              <div className="ccx-face ccx-back">
                <span>{pad(ci + 1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ccx-caption">
        <button type="button" className="ccx-arrow" onClick={() => stepBy(-1)} aria-label="Previous course">
          ←
        </button>
        <div className="ccx-now" aria-live="polite">
          <span className="ccx-sub">
            {trackLabel(cur.group)} · {cur.level}
          </span>
          <strong key={live} className="ccx-title">
            {cur.short || cur.title}
          </strong>
          <span className="ccx-count">
            <Digits value={live + 1} />
            <span>/</span>
            <span>{pad(n)}</span>
          </span>
        </div>
        <button type="button" className="ccx-arrow" onClick={() => stepBy(1)} aria-label="Next course">
          →
        </button>
      </div>
      <p className="ccx-hint">Drag, swipe or use the arrows · scroll down for the full course ↓</p>
    </div>
  )
}
