import { useRef, useState } from 'react'
import { confetti } from './confetti'

// Demo prize wheel — a taste of the real one at the stall. Purely for fun:
// nothing is won online, the result just celebrates.
const SEGMENTS = [
  { label: 'Goodie', win: true },
  { label: 'Spin again', win: false },
  { label: 'Mystery', win: true },
  { label: 'So close!', win: false },
  { label: 'Goodie', win: true },
  { label: 'Bonus game', win: true },
  { label: 'High five', win: false },
  { label: 'Jackpot', win: true },
]
const N = SEGMENTS.length
const SEG = 360 / N
const R = 150

const point = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [R + r * Math.cos(a), R + r * Math.sin(a)]
}
const slice = (i) => {
  const [x1, y1] = point(i * SEG, R)
  const [x2, y2] = point((i + 1) * SEG, R)
  return `M${R},${R} L${x1},${y1} A${R},${R} 0 0 1 ${x2},${y2} Z`
}

// Which segment to land on, and a little offset so it isn't always dead centre
const pick = () => ({ i: Math.floor(Math.random() * N), jitter: (Math.random() - 0.5) * SEG * 0.6 })

export default function SpinWheel() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [spins, setSpins] = useState(0)
  const wheelRef = useRef(null)
  const pending = useRef(0)

  const spin = () => {
    if (spinning) return
    const { i, jitter } = pick()
    // Land segment i's centre under the pointer at the top
    const target = 360 - (i * SEG + SEG / 2) + jitter
    const base = rotation - (rotation % 360)
    setResult(null)
    setSpinning(true)
    setRotation(base + 360 * 6 + target)
    pending.current = i
    // No transition to wait for when motion is reduced
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(() => finish(i), 50)
  }

  const finish = (i) => {
    const s = SEGMENTS[i]
    setSpinning(false)
    setSpins((n) => n + 1)
    setResult(s)
    if (s.win) {
      const r = wheelRef.current.getBoundingClientRect()
      confetti({ x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 3) / innerHeight })
    }
  }

  return (
    <div className="arcade-card arcade-wheel">
      <div className="arcade-card-head">
        <span className="arcade-tag">GAME 01 · DEMO</span>
        <h4>Spin the wheel</h4>
        <p>Have a practice spin. The real wheel — with real goodies — is at the stall.</p>
      </div>

      <div className="wheel-stage">
        <span className="wheel-pointer" aria-hidden="true" />
        <svg
          ref={wheelRef}
          className={`wheel${spinning ? ' is-spinning' : ''}`}
          viewBox={`0 0 ${R * 2} ${R * 2}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={() => spinning && finish(pending.current)}
          role="img"
          aria-label="Prize wheel"
        >
          {SEGMENTS.map((s, i) => {
            const [tx, ty] = point(i * SEG + SEG / 2, R * 0.62)
            return (
              <g key={i}>
                <path d={slice(i)} className={`wheel-seg wheel-seg--${i % 4}`} />
                <text
                  x={tx}
                  y={ty}
                  className="wheel-label"
                  transform={`rotate(${i * SEG + SEG / 2}, ${tx}, ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {s.label}
                </text>
              </g>
            )
          })}
          <circle cx={R} cy={R} r={R - 2} className="wheel-rim" />
        </svg>
        <button type="button" className="wheel-hub" onClick={spin} disabled={spinning}>
          {spinning ? '…' : 'SPIN'}
        </button>
      </div>

      <p className={`arcade-result${result ? ' is-on' : ''}`} aria-live="polite">
        {result
          ? result.win
            ? `🎉 ${result.label}! Come claim the real thing at the stall.`
            : `${result.label} — give it another spin.`
          : spins
            ? ' '
            : 'Tap SPIN to try your luck.'}
      </p>
    </div>
  )
}
