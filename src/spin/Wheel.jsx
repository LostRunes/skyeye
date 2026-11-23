import { useEffect, useRef, useState } from 'react'

// The prize wheel. Segments come from the `prizes` table (name, icon, colour).
// It never decides anything: give it `landOn` (a prize id from the server's
// spin result) and bump `spinKey`, and it spins round and stops on that prize.
const R = 190
const C = 200

// Dark ink text on light segments, cream text on dark ones
const inkOn = (hex = '#e6d4bf') => {
  const n = parseInt(hex.replace('#', ''), 16)
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.6 ? '#2f2926' : '#f6eedc'
}

const point = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

export default function Wheel({ prizes, landOn, spinKey, onDone, duration = 5200, hub = null, className = '' }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  const n = Math.max(prizes.length, 1)
  const seg = 360 / n

  useEffect(() => {
    if (!spinKey) return undefined
    const i = prizes.findIndex((p) => p.id === landOn)
    if (i < 0) {
      done.current?.()
      return undefined
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const jitter = (Math.random() - 0.5) * seg * 0.5
    setRotation((r) => r - (r % 360) + 360 * (reduced ? 1 : 7) + (360 - (i * seg + seg / 2)) + jitter)
    setSpinning(true)
    const t = setTimeout(
      () => {
        setSpinning(false)
        done.current?.()
      },
      reduced ? 300 : duration,
    )
    return () => clearTimeout(t)
    // Only a new spinKey starts a spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey])

  const slice = (i) => {
    if (n === 1) return `M${C},${C - R} A${R},${R} 0 1 1 ${C - 0.01},${C - R} Z`
    const [x1, y1] = point(i * seg, R)
    const [x2, y2] = point((i + 1) * seg, R)
    return `M${C},${C} L${x1},${y1} A${R},${R} 0 ${seg > 180 ? 1 : 0} 1 ${x2},${y2} Z`
  }

  return (
    <div className={`sw-wheel ${spinning ? 'is-spinning' : ''} ${className}`}>
      <div className="sw-pointer" aria-hidden="true">
        <svg viewBox="0 0 60 78" className="sw-pointer-svg">
          <path d="M30 76 L8 30 A24 24 0 1 1 52 30 Z" fill="#b22026" stroke="#2f2926" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="30" cy="24" r="9" fill="#e9dbbd" stroke="#2f2926" strokeWidth="3" />
        </svg>
      </div>
      <div className="sw-wheel-ring">
        <svg
          viewBox="0 0 400 400"
          className="sw-wheel-svg"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}
          role="img"
          aria-label={`Prize wheel: ${prizes.map((p) => p.name).join(', ')}`}
        >
          {prizes.map((p, i) => {
            const mid = i * seg + seg / 2
            const [ix, iy] = point(mid, R * 0.78)
            const [tx, ty] = point(mid, R * 0.52)
            return (
              <g key={p.id}>
                <path d={slice(i)} fill={p.color || '#e6d4bf'} stroke="#2f2926" strokeWidth="2.5" />
                <text x={ix} y={iy} className="sw-seg-icon" fill={inkOn(p.color)} transform={`rotate(${mid}, ${ix}, ${iy})`} textAnchor="middle" dominantBaseline="central">
                  {p.icon || 'redeem'}
                </text>
                <text x={tx} y={ty} className="sw-seg-label" fill={inkOn(p.color)} transform={`rotate(${mid}, ${tx}, ${ty})`} textAnchor="middle" dominantBaseline="central">
                  {p.name}
                </text>
              </g>
            )
          })}
          <circle cx={C} cy={C} r={R} fill="none" stroke="#2f2926" strokeWidth="6" />
          {Array.from({ length: n * 2 }, (_, i) => {
            const [x, y] = point((i * seg) / 2, R + 0.5)
            return <circle key={i} cx={x} cy={y} r="4.5" className={`sw-bulb ${i % 2 ? 'sw-bulb--b' : ''}`} />
          })}
        </svg>
        <div className="sw-hub">{hub}</div>
      </div>
    </div>
  )
}
