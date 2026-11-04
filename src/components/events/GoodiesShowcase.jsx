import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { EVENTS } from '../../data/event'
import { importScene, resilient } from '../../three/resilient'

// "What you can win" at the MUN stall, as a 3D turntable: one goodie at a
// time, spinning on its own, draggable, with < > to swoosh to the next one.
// The models are built in src/three/goodiesScene.js, which is only fetched
// once the showcase nears the viewport. Styles: src/goodies.css.

// Prize name (src/data/event.js) -> the model the scene builds for it
const KINDS = { 'Pilot card': 'card', Keychain: 'keychain', Mug: 'mug', Bottle: 'bottle', Stickers: 'stickers', Toffees: 'toffees' }
// Shown when a prize has no `note` of its own
const NOTES = {
  keychain: 'Metal Sky Eye keychain with a drone charm',
  mug: 'Sky Eye ceramic mug',
  bottle: 'Sky Eye water bottle',
  stickers: 'A pack of Sky Eye stickers',
}

const PRIZES = (EVENTS[0]?.stall?.prizes || [])
  .filter((p) => KINDS[p.name])
  .map((p) => ({ ...p, kind: KINDS[p.name], note: p.note || NOTES[KINDS[p.name]] || '' }))
// Open on the mug
const START = Math.max(PRIZES.findIndex((p) => p.kind === 'mug'), 0)
const pad = (n) => String(n).padStart(2, '0')

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function GoodiesShowcase() {
  const { theme } = useTheme()
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const [index, setIndex] = useState(START)
  const indexRef = useRef(START)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)

  // Mount the scene once the stage is within reach of the viewport
  useEffect(() => {
    let cancelled = false
    const el = stageRef.current
    if (!el || !PRIZES.length) return
    const start = () => {
      importScene(() => import('../../three/goodiesScene.js'))
        .then(({ mountGoodies }) => {
          if (cancelled || !canvasRef.current) return
          sceneRef.current = resilient(mountGoodies, canvasRef.current, {
            items: PRIZES.map((p) => p.kind),
            index: indexRef.current,
            dark: document.documentElement.dataset.theme === 'dark',
          })
          setReady(true)
        })
        .catch(() => setFailed(true))
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        start()
      },
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setTheme(theme === 'dark')
  }, [theme, ready])

  // React owns the index; the scene is told where to go (goTo is safe to
  // replay if the scene restarts after a lost WebGL context).
  const go = useCallback((i, dir) => {
    const n = PRIZES.length
    const next = ((i % n) + n) % n
    if (next === indexRef.current) return
    indexRef.current = next
    setIndex(next)
    sceneRef.current?.goTo(next, dir)
  }, [])
  const step = (dir) => go(indexRef.current + dir, dir)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
    else return
    e.preventDefault()
  }

  if (!PRIZES.length) return null
  const prize = PRIZES[index]

  return (
    <div className="goodies" role="region" aria-roledescription="carousel" aria-label="Goodies you can win" onKeyDown={onKeyDown}>
      <div
        className="goodies-stage"
        ref={stageRef}
        tabIndex={0}
        aria-label="Goodie viewer. Use the left and right arrow keys to change goodie."
      >
        <div className="goodies-canvas" ref={canvasRef} aria-hidden="true" />
        {failed && (
          <div className="goodies-fallback" aria-hidden="true">
            <span className="material-symbols-outlined">{prize.icon}</span>
          </div>
        )}
        <button type="button" className="goodies-arrow goodies-arrow--prev" aria-label="Previous goodie" onClick={() => step(-1)}>
          <Chevron dir={-1} />
        </button>
        <button type="button" className="goodies-arrow goodies-arrow--next" aria-label="Next goodie" onClick={() => step(1)}>
          <Chevron dir={1} />
        </button>
        <span className="goodies-count" aria-hidden="true">
          {pad(index + 1)} / {pad(PRIZES.length)}
        </span>
        {!failed && (
          <span className="goodies-hint" aria-hidden="true">
            [ DRAG TO SPIN ]
          </span>
        )}
      </div>

      <div className="goodies-caption" aria-live="polite" aria-atomic="true">
        <div className="goodies-caption-inner" key={prize.kind}>
          <h4 className="goodies-name">{prize.name}</h4>
          {prize.note && <p className="goodies-note">{prize.note}</p>}
        </div>
      </div>

      <ul className="goodies-dots">
        {PRIZES.map((p, i) => (
          <li key={p.kind}>
            <button
              type="button"
              className={i === index ? 'is-active' : undefined}
              aria-current={i === index ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => go(i)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {p.icon}
              </span>
              <span className="goodies-dot-label">{p.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
