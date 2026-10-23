import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EVENT } from '../data/event'

// Announcement pop-up shown once per visit (per browser session). Two drones
// carry the square card down by its top corners; it settles with a gentle
// sway, and on close they lift it back up and away. Content: src/data/event.js.

const STORE = `skyeye-popup-${EVENT.id}`
const ENTER = 2.3 // seconds
const EXIT = 1.15

const seen = () => {
  try {
    return sessionStorage.getItem(STORE) === '1'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    sessionStorage.setItem(STORE, '1')
  } catch {
    /* private mode — it may show again next visit */
  }
}
const isOver = () => {
  const end = new Date(`${EVENT.endsOn}T23:59:59`)
  return Number.isFinite(end.getTime()) && Date.now() > end.getTime()
}

const easeOutBack = (t) => {
  const c1 = 1.25
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
const easeInCubic = (t) => t * t * t

export default function EventPopup() {
  const [open, setOpen] = useState(() => EVENT.enabled && !seen() && !isOver())
  const [closing, setClosing] = useState(false)
  const cardRef = useRef(null)
  const layerRef = useRef(null)
  const dronesRef = useRef(null)
  const phase = useRef({ name: 'wait', t0: 0 })

  const close = useCallback(() => {
    if (phase.current.name === 'exit') return
    markSeen()
    phase.current = { name: 'exit', t0: performance.now() }
    setClosing(true)
  }, [])

  // Keyboard + page lock while open
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.classList.add('menu-locked')
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => {
      root.classList.remove('menu-locked')
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  // Animation: card position + the drones following its corners
  useEffect(() => {
    if (!open) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cancelled = false
    let raf = 0

    if (!reduced) {
      import('../three/popupDrones.js')
        .then(({ mountPopupDrones }) => {
          if (!cancelled && layerRef.current) dronesRef.current = mountPopupDrones(layerRef.current)
        })
        .catch(() => {})
    }

    // Short pause so the page paints first, then the drones fly in
    const start = window.setTimeout(() => {
      phase.current = { name: 'enter', t0: performance.now() }
      cardRef.current?.focus({ preventScroll: true })
    }, reduced ? 0 : 900)

    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const card = cardRef.current
      if (!card) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = card.offsetWidth
      const h = card.offsetHeight
      const droneRoom = Math.min(Math.max(w * 0.42, 110), 210) * 0.62 // space the drones need above
      const restY = droneRoom * 0.45 // sit a little low so the drones fit above
      const away = -(vh / 2 + h / 2 + droneRoom + 60)

      const { name, t0 } = phase.current
      const t = (now - t0) / 1000
      let y = away
      let lift = 1
      let opacity = 1
      if (name === 'wait') {
        y = away
      } else if (name === 'enter') {
        const k = reduced ? 1 : Math.min(t / ENTER, 1)
        y = away + (restY - away) * easeOutBack(k)
        if (k >= 1) phase.current = { name: 'idle', t0: now }
      } else if (name === 'idle') {
        y = restY + (reduced ? 0 : Math.sin(t * 1.3) * 4)
      } else if (name === 'exit') {
        const k = reduced ? 1 : Math.min(t / EXIT, 1)
        y = restY + (away - restY) * easeInCubic(k)
        lift = 1 + k * 0.4
        if (reduced) opacity = 0
        if (k >= 1) {
          cancelAnimationFrame(raf)
          setOpen(false)
          return
        }
      }
      // Sway: stronger while flying in, settling to a gentle swing
      const swayAmp = name === 'enter' ? 3.2 : name === 'exit' ? 2 : 1.1
      const angle = reduced ? 0 : Math.sin(now / 1000 * 1.15) * swayAmp
      card.style.transform = `translate(-50%, -50%) translateY(${y}px) rotate(${angle}deg)`
      card.style.opacity = String(opacity)

      // Top corners after rotation, in viewport px
      const cx = vw / 2
      const cy = vh / 2 + y
      const rad = (angle * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const corner = (dx, dy) => ({ x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos })
      const inset = Math.min(w * 0.06, 22)
      dronesRef.current?.setCorners([corner(-w / 2 + inset, -h / 2), corner(w / 2 - inset, -h / 2)], lift)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.clearTimeout(start)
      cancelAnimationFrame(raf)
      dronesRef.current?.dispose()
      dronesRef.current = null
    }
  }, [open])

  if (!open) return null
  const e = EVENT

  return createPortal(
    <div className={`event-pop${closing ? ' is-closing' : ''}`}>
      <div className="event-pop-backdrop" onClick={close} aria-hidden="true" />
      <div className="event-pop-drones" ref={layerRef} aria-hidden="true" />

      <div
        className="event-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-card-title"
        tabIndex={-1}
        style={{ transform: 'translate(-50%, -50%) translateY(-200vh)' }}
      >
        <button type="button" className="event-close" onClick={close} aria-label="Close announcement">
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <div className="event-top">
          <span className="event-kicker">
            <span className="event-dot" aria-hidden="true" />
            {e.kicker}
          </span>
          <h2 className="event-title" id="event-card-title">
            <span className="event-short">{e.short}</span>
            {e.title}
          </h2>
        </div>

        <div className="event-dates" aria-label={`${e.days.join(', ')} ${e.month}`}>
          {e.days.map((d) => (
            <span key={d} className="event-day">{d}</span>
          ))}
          <span className="event-month">{e.month}</span>
        </div>

        <p className="event-about">{e.about}</p>

        <div className="event-fee">
          <span className="event-fee-label">Delegate fee</span>
          <span className="event-fee-amount">{e.fee}</span>
          <span className="event-fee-note">{e.feeNote}</span>
        </div>

        <div className="event-stall">
          <span className="material-symbols-outlined event-stall-icon" aria-hidden="true">casino</span>
          <div>
            <strong>{e.stall.title}</strong>
            <span className="event-stall-where">{e.stall.where}</span>
            <p>{e.stall.text}</p>
          </div>
        </div>

        <div className="event-actions">
          <a className="btn-request btn-request--sm" href={e.cta.href} data-service={e.cta.service} onClick={close}>
            {e.cta.label}
          </a>
          <button type="button" className="event-later" onClick={close}>
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
