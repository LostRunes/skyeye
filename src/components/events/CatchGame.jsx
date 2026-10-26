import { useEffect, useRef, useState } from 'react'
import { confetti } from './confetti'

// "Catch the drone": a 20-second reflex game. A drone pops up somewhere in
// the arena; tap it before it flies off. Best score is kept on this device.
const ROUND = 20
const BEST_KEY = 'skyeye-catch-best'

const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

function DroneIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g className="catch-drone-arms">
        <line x1="14" y1="14" x2="50" y2="50" />
        <line x1="50" y1="14" x2="14" y2="50" />
      </g>
      {[
        [14, 14],
        [50, 14],
        [14, 50],
        [50, 50],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="10" className="catch-drone-prop" />
          <circle cx={x} cy={y} r="3" className="catch-drone-motor" />
        </g>
      ))}
      <rect x="24" y="24" width="16" height="16" rx="3" className="catch-drone-body" />
      <circle cx="32" cy="32" r="3" className="catch-drone-led" />
    </svg>
  )
}

export default function CatchGame() {
  const [state, setState] = useState('idle') // idle | playing | over
  const [score, setScore] = useState(0)
  const [left, setLeft] = useState(ROUND)
  const [best, setBest] = useState(readBest)
  const [pos, setPos] = useState({ x: 50, y: 50, k: 0 })
  const [pops, setPops] = useState([]) // "+1" floaters
  const arenaRef = useRef(null)
  const hopRef = useRef(0)
  const scoreRef = useRef(0)
  const leftRef = useRef(ROUND)
  const bestRef = useRef(best)

  const hop = () => {
    setPos((p) => ({ x: 8 + Math.random() * 84, y: 12 + Math.random() * 76, k: p.k + 1 }))
    clearTimeout(hopRef.current)
    // The drone gets twitchier as the score climbs
    hopRef.current = setTimeout(hop, Math.max(1100 - scoreRef.current * 35, 520))
  }

  const start = () => {
    scoreRef.current = 0
    leftRef.current = ROUND
    setScore(0)
    setLeft(ROUND)
    setState('playing')
    hop()
  }

  const finish = () => {
    clearTimeout(hopRef.current)
    setState('over')
    const final = scoreRef.current
    if (final > bestRef.current) {
      bestRef.current = final
      setBest(final)
      try {
        localStorage.setItem(BEST_KEY, String(final))
      } catch {
        /* storage blocked */
      }
      if (final > 0) {
        const r = arenaRef.current.getBoundingClientRect()
        confetti({ x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight })
      }
    }
  }

  // One-second clock while a round is running
  useEffect(() => {
    if (state !== 'playing') return
    const id = setInterval(() => {
      leftRef.current -= 1
      setLeft(leftRef.current)
      if (leftRef.current <= 0) finish()
    }, 1000)
    return () => clearInterval(id)
    // finish only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => () => clearTimeout(hopRef.current), [])

  const hit = (e) => {
    e.stopPropagation()
    scoreRef.current += 1
    setScore(scoreRef.current)
    const id = Date.now()
    setPops((ps) => [...ps.slice(-4), { id, x: pos.x, y: pos.y }])
    setTimeout(() => setPops((ps) => ps.filter((p) => p.id !== id)), 700)
    hop()
  }

  return (
    <div className="arcade-card arcade-catch">
      <div className="arcade-card-head">
        <span className="arcade-tag">GAME 02 · DEMO</span>
        <h4>Catch the drone</h4>
        <p>Tap the drone before it flies off. {ROUND} seconds. How fast are your hands?</p>
      </div>

      <div className="catch-hud">
        <span>
          SCORE <strong>{score}</strong>
        </span>
        <span>
          TIME <strong>{String(Math.max(left, 0)).padStart(2, '0')}</strong>
        </span>
        <span>
          BEST <strong>{best}</strong>
        </span>
      </div>

      <div className={`catch-arena is-${state}`} ref={arenaRef}>
        <div className="catch-radar" aria-hidden="true" />
        {state === 'playing' && (
          <button
            key={pos.k}
            type="button"
            className="catch-drone"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onPointerDown={hit}
            aria-label="Catch the drone"
          >
            <DroneIcon />
          </button>
        )}
        {pops.map((p) => (
          <span key={p.id} className="catch-pop" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
            +1
          </span>
        ))}
        {state !== 'playing' && (
          <div className="catch-overlay">
            {state === 'over' && (
              <p className="catch-final">
                {score} caught{score >= best && score > 0 ? ' · new best!' : ''}
              </p>
            )}
            <button type="button" className="btn-request btn-request--sm" onClick={start}>
              {state === 'over' ? 'Play again' : 'Start'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
