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

// The "Better luck next time" prize (is_blank) shows as a few slices spread
// round the wheel, between the goodies.
function layout(prizes) {
  const goods = prizes.filter((p) => !p.is_blank)
  const blank = prizes.find((p) => p.is_blank)
  if (!blank) return goods
  if (!goods.length) return [blank]
  const copies = Math.max(1, Math.min(3, Math.floor(goods.length / 2)))
  const every = Math.ceil(goods.length / copies)
  const slots = []
  goods.forEach((p, i) => {
    slots.push(p)
    if ((i + 1) % every === 0 && slots.filter((s) => s.is_blank).length < copies) slots.push(blank)
  })
  while (slots.filter((s) => s.is_blank).length < copies) slots.push(blank)
  return slots
}

// Long names go on two lines
const lines = (name = '') => {
  if (name.length <= 11 || !name.includes(' ')) return [name]
  const words = name.split(' ')
  let best = 1
  for (let k = 1; k < words.length; k++) {
    const a = words.slice(0, k).join(' ').length
    const b = words.slice(k).join(' ').length
    const bestA = words.slice(0, best).join(' ').length
    if (Math.abs(a - b) < Math.abs(bestA - words.slice(best).join(' ').length)) best = k
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

export default function Wheel({ prizes: list, landOn, spinKey, onDone, duration = 5200, hub = null, className = '' }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  const prizes = layout(list)
  const n = Math.max(prizes.length, 1)
  const many = n > 7
  const seg = 360 / n

  useEffect(() => {
    if (!spinKey) return undefined
    const spots = prizes.map((p, k) => (p.id === landOn ? k : -1)).filter((k) => k >= 0)
    const i = spots.length ? spots[Math.floor(Math.random() * spots.length)] : -1
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
    <div className={`sw-wheel ${spinning ? 'is-spinning' : ''} ${many ? 'sw-wheel--many' : ''} ${className}`}>
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
          aria-label={`Prize wheel: ${list.map((p) => p.name).join(', ')}`}
        >
          {prizes.map((p, i) => {
            const mid = i * seg + seg / 2
            const [ix, iy] = point(mid, R * (many ? 0.84 : 0.78))
            const [tx, ty] = point(mid, R * (many ? 0.5 : 0.52))
            // Many slices: labels run along the slice (flipped on the left so they never read upside down)
            const turn = many ? (mid % 360 > 180 ? mid + 90 : mid - 90) : mid
            const label = lines(p.name)
            return (
              <g key={`${p.id}-${i}`}>
                <path d={slice(i)} fill={p.color || '#e6d4bf'} stroke="#2f2926" strokeWidth="2.5" />
                <text x={ix} y={iy} className="sw-seg-icon" fill={inkOn(p.color)} transform={`rotate(${mid}, ${ix}, ${iy})`} textAnchor="middle" dominantBaseline="central">
                  {p.icon || 'redeem'}
                </text>
                <text
                  x={tx}
                  y={ty}
                  className={`sw-seg-label${label.length > 1 ? ' sw-seg-label--2' : ''}`}
                  fill={inkOn(p.color)}
                  transform={`rotate(${turn}, ${tx}, ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {label.length > 1 ? (
                    <>
                      <tspan x={tx} dy="-0.55em">
                        {label[0]}
                      </tspan>
                      <tspan x={tx} dy="1.1em">
                        {label[1]}
                      </tspan>
                    </>
                  ) : (
                    p.name
                  )}
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
